import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Search, Users, Clock, CheckCircle, AlertCircle, Sparkles, Filter, Lock, Utensils } from 'lucide-react';
import type { Table } from '@/types/pos';
import { tables as sampleTables } from '@/data/sampleData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  available: {
    label: 'Available',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: CheckCircle,
  },
  assigned: {
    label: 'Assigned',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Users,
  },
  'waiting-for-food': {
    label: 'Waiting for Food',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    icon: Clock,
  },
  'in-service': { // Food Arrived
    label: 'In Service',
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    icon: Utensils,
  },
  occupied: { // Catch-all or legacy
    label: 'Occupied',
    color: 'bg-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    icon: Users,
  },
  reserved: { // Order Ready? Or Booked? Mapping 'Reserved' to 'Order Ready' as per prompt context
    label: 'Reserved',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: Clock,
  },
  cleaning: { // Payment logic sets to cleaning
    label: 'Payment Done',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    icon: Sparkles,
  },
  'waiting-for-service': {
    label: 'Waiting for Service',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    icon: AlertCircle,
  },
};

export function TablesView() {
  const { state, dispatch, selectTable, markTableDone } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Table['status'] | 'all'>('all');
  const [alertInfo, setAlertInfo] = useState<{ open: boolean; title: string; message: string } | null>(null);
  const [confirmPaymentTable, setConfirmPaymentTable] = useState<Table | null>(null);

  // Initialize tables on mount
  useEffect(() => {
    if (state.tables.length === 0) {
      dispatch({ type: 'SET_TABLES', payload: sampleTables });
    }
  }, []);

  const filteredTables = state.tables.filter((table) => {
    const matchesSearch = table.number.toString().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;

    // Visibility: "Other waiters see only available tables"
    // Interpretation: We show them but maybe they are locked?
    // Prompt says: "Other waiters attempting to select it receive a pop-up message"
    // This implies VISIBILITY. If I hide them, user can't select them to get the popup.
    // So I will show all tables.

    return matchesSearch && matchesStatus;
  });

  const statusCounts = state.tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<Table['status'], number>);

  const handleTableClick = (table: Table) => {
    // Logic for Waiters
    if (state.currentStaff?.role === 'waiter') {
      if (table.status === 'available') {
        selectTable(table);
        return;
      }

      // Locked Table Logic
      const isMyTable = table.assignedWaiterId === state.currentStaff.id;
      if (!isMyTable) {
        // Find who owns it
        const owner = state.staff.find(s => s.id === table.assignedWaiterId);
        const ownerName = owner ? owner.name : 'another waiter';

        setAlertInfo({
          open: true,
          title: 'Table Locked',
          message: `Table ${table.number} is selected by ${ownerName} and waiting for service.`
        });
        return;
      }

      // My table - allow access
      selectTable(table);
    } else {
      // Admin/Manager/Cashier can access all
      selectTable(table);
    }
  };

  const handleMarkDone = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    // Validations
    if (state.currentStaff?.role === 'waiter' && table.assignedWaiterId !== state.currentStaff.id) {
      const owner = state.staff.find(s => s.id === table.assignedWaiterId);
      const ownerName = owner ? owner.name : 'another waiter';
      setAlertInfo({
        open: true,
        title: 'Unauthorized Action',
        message: `Table ${table.number} is assigned to ${ownerName}. Only the assigned waiter can mark it done.`
      });
      return;
    }

    // Show payment confirmation dialog
    setConfirmPaymentTable(table);
  };

  const confirmMarkDone = () => {
    if (confirmPaymentTable) {
      markTableDone(confirmPaymentTable.id);
      setConfirmPaymentTable(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Alert Dialog for Pop-ups */}
      <AlertDialog open={!!alertInfo?.open} onOpenChange={(open) => !open && setAlertInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertInfo?.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertInfo?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertInfo(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={!!confirmPaymentTable} onOpenChange={(open) => !open && setConfirmPaymentTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Has the payment for Table {confirmPaymentTable?.number} been received?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmPaymentTable(null)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkDone}>Yes, Payment Received</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-white dark:bg-slate-900 p-3 sm:p-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">Table Management</h2>
          <p className="text-sm text-slate-500">Select a table to start taking orders</p>
        </div>

        {/* Desktop Filter Buttons */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(['all', 'available', 'assigned', 'waiting-for-food', 'waiting-for-service', 'in-service', 'cleaning'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? 'bg-slate-900 whitespace-nowrap'
                    : 'text-slate-600 whitespace-nowrap'
                }
              >
                {status === 'all' ? 'All' : statusConfig[status]?.label}
                {status !== 'all' && statusCounts[status] > 0 && (
                  <span className="ml-1">({statusCounts[status]})</span>
                )}
              </Button>
            )
          )}
        </div>

        {/* Mobile Filter Dropdown */}
        <div className="sm:hidden">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Table['status'] | 'all')}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="border-b bg-slate-50 dark:bg-slate-900 p-3 sm:p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredTables.map((table) => {
            const config = statusConfig[table.status] || statusConfig['occupied'];
            const StatusIcon = config.icon;

            // Find assigned waiter name
            const assignedWaiter = state.staff.find(s => s.id === table.assignedWaiterId);
            const waiterName = assignedWaiter ? assignedWaiter.name : null;

            // Determine if locked for current user (Visual cue only, logic handled in click)
            const isLocked = state.currentStaff?.role === 'waiter' &&
              table.status !== 'available' &&
              table.assignedWaiterId !== state.currentStaff.id;

            return (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${state.selectedTable?.id === table.id
                  ? 'ring-2 ring-orange-500 ring-offset-2'
                  : ''
                  } ${isLocked ? 'opacity-80 bg-slate-50' : 'hover:scale-105'
                  }`}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div
                    className={`flex flex-col items-center gap-2 sm:gap-3 rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-3 sm:p-4 relative`}
                  >
                    {isLocked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                    )}

                    {/* Table Number */}
                    <div
                      className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full ${config.color} text-xl sm:text-2xl font-bold text-white`}
                    >
                      {table.number}
                    </div>


                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={`text-xs sm:text-sm ${config.bgColor} ${config.borderColor} ${config.textColor} whitespace-nowrap`}
                    >
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>

                    {/* Assigned Waiter Name */}
                    {waiterName && table.status !== 'available' && (
                      <div className="w-full text-center py-1 bg-slate-100 rounded text-xs font-medium text-slate-700 truncate mt-1">
                        {waiterName}
                      </div>
                    )}

                    {/* Quick Actions (Mark Done) */}
                    {/* "Waiter serves and delivers receipt -> Table remains locked until assigned waiter marks done" */}
                    {/* We show "Mark Done" if it's reserved (food arrived) or cleaning (paid) or in-service or assigned? */}
                    {/* Usually "Mark Done" is final step. Let's allowing it if NOT available and user is owner/admin */}
                    {!['available'].includes(table.status) && (
                      (state.currentStaff?.role === 'admin' || state.currentStaff?.role === 'manager' || table.assignedWaiterId === state.currentStaff?.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 sm:mt-2 w-full text-xs"
                          onClick={(e) => handleMarkDone(e, table)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Mark Done
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTables.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <AlertCircle className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
            <p className="text-base sm:text-lg font-medium">No tables found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t bg-slate-50 dark:bg-slate-900 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1 sm:gap-2">
              <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full ${config.color}`} />
              <span className="text-xs sm:text-sm text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
