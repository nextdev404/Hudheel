import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  UtensilsCrossed,
  DollarSign,
  Filter,
} from 'lucide-react';
import type { Order } from '@/types/pos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Receipt } from './Receipt';

const statusConfig = {
  open: {
    label: 'Open',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: UtensilsCrossed,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: ChefHat,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200 rounded-full',
    icon: CheckCircle,
  },
  served: {
    label: 'Served',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200 rounded-full',
    icon: CheckCircle,
  },
  closed: {
    label: 'Ready',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200 rounded-full',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: XCircle,
  },
};

export function OrdersView() {
  const { state, selectTable, setActiveView, updateTableStatus, markOrderServed } = usePOS();
  const { orders, tables, currentStaff } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.tableNumber.toString().includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    // Role-based visibility: Waiters only see their own orders
    const matchesRole =
      currentStaff?.role === 'admin' ||
      currentStaff?.role === 'manager' ||
      currentStaff?.role === 'chef' ||
      currentStaff?.role === 'cashier' ||
      (currentStaff?.role === 'waiter' && order.waiterId === currentStaff.id);

    return matchesSearch && matchesStatus && matchesRole;
  });

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  // Calculate daily totals
  const today = new Date().toDateString();

  // All orders created today
  const allTodayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today
  );

  // Revenue from Closed (Paid) orders only
  const paidOrders = allTodayOrders.filter((order) => order.status === 'closed');
  const todayRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

  // Check for admin or manager role
  const canViewRevenue = currentStaff?.role === 'admin' || currentStaff?.role === 'manager';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-white p-3 sm:p-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Order History</h2>
          <p className="text-xs sm:text-sm text-slate-500">View and manage all orders</p>
        </div>

        {/* Desktop Stats */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 px-4 py-2">
            <p className="text-sm text-blue-600">Total Orders</p>
            <p className="text-xl font-bold text-blue-700">{allTodayOrders.length}</p>
          </div>
          {canViewRevenue && (
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <p className="text-sm text-green-600">Revenue</p>
              <p className="text-xl font-bold text-green-700">
                ${todayRevenue.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-blue-50 px-2 py-2 text-center">
            <p className="text-[10px] text-blue-600">Total</p>
            <p className="text-lg font-bold text-blue-700">{allTodayOrders.length}</p>
          </div>
          {canViewRevenue && (
            <div className="rounded-lg bg-green-50 px-2 py-2 text-center">
              <p className="text-[10px] text-green-600">Rev</p>
              <p className="text-lg font-bold text-green-700">
                ${todayRevenue.toFixed(0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b bg-slate-50 p-3 sm:p-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Desktop Filter Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          {(['all', 'open', 'pending', 'in-progress', 'ready', 'served', 'closed'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-slate-900' : 'text-slate-600'}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label}
            </Button>
          ))}
        </div>

        {/* Mobile Filter Dropdown */}
        <div className="sm:hidden w-full">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'all')}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4 max-w-5xl mx-auto">
          {sortedOrders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;

            return (
              <Card
                key={order.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => viewOrderDetails(order)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Order Info */}
                      <div
                        className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${config.color} shrink-0`}
                      >
                        <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                            #{order.id.slice(-6)}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${config.bgColor} ${config.textColor} text-xs`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <UtensilsCrossed className="h-3 w-3" />
                            Table {order.tableNumber}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-slate-900">
                          ${order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>

                      {order.status !== 'closed' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          className={`${order.status === 'ready'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            } h-8 px-3 text-xs font-bold gap-1`}
                          disabled={order.status !== 'ready' || (!currentStaff || currentStaff.id !== order.waiterId)}
                          title={(!currentStaff || currentStaff.id !== order.waiterId) ? "Only the waiter who placed this order can pick it up" : "Pick up order"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.status === 'ready') {
                              const table = tables.find(t => t.id === order.tableId);
                              if (table) {
                                markOrderServed(order.id);
                                updateTableStatus(table.id, 'reserved');
                                selectTable(table);
                                setActiveView('tables');
                              }
                            }
                          }}
                        >
                          <UtensilsCrossed className="h-3 w-3" />
                          Pick Up
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedOrders.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Search className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
              <p className="text-base sm:text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 sm:p-4">
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Order #{selectedOrder.id.slice(-6)}</p>
                  <p className="text-base sm:text-lg font-semibold">
                    Table {selectedOrder.tableNumber}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`${statusConfig[selectedOrder.status].bgColor} ${statusConfig[selectedOrder.status].textColor
                    }`}
                >
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="mb-2 font-semibold text-sm sm:text-base">Items</h4>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between rounded-lg border p-2 sm:p-3"
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`font-medium text-sm ${item.unavailable ? 'line-through text-slate-400' : ''}`}>
                          {item.quantity}x {item.menuItem.name}
                        </p>
                        {item.unavailable && (
                          <span className="text-red-500 text-xs font-bold">Unavailable</span>
                        )}
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-slate-500">
                            {item.modifiers.map((m) => m.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-amber-600">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-sm shrink-0">
                        ${
                          (
                            (item.menuItem.price +
                              item.modifiers.reduce((sum, m) => sum + m.price, 0)) *
                            item.quantity
                          ).toFixed(2)
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Tax</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                {(selectedOrder.tip ?? 0) > 0 && (
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Tip</span>
                    <span>${(selectedOrder.tip ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg sm:text-xl font-bold">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>


              {/* Payment Info */}
              {selectedOrder.paymentMethod && (
                <div className="rounded-lg bg-green-50 p-3 sm:p-4 mb-4">
                  <p className="text-xs sm:text-sm text-green-700">
                    <DollarSign className="inline mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Paid with {selectedOrder.paymentMethod}
                  </p>
                </div>
              )}
              {/* Order Meta */}
              <div className="text-xs text-slate-500">
                <p>Served by: {selectedOrder.servedBy}</p>
                <p>
                  Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Receipt order={selectedOrder} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
