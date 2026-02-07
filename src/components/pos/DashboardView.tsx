import { usePOS } from '@/store/posStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    Calendar,
    CreditCard,
    TrendingUp,
    User,
    Users,
    Plus,
    Pencil,
    Trash2,
    Clock,
    CircleDot
} from 'lucide-react';
import { startOfDay, startOfMonth, isAfter, format, parseISO } from 'date-fns';
import { UserManagementDialog } from '@/components/pos/UserManagementDialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { Staff } from '@/types/pos';

export function DashboardView() {
    const { state, removeStaff } = usePOS();
    const { orders, currentStaff, staff } = state;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

    if (!currentStaff) return null;

    const isManager = currentStaff.role === 'manager' || currentStaff.role === 'admin';
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());

    // Helper to filter orders
    const getOrdersStats = (waiterId?: string) => {
        const relevantOrders = waiterId
            ? orders.filter(o => o.waiterId === waiterId)
            : orders;

        const dailyOrders = relevantOrders.filter(o =>
            isAfter(new Date(o.createdAt), today)
        );

        const monthlyOrders = relevantOrders.filter(o =>
            isAfter(new Date(o.createdAt), thisMonth)
        );

        const dailyRevenue = dailyOrders.reduce((sum, o) => sum + o.total, 0);
        const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.total, 0);

        return {
            dailyCount: dailyOrders.length,
            monthlyCount: monthlyOrders.length,
            dailyRevenue,
            monthlyRevenue
        };
    };

    // Stats for the current user
    const myStats = getOrdersStats(currentStaff.id);

    const handleAddStaff = () => {
        setStaffToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditStaff = (member: Staff) => {
        setStaffToEdit(member);
        setIsDialogOpen(true);
    };

    const handleDeleteStaff = (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name}?`)) {
            removeStaff(id);
        }
    };

    // Key Metrics Cards
    const MetricCard = ({ title, value, subtext, icon: Icon, color }: any) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 overflow-auto bg-slate-50/50">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">
                        Welcome back, {currentStaff.name} ({currentStaff.role})
                    </span>
                </div>
            </div>

            {/* Overview Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Today's Orders"
                    value={isManager ? getOrdersStats().dailyCount : myStats.dailyCount}
                    subtext={format(new Date(), 'MMM dd, yyyy')}
                    icon={TrendingUp}
                    color="text-green-500"
                />
                <MetricCard
                    title="Monthly Orders"
                    value={isManager ? getOrdersStats().monthlyCount : myStats.monthlyCount}
                    subtext={format(new Date(), 'MMMM yyyy')}
                    icon={Calendar}
                    color="text-blue-500"
                />
                {isManager && (
                    <>
                        <MetricCard
                            title="Today's Revenue"
                            value={`$${getOrdersStats().dailyRevenue.toFixed(2)}`}
                            subtext="Total Sales"
                            icon={CreditCard}
                            color="text-orange-500"
                        />
                        <MetricCard
                            title="Monthly Revenue"
                            value={`$${getOrdersStats().monthlyRevenue.toFixed(2)}`}
                            subtext="Total Sales"
                            icon={BarChart3}
                            color="text-purple-500"
                        />
                    </>
                )}
            </div>

            {/* Waiter Performance Section (Manager Only) */}
            {isManager && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                    <Card className="col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Staff Performance</CardTitle>
                            <Button size="sm" onClick={handleAddStaff} className="bg-orange-500 hover:bg-orange-600 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Staff
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {staff
                                    .filter(s => ['admin', 'manager', 'waiter', 'chef', 'cashier'].includes(s.role))
                                    .map(member => {
                                        const stats = getOrdersStats(member.id);
                                        const isOnline = member.isOnline;

                                        return (
                                            <div key={member.id} className="flex items-center justify-between group">
                                                <div className="flex items-center">
                                                    <div className="relative">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                                                            <User className="h-5 w-5 text-slate-500" />
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                                                    </div>
                                                    <div className="ml-4 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium leading-none">{member.name}</p>
                                                            {member.attendance?.status === 'late' && (
                                                                <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">
                                                                    LATE (+{member.attendance.lateMinutes}m)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="capitalize">{member.role}</span>
                                                            {member.attendance?.firstLogin && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    In: {format(parseISO(member.attendance.firstLogin), 'h:mm a')}
                                                                </span>
                                                            )}
                                                            {(member.dailyOnlineMinutes !== undefined || isOnline) && (
                                                                <span className="flex items-center gap-1">
                                                                    <CircleDot className="h-3 w-3" />
                                                                    {Math.floor((member.dailyOnlineMinutes || 0) / 60)}h {(member.dailyOnlineMinutes || 0) % 60}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right text-sm">
                                                        <div className="text-green-600 font-medium">{stats.dailyCount} orders</div>
                                                        <div className="text-slate-500 text-xs">Mo: {stats.monthlyCount}</div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleEditStaff(member)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteStaff(member.id, member.name)}
                                                            disabled={member.id === currentStaff.id}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Team Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">
                                    Active Staff: {staff.length}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Admin, Managers, Waiters, Staff
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {isManager && (
                <UserManagementDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    staffToEdit={staffToEdit}
                />
            )}
        </div>
    );
}
