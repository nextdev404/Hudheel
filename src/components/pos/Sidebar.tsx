import { usePOS } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  ClipboardList,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

interface SidebarProps {
  cartItemCount: number;
  activeOrdersCount: number;
}

export function Sidebar({ cartItemCount, activeOrdersCount }: SidebarProps) {
  const { state, dispatch, setActiveView } = usePOS();
  const { activeView, currentStaff, selectedTable } = state;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: null,
      hidden: currentStaff?.role !== 'admin' && currentStaff?.role !== 'manager',
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: UtensilsCrossed,
      badge: null,
      disabled: !selectedTable,
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? cartItemCount : null,
      disabled: cartItemCount === 0,
    },

    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: ChefHat,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
      badge: null,
      disabled: currentStaff?.role === 'waiter',
    },
  ].filter(item => !item.hidden);

  const handleLogout = () => {
    dispatch({ type: 'SET_CURRENT_STAFF', payload: null });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
          <UtensilsCrossed className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">C-BOY RESTAURANT</h1>
          <p className="text-xs text-slate-400"></p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-3 ${activeView === item.id
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !item.disabled && setActiveView(item.id as typeof activeView)}
              disabled={item.disabled}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge
                  variant={activeView === item.id ? 'outline' : 'secondary'}
                  className={
                    activeView === item.id
                      ? 'border-white text-white'
                      : 'bg-slate-700 text-slate-200'
                  }
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-slate-800" />

        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase text-slate-500">
            Quick Actions
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => setActiveView('tables')}
          >
            <LayoutGrid className="h-5 w-5" />
            <span>View All Tables</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => setActiveView('orders')}
          >
            <ClipboardList className="h-5 w-5" />
            <span>Order History</span>
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
            <User className="h-5 w-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {currentStaff?.name || 'Guest'}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {currentStaff?.role || 'Not logged in'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-slate-400 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-slate-400 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
