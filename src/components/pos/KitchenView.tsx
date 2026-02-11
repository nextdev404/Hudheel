import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import {
  Clock,
  Flame,
  UtensilsCrossed,
  ChefHat,
  AlertCircle,
  User,
  Ban,
  CheckCircle,
} from 'lucide-react';
import type { Order } from '@/types/pos';
import { formatDistanceToNow } from 'date-fns';

export function KitchenView() {
  const { state, acceptOrder, startOrder, markOrderReady, markItemUnavailable, selectTable, setActiveView } = usePOS();
  const { orders, tables, currentStaff } = state;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const acceptedOrders = orders.filter((o) => o.status === 'accepted');
  const inProgressOrders = orders.filter((o) => o.status === 'in-progress');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const getPriorityColor = (order: Order) => {
    const elapsedMinutes = (currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000;
    if (elapsedMinutes > 20) return 'border-red-500 bg-red-50';
    if (elapsedMinutes > 10) return 'border-orange-500 bg-orange-50';
    return 'border-slate-200 bg-white';
  };

  const renderOrderCard = (order: Order, type: 'pending' | 'accepted' | 'in-progress' | 'ready') => {
    return (
      <Card
        key={order.id}
        className={`mb-4 border-l-4 shadow-sm hover:shadow-md transition-all ${getPriorityColor(order)}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-bold text-lg">
                  Table {order.tableNumber}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">#{order.id.slice(-4)}</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <User className="w-3 h-3" />
                  <span>Waiter: {order.servedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {type === 'pending' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  onClick={() => acceptOrder(order.id)}
                >
                  Accept
                </Button>
              )}
              {type === 'accepted' && (
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                  onClick={() => startOrder(order.id)}
                >
                  Preparing
                </Button>
              )}
              {type === 'in-progress' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 w-full"
                  onClick={() => markOrderReady(order.id)}
                >
                  Finish
                </Button>
              )}
              {type === 'ready' && (
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 w-full gap-2"
                  disabled={!currentStaff || currentStaff.id !== order.waiterId}
                  title={(!currentStaff || currentStaff.id !== order.waiterId) ? "Only the waiter who placed this order can pick it up" : "Pick up order"}
                  onClick={() => {
                    const table = tables.find(t => t.id === order.tableId);
                    if (table) {
                      selectTable(table);
                      setActiveView('payment');
                    }
                  }}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Pick Up
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {order.items.map((item, idx) => (
              <div key={`${order.id}-item-${idx}`} className={`flex justify-between items-start border-b border-dashed border-slate-200 pb-2 last:border-0 last:pb-0 ${item.unavailable ? 'opacity-50' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-sm">
                      {item.quantity}
                    </span>
                    <span className={`font-medium ${item.unavailable ? 'line-through text-slate-400' : ''}`}>
                      {item.menuItem.name}
                    </span>
                    {item.unavailable && (
                      <Badge variant="destructive" className="text-[10px] h-5">Unavailable</Badge>
                    )}
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="pl-8 text-xs text-slate-500 mt-1">
                      {item.modifiers.map(m => m.name).join(', ')}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="pl-8 mt-1 text-amber-600 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {item.specialInstructions}
                    </div>
                  )}
                </div>
                {/* Only allow marking unavailable if not already done/ready */}
                {!item.unavailable && type !== 'in-progress' && ( // Allow in pending/accepted
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-500"
                    title="Mark Unavailable"
                    onClick={() => markItemUnavailable(order.id, item.id)}
                  >
                    <Ban className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
            <p className="text-sm text-slate-500">Manage orders and preparation</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString()}</div>
          <div className="text-sm text-slate-500">{currentTime.toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Pending Orders Column */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Pending
            </h2>
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <UtensilsCrossed className="w-12 h-12 mb-2 opacity-20" />
                <p>No new orders</p>
              </div>
            ) : (
              pendingOrders.map(order => renderOrderCard(order, 'pending'))
            )}
          </ScrollArea>
        </div>

        {/* Accepted Orders Column */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              Accepted
            </h2>
            <Badge variant="secondary">{acceptedOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            {acceptedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <ChefHat className="w-12 h-12 mb-2 opacity-20" />
                <p>No accepted orders</p>
              </div>
            ) : (
              acceptedOrders.map(order => renderOrderCard(order, 'accepted'))
            )}
          </ScrollArea>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              In Progress
            </h2>
            <Badge variant="secondary">{inProgressOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            {inProgressOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Flame className="w-12 h-12 mb-2 opacity-20" />
                <p>No active preparations</p>
              </div>
            ) : (
              inProgressOrders.map(order => renderOrderCard(order, 'in-progress'))
            )}
          </ScrollArea>
        </div>


        {/* Ready Orders Column */}
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-white/50 flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              Ready
            </h2>
            <Badge variant="secondary">{readyOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                <p>No orders ready</p>
              </div>
            ) : (
              readyOrders.map(order => renderOrderCard(order, 'ready'))
            )}
          </ScrollArea>
        </div>
      </div>

    </div>
  );
}
