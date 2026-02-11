import { POSProvider, usePOS } from '@/store/posStore';
import { Sidebar } from '@/components/pos/Sidebar';
import { MobileNav } from '@/components/pos/MobileNav';
import { TablesView } from '@/components/pos/TablesView';
import { MenuView } from '@/components/pos/MenuView';
import { CartView } from '@/components/pos/CartView';
import { PaymentView } from '@/components/pos/PaymentView';
import { KitchenView } from '@/components/pos/KitchenView';
import { OrdersView } from '@/components/pos/OrdersView';
import { Toaster, toast } from 'sonner';
import { LoginView } from '@/components/pos/LoginView';
import { DashboardView } from '@/components/pos/DashboardView';
import { useEffect, useRef } from 'react';
import './App.css';

function POSApp() {
  const { state, markNotificationRead } = usePOS();
  const { activeView, cart, orders, currentStaff, notifications } = state;
  const prevNotificationsLength = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevNotificationsLength.current) {
      const newNotification = notifications[0]; // Assuming new ones are prepended

      // Check if notification is for this user
      if (
        !newNotification.read &&
        (!newNotification.recipientRole || newNotification.recipientRole === currentStaff?.role) &&
        (!newNotification.recipientId || newNotification.recipientId === currentStaff?.id)
      ) {
        toast(newNotification.message, {
          action: {
            label: 'Dismiss',
            onClick: () => markNotificationRead(newNotification.id),
          },
        });
        markNotificationRead(newNotification.id);
      }
    }
    prevNotificationsLength.current = notifications.length;
  }, [notifications, currentStaff, markNotificationRead]);

  if (!currentStaff) {
    return <LoginView />;
  }

  // Calculate active orders count for kitchen badge
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'open' || o.status === 'pending' || o.status === 'in-progress'
  ).length;

  // Calculate finished orders count for payments badge
  const finishedOrdersCount = orders.filter(
    (o) => o.status === 'ready'
  ).length;

  // Calculate cart item count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderView = () => {
    switch (activeView) {
      case 'tables':
        return <TablesView />;
      case 'menu':
        return <MenuView />;
      case 'cart':
        return <CartView />;
      case 'payment':
        return <PaymentView />;
      case 'kitchen':
        return <KitchenView />;
      case 'orders':
        return <OrdersView />;
      case 'dashboard':
        return (currentStaff?.role === 'admin' || currentStaff?.role === 'manager')
          ? <DashboardView />
          : <TablesView />;
      default:
        return <TablesView />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          cartItemCount={cartItemCount}
          activeOrdersCount={activeOrdersCount}
          finishedOrdersCount={finishedOrdersCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileNav
            cartItemCount={cartItemCount}
            activeOrdersCount={activeOrdersCount}
            finishedOrdersCount={finishedOrdersCount}
          />
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}


function App() {
  return (
    <POSProvider>
      <POSApp />
    </POSProvider>
  );
}

export default App;
