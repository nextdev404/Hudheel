import { usePOS } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutGrid,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  ClipboardList,
  Menu,
  User,
  LogOut,
  Settings,
  CreditCard,
} from 'lucide-react';

interface MobileNavProps {
  cartItemCount: number;
  activeOrdersCount: number;
  finishedOrdersCount: number;
}

export function MobileNav({ cartItemCount, activeOrdersCount, finishedOrdersCount }: MobileNavProps) {
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
      id: 'payment',
      label: 'Receipt',
      icon: CreditCard,
      badge: finishedOrdersCount > 0 ? finishedOrdersCount : null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
      badge: null,
      disabled: currentStaff?.role === 'waiter',
    },
  ].filter(item => !item.hidden);

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId as typeof activeView);
  };

  const handleLogout = () => {
    dispatch({ type: 'SET_CURRENT_STAFF', payload: null });
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg">C-BOY RESTAURANT</span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Cart Quick Access */}
        {cartItemCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-slate-800"
            onClick={() => setActiveView('cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500">
              {cartItemCount}
            </Badge>
          </Button>
        )}

        {/* Kitchen Quick Access */}
        {activeOrdersCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-slate-800"
            onClick={() => setActiveView('kitchen')}
          >
            <ChefHat className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {activeOrdersCount}
            </Badge>
          </Button>
        )}

        {/* Menu Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-slate-900 text-white border-slate-800">
            <SheetHeader>
              <SheetTitle className="text-white">Menu</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${activeView === item.id
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !item.disabled && handleNavClick(item.id)}
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

            {/* Staff Info */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                  <User className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <p className="font-medium">{currentStaff?.name || 'Guest'}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {currentStaff?.role || 'Not logged in'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 gap-2 text-slate-400">
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
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
