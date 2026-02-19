import { usePOS } from '@/store/posStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    TrendingDown,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { subDays, format, isSameDay, parseISO, differenceInMinutes } from 'date-fns';
import { useMemo, useState } from 'react';
import { AddStaffDialog } from './AddStaffDialog';
import { Button } from '@/components/ui/button';

export function DashboardView() {
    const { state, addStaff, removeStaff } = usePOS();
    const { orders } = state;
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

    const isAdminOrManager = state.currentStaff?.role === 'admin' || state.currentStaff?.role === 'manager';

    // --- Statistics Calculation ---
    const stats = useMemo(() => {
        const completedOrders = orders.filter(
            (o) => o.status === 'served' || o.status === 'ready' || o.status === 'closed'
        );

        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = completedOrders.length;

        // Using order count as proxy for customers since we don't track unique customers yet
        const totalCustomers = completedOrders.length;

        const productsSold = completedOrders.reduce(
            (sum, o) => sum + o.items.reduce((acc, item) => acc + item.quantity, 0),
            0
        );

        return {
            totalRevenue,
            totalOrders,
            totalCustomers,
            productsSold
        };
    }, [orders]);

    // --- Charts Data Preparation ---
    const salesData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayOrders = orders.filter((o) =>
                isSameDay(new Date(o.createdAt), date) &&
                (o.status === 'served' || o.status === 'ready' || o.status === 'closed')
            );
            const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
            data.push({
                name: format(date, 'EEE'), // Mon, Tue, etc.
                value: revenue
            });
        }
        return data;
    }, [orders]);

    const ordersData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const count = orders.filter((o) =>
                isSameDay(new Date(o.createdAt), date)
            ).length;
            data.push({
                name: format(date, 'EEE'),
                value: count
            });
        }
        return data;
    }, [orders]);

    // --- Top Products ---
    const topProducts = useMemo(() => {
        const productMap = new Map<string, { name: string; sold: number; revenue: number }>();

        orders.forEach((order) => {
            if (order.status === 'served' || order.status === 'ready' || order.status === 'closed') {
                order.items.forEach((item) => {
                    const existing = productMap.get(item.menuItem.id) || {
                        name: item.menuItem.name,
                        sold: 0,
                        revenue: 0
                    };
                    productMap.set(item.menuItem.id, {
                        name: item.menuItem.name,
                        sold: existing.sold + item.quantity,
                        revenue: existing.revenue + (item.menuItem.price * item.quantity)
                    });
                });
            }
        });

        return Array.from(productMap.values())
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 4);
    }, [orders]);


    const { staff } = state;
    // --- Staff Performance Data ---
    const staffPerformance = useMemo(() => {
        return staff.map(member => {
            // Count orders handled by this staff member (using waiterId as primary link)
            const staffOrders = orders.filter(o =>
                (o.status === 'served' || o.status === 'closed') &&
                o.waiterId === member.id
            ).length;

            const now = new Date();
            let sessionDuration = 0;
            if (member.isOnline && member.currentSessionStart) {
                sessionDuration = differenceInMinutes(now, parseISO(member.currentSessionStart));
            }
            const totalOnlineMinutes = (member.dailyOnlineMinutes || 0) + sessionDuration;
            const hours = Math.floor(totalOnlineMinutes / 60);
            const minutes = totalOnlineMinutes % 60;

            return {
                ...member,
                ordersCount: staffOrders,
                onlineDuration: `${hours}h ${minutes}m`
            };
        });
    }, [staff, orders]);

    const togglePinVisibility = (staffId: string) => {
        setVisiblePins(prev => ({
            ...prev,
            [staffId]: !prev[staffId]
        }));
    };

    const handleDeleteStaff = (staffId: string) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            removeStaff(staffId);
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50/50 overflow-y-auto h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening with your store today.
                </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <MetricCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change="+20.1%" // Placeholder for demo, or calculate real change if historical data exists
                    trend="up"
                    icon={DollarSign}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                />
                <MetricCard
                    title="Total Orders"
                    value={stats.totalOrders.toString()}
                    change="+15.3%"
                    trend="up"
                    icon={ShoppingCart}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                />
                <MetricCard
                    title="Total Customers"
                    value={stats.totalCustomers.toString()}
                    change="+8.2%"
                    trend="up"
                    icon={Users}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                />
                <MetricCard
                    title="Products Sold"
                    value={stats.productsSold.toString()}
                    change="-2.4%"
                    trend="down"
                    icon={Package}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
                <Card className="col-span-1 shadow-sm border-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`$${value}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#f97316"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 shadow-sm border-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Orders This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ordersData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#fb923c"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Staff Performance & Top Products */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* Staff Performance */}
                <Card className="col-span-2 shadow-sm border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Staff Management</CardTitle>
                        {isAdminOrManager && (
                            <Button
                                onClick={() => setIsAddStaffOpen(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                + Add Staff
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {staffPerformance.map((member) => (
                                <div key={member.id} className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-slate-500" />
                                            </div>
                                            {member.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                                {member.attendance?.status === 'late' && (
                                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                        LATE (+{member.attendance.lateMinutes}m)
                                                    </span>
                                                )}
                                                {isAdminOrManager && (
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <span className="text-xs text-muted-foreground font-mono bg-slate-100 px-1 rounded">
                                                            {visiblePins[member.id] ? member.pin : '••••'}
                                                        </span>
                                                        <button
                                                            onClick={() => togglePinVisibility(member.id)}
                                                            className="text-slate-400 hover:text-slate-600"
                                                        >
                                                            {visiblePins[member.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                                                <span>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                                                {member.attendance?.firstLogin && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[8px]">🕒</span>
                                                        In: {format(parseISO(member.attendance.firstLogin), 'h:mm a')}
                                                    </span>
                                                )}
                                                {member.attendance?.firstLogin && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[8px]">⏱</span>
                                                        {member.onlineDuration}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-2">
                                            <p className="text-sm font-medium text-green-600">{member.ordersCount} orders</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteStaff(member.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="col-span-1 shadow-sm border-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                                    </div>
                                    <div className="font-medium">
                                        ${product.revenue.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AddStaffDialog
                open={isAddStaffOpen}
                onOpenChange={setIsAddStaffOpen}
                onAddStaff={addStaff}
            />
        </div>
    );
}

// --- Sub-components for Cleaner Code ---

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}

const MetricCard = ({ title, value, change, trend, icon: Icon, iconColor, iconBg }: MetricCardProps) => (
    <Card className="shadow-sm border-none">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className={`p-2 rounded-lg ${iconBg} inline-block mb-3`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {change}
                </div>
            </div>
        </CardContent>
    </Card>
);

