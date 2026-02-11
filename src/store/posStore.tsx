import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { isAfter, differenceInMinutes, parseISO } from 'date-fns';
import type { Order, Table, CartItem, MenuItem, Modifier, Payment, Staff, Notification } from '@/types/pos';
import { TAX_RATE, staff as initialStaff } from '@/data/sampleData';

// State interface
interface POSState {
  // Tables
  tables: Table[];
  selectedTable: Table | null;

  // Orders
  orders: Order[];
  currentOrder: Order | null;

  // Cart
  cart: CartItem[];

  // UI State
  activeView: 'tables' | 'menu' | 'cart' | 'payment' | 'kitchen' | 'orders' | 'dashboard';
  selectedCategory: string | null;

  // Staff
  staff: Staff[];
  currentStaff: { id: string; name: string; role: string } | null;

  // Modifiers dialog
  modifierItem: MenuItem | null;
  isModifierDialogOpen: boolean;

  // Notifications
  notifications: Notification[];
}

// Action types
type POSAction =
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'SELECT_TABLE'; payload: Table | null }
  | { type: 'UPDATE_TABLE_STATUS'; payload: { tableId: string; status: Table['status']; assignedWaiterId?: string } }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_CURRENT_ORDER'; payload: Order | null }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: { menuItem: MenuItem; quantity: number; modifiers: Modifier[]; specialInstructions?: string } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ACTIVE_VIEW'; payload: POSState['activeView'] }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null }
  | { type: 'SET_CURRENT_STAFF'; payload: { id: string; name: string; role: string } | null }
  | { type: 'ADD_STAFF'; payload: Staff }
  | { type: 'UPDATE_STAFF'; payload: Staff }
  | { type: 'REMOVE_STAFF'; payload: string }
  | { type: 'SET_MODIFIER_ITEM'; payload: MenuItem | null }
  | { type: 'SET_MODIFIER_DIALOG_OPEN'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

// Initial state
const initialState: POSState = {
  tables: [],
  selectedTable: null,
  orders: [],
  currentOrder: null,
  cart: [],
  activeView: 'tables',
  selectedCategory: null,
  staff: initialStaff,
  currentStaff: null,
  modifierItem: null,
  isModifierDialogOpen: false,
  notifications: [],
};

// Reducer
function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'SET_TABLES':
      return { ...state, tables: action.payload };

    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.payload };

    case 'UPDATE_TABLE_STATUS':
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === action.payload.tableId ? { ...t, status: action.payload.status, assignedWaiterId: action.payload.assignedWaiterId ?? t.assignedWaiterId } : t
        ),
      };

    case 'SET_ORDERS':
      return { ...state, orders: action.payload };

    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload };

    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };

    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.payload.id ? action.payload : o)),
      };

    case 'SET_CART':
      return { ...state, cart: action.payload };

    case 'ADD_TO_CART':
      const existingIndex = state.cart.findIndex(
        (item) =>
          item.menuItem.id === action.payload.menuItem.id &&
          JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers)
      );

      if (existingIndex >= 0) {
        const newCart = [...state.cart];
        newCart[existingIndex].quantity += action.payload.quantity;
        return { ...state, cart: newCart };
      }

      return {
        ...state,
        cart: [
          ...state.cart,
          {
            menuItem: action.payload.menuItem,
            quantity: action.payload.quantity,
            modifiers: action.payload.modifiers,
            specialInstructions: action.payload.specialInstructions,
          },
        ],
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((_, i) => i !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map((item, i) =>
          i === action.payload.index ? { ...item, quantity: action.payload.quantity } : item
        ),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'SET_CURRENT_STAFF':
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const staffId = action.payload?.id;

      if (!staffId) {
        // Logout Logic
        if (state.currentStaff) {
          const currentStaffMember = state.staff.find(s => s.id === state.currentStaff!.id);
          if (currentStaffMember && currentStaffMember.currentSessionStart) {
            const sessionDuration = differenceInMinutes(now, parseISO(currentStaffMember.currentSessionStart));

            return {
              ...state,
              currentStaff: null,
              staff: state.staff.map(s => {
                if (s.id === currentStaffMember.id) {
                  return {
                    ...s,
                    isOnline: false,
                    dailyOnlineMinutes: (s.dailyOnlineMinutes || 0) + sessionDuration,
                    currentSessionStart: null
                  };
                }
                return s;
              })
            };
          }
        }
        return { ...state, currentStaff: null };
      }

      // Login Logic - Set activeView based on role
      if (!action.payload) {
        return state;
      }

      let activeView: POSState['activeView'] = 'tables'; // default
      if (action.payload.role === 'admin' || action.payload.role === 'manager') {
        activeView = 'dashboard';
      } else if (action.payload.role === 'cashier') {
        activeView = 'orders';
      } else if (action.payload.role === 'chef') {
        activeView = 'kitchen';
      } else if (action.payload.role === 'waiter') {
        activeView = 'tables';
      }

      return {
        ...state,
        currentStaff: action.payload,
        activeView,
        staff: state.staff.map(s => {
          if (s.id === staffId) {
            const isFirstLoginToday = !s.attendance || s.attendance.date !== todayStr;
            let newAttendance = s.attendance;

            if (isFirstLoginToday) {
              const attendanceStart = new Date(now);
              attendanceStart.setHours(6, 0, 0, 0);

              const isLate = isAfter(now, attendanceStart);
              const lateMinutes = isLate ? differenceInMinutes(now, attendanceStart) : 0;

              newAttendance = {
                date: todayStr,
                status: isLate ? 'late' : 'on-time',
                firstLogin: now.toISOString(),
                lateMinutes
              };
            }

            return {
              ...s,
              isOnline: true,
              currentSessionStart: now.toISOString(),
              lastLogin: now.toISOString(),
              attendance: newAttendance,
              dailyOnlineMinutes: s.attendance?.date !== todayStr ? 0 : s.dailyOnlineMinutes || 0
            };
          }
          return s;
        })
      };

    case 'SET_MODIFIER_ITEM':
      return { ...state, modifierItem: action.payload };

    case 'SET_MODIFIER_DIALOG_OPEN':
      return { ...state, isModifierDialogOpen: action.payload };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    default:
      return state;
  }
}

// Context
interface POSContextType {
  state: POSState;
  dispatch: React.Dispatch<POSAction>;
  // Helper functions
  selectTable: (table: Table) => void;
  addToCart: (menuItem: MenuItem, quantity: number, modifiers: Modifier[], specialInstructions?: string) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Order | null;
  processPayment: (payment: Payment) => boolean;
  getCartTotal: () => { subtotal: number; tax: number; total: number };
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  setActiveView: (view: POSState['activeView']) => void;
  setSelectedCategory: (category: string | null) => void;
  openModifierDialog: (item: MenuItem) => void;
  closeModifierDialog: () => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (staff: Staff) => void;
  removeStaff: (id: string) => void;
  acceptOrder: (orderId: string) => void;
  startOrder: (orderId: string) => void;
  markOrderReady: (orderId: string) => void;
  markTableDone: (tableId: string) => void;
  markItemUnavailable: (orderId: string, itemId: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Local Storage Key
const STORAGE_KEY = 'cboy_pos_v3';

// Initializer function to load from localStorage
const initPOSState = (initial: POSState): POSState => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Ensure we merge with initial structure in case of schema updates
      // Also reset ephemeral UI state but keep data
      const mergedState = {
        ...initial,
        ...parsed,
        initialStaff,
        tables: parsed.tables || initial.tables,
        orders: parsed.orders || initial.orders,
        staff: parsed.staff || initial.staff,
        notifications: parsed.notifications || initial.notifications,
        selectedTable: null,
        currentOrder: null,
        isModifierDialogOpen: false,
        activeView: parsed.currentStaff ? 'dashboard' : 'tables',
      };

      // Auto-correction: Reset tables to 'available' if no active order exists
      // This ensures tables don't get stuck in 'occupied'/'reserved' if the order was cleared or state is inconsistent
      mergedState.tables = mergedState.tables.map((table: Table) => {
        if (table.status === 'available') return table;

        const hasActiveOrder = mergedState.orders.some(
          (o: Order) => o.tableId === table.id && o.status !== 'closed' && o.status !== 'cancelled'
        );

        if (!hasActiveOrder) {
          return { ...table, status: 'available', assignedWaiterId: undefined };
        }
        return table;
      });

      return mergedState;
    }
  } catch (err) {
    console.error('Failed to load POS state', err);
  }
  return initial;
};

// Provider
export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState, initPOSState);

  // React on state change to save
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }, [state]);

  // Helper functions
  const selectTable = (table: Table) => {
    // Logic: If table is available, lock it for this waiter
    if (table.status === 'available' && state.currentStaff?.role === 'waiter') {
      dispatch({
        type: 'UPDATE_TABLE_STATUS',
        payload: {
          tableId: table.id,
          status: 'assigned',
          assignedWaiterId: state.currentStaff.id
        }
      });
      // We also need to update the local 'table' object to reflect this before selecting
      // But dispatch is async-ish in React batching? No, useReducer is sync but state update is next render.
      // However, we can proceed to select it.
    }

    dispatch({ type: 'SELECT_TABLE', payload: table });
    // Find existing order for this table
    const existingOrder = state.orders.find(
      (o) => o.tableId === table.id && o.status !== 'closed' && o.status !== 'cancelled'
    );
    if (existingOrder) {
      dispatch({ type: 'SET_CURRENT_ORDER', payload: existingOrder });
      // Load order items into cart if status is 'open' (editable)
      if (existingOrder.status === 'open') {
        const cartItems: CartItem[] = existingOrder.items.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          modifiers: item.modifiers,
          specialInstructions: item.specialInstructions,
        }));
        dispatch({ type: 'SET_CART', payload: cartItems });
      } else {
        dispatch({ type: 'CLEAR_CART' });
      }
    } else {
      dispatch({ type: 'SET_CURRENT_ORDER', payload: null });
      dispatch({ type: 'CLEAR_CART' });
    }

    // Navigate appropriate view
    if (existingOrder && existingOrder.status !== 'open') {
      // If order already placed, maybe go to Order Details or Menu?
      // Let's go to Menu but with restrictions? Or stay on tables?
      // For now, default to menu as per existing code.
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'menu' });
    } else {
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'menu' });
    }
  };

  const addToCart = (
    menuItem: MenuItem,
    quantity: number,
    modifiers: Modifier[],
    specialInstructions?: string
  ) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { menuItem, quantity, modifiers, specialInstructions },
    });
  };

  const removeFromCart = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: index });
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { index, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    const subtotal = state.cart.reduce((total, item) => {
      const itemPrice = item.menuItem.price;
      const modifiersPrice = item.modifiers.reduce((sum, m) => sum + m.price, 0);
      return total + (itemPrice + modifiersPrice) * item.quantity;
    }, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const placeOrder = (): Order | null => {
    if (!state.selectedTable || state.cart.length === 0) return null;

    const { subtotal, tax, total } = getCartTotal();
    const now = new Date();

    const orderItems = state.cart.map((cartItem, index) => ({
      id: `oi-${Date.now()}-${index}`,
      menuItem: cartItem.menuItem,
      quantity: cartItem.quantity,
      modifiers: cartItem.modifiers,
      specialInstructions: cartItem.specialInstructions,
      status: 'pending' as const,
      addedAt: now,
    }));

    const order: Order = {
      id: `order-${Date.now()}`,
      tableId: state.selectedTable.id,
      tableNumber: state.selectedTable.number,
      items: orderItems,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      subtotal,
      tax,
      discount: 0,
      total,
      servedBy: state.currentStaff?.name || 'Unknown',
      waiterId: state.currentStaff?.id || 'unknown',
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'SET_CURRENT_ORDER', payload: order });
    // Table Status Flow: Waiter selects -> Assigned / Waiting for Food (after order)
    dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: state.selectedTable.id, status: 'waiting-for-food' } });
    dispatch({ type: 'CLEAR_CART' });

    // Notify Kitchen/Chef
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'order_new',
      message: `New Order #${order.id.slice(-4)} for Table ${order.tableNumber}`,
      createdAt: now.toISOString(),
      read: false,
      recipientRole: 'chef',
      data: {
        orderId: order.id,
        tableNumber: order.tableNumber
      }
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    return order;
  };

  const processPayment = (payment: Payment): boolean => {
    if (!state.currentOrder) return false;

    const updatedOrder: Order = {
      ...state.currentOrder,
      status: 'closed',
      paymentMethod: payment.method,
      tip: payment.tip,
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

    if (state.selectedTable) {
      // We DO NOT set to available here anymore. "Table remains locked until assigned waiter marks done".
      // We set to 'cleaning' or 'in-service' as "Receipt Delivered"?
      // Prompt says: "Waiter serves and delivers receipt -> Table remains locked until assigned waiter marks done"
      // Prompt also says "Assigned waiter marks done -> Table becomes Available automatically"
      // So here we keep it locked. Maybe change status to 'cleaning' to indicate payment done?
      dispatch({
        type: 'UPDATE_TABLE_STATUS',
        payload: { tableId: state.selectedTable.id, status: 'cleaning' },
      });
    }

    dispatch({ type: 'SET_CURRENT_ORDER', payload: null });
    dispatch({ type: 'SELECT_TABLE', payload: null });
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'tables' });

    return true;
  };

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    // If setting to available, clear assignment
    const assignedWaiterId = status === 'available' ? undefined : state.tables.find(t => t.id === tableId)?.assignedWaiterId;
    dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId, status, assignedWaiterId: status === 'available' ? undefined : assignedWaiterId } });
  };

  const markTableDone = (tableId: string) => {
    // Find the active order for this table
    const activeOrder = state.orders.find(
      o => o.tableId === tableId && o.status !== 'closed' && o.status !== 'cancelled'
    );

    if (activeOrder) {
      // Create payment record
      const updatedOrder: Order = {
        ...activeOrder,
        status: 'closed',
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

      // Log the action
      logAction('MARK_TABLE_DONE', {
        tableId,
        orderId: activeOrder.id,
        tableNumber: activeOrder.tableNumber,
        total: activeOrder.total,
        waiter: activeOrder.servedBy
      });
    }

    // Set table to available and clear assignment
    dispatch({
      type: 'UPDATE_TABLE_STATUS',
      payload: { tableId, status: 'available', assignedWaiterId: undefined }
    });
  };

  const setActiveView = (view: POSState['activeView']) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
  };

  const setSelectedCategory = (category: string | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const openModifierDialog = (item: MenuItem) => {
    dispatch({ type: 'SET_MODIFIER_ITEM', payload: item });
    dispatch({ type: 'SET_MODIFIER_DIALOG_OPEN', payload: true });
  };

  const closeModifierDialog = () => {
    dispatch({ type: 'SET_MODIFIER_DIALOG_OPEN', payload: false });
    dispatch({ type: 'SET_MODIFIER_ITEM', payload: null });
  };

  const addStaff = (staff: Staff) => {
    dispatch({ type: 'ADD_STAFF', payload: staff });
  };

  const updateStaff = (staff: Staff) => {
    dispatch({ type: 'UPDATE_STAFF', payload: staff });
  };

  const removeStaff = (id: string) => {
    dispatch({ type: 'REMOVE_STAFF', payload: id });
  };

  const logAction = (action: string, details: any) => {
    console.log(`[POS LOG] ${new Date().toISOString()} | User: ${state.currentStaff?.name} (${state.currentStaff?.role}) | Action: ${action}`, details);
  };

  const acceptOrder = (orderId: string) => {
    if (state.currentStaff?.role !== 'chef' && state.currentStaff?.role !== 'admin') return;

    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    logAction('ACCEPT_ORDER', { orderId });

    const updatedOrder: Order = {
      ...order,
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

    // Notify Waiter
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'system',
      message: `Order #${order.id.slice(-4)} Accepted by Kitchen`,
      createdAt: new Date().toISOString(),
      read: false,
      recipientId: order.waiterId,
      recipientRole: 'waiter',
      data: { orderId: order.id, tableNumber: order.tableNumber }
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const startOrder = (orderId: string) => {
    if (state.currentStaff?.role !== 'chef' && state.currentStaff?.role !== 'admin') return;

    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    logAction('START_ORDER', { orderId });

    const updatedOrder: Order = {
      ...order,
      status: 'in-progress',
      updatedAt: new Date(),
      items: order.items.map(item => ({ ...item, status: 'preparing' }))
    };
    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

    // Notify Waiter
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'system',
      message: `Order #${order.id.slice(-4)} is In Progress`,
      createdAt: new Date().toISOString(),
      read: false,
      recipientId: order.waiterId,
      recipientRole: 'waiter',
      data: { orderId: order.id, tableNumber: order.tableNumber }
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markOrderReady = (orderId: string) => {
    if (state.currentStaff?.role !== 'chef' && state.currentStaff?.role !== 'admin') return;

    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    logAction('FINISH_ORDER', { orderId });

    const now = new Date();
    const updatedOrder: Order = {
      ...order,
      status: 'ready',
      readyAt: now,
      updatedAt: now,
      items: order.items.map(item => ({ ...item, status: 'ready' }))
    };
    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

    // Notify Waiter
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'order_ready',
      message: `Order #${order.id.slice(-4)} for Table ${order.tableNumber} is Ready!`,
      createdAt: now.toISOString(),
      read: false,
      recipientId: order.waiterId,
      recipientRole: 'waiter',
      data: {
        orderId: order.id,
        tableNumber: order.tableNumber
      }
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Table Status: Food Arrives -> Reserved / In Service. 
    // "Ready" implies food is at pass. Waiter picks it up.
    // Let's set to 'reserved' as per Prompt "Food arrives -> Table Reserved / In Service"
    dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: order.tableId, status: 'reserved' } });
  };

  const markItemUnavailable = (orderId: string, itemId: string) => {
    if (state.currentStaff?.role !== 'chef' && state.currentStaff?.role !== 'admin') return;

    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    logAction('MARK_UNAVAILABLE', { orderId, itemId, itemName: item.menuItem.name });

    const updatedOrder: Order = {
      ...order,
      items: order.items.map(i => i.id === itemId ? { ...i, unavailable: true } : i),
      updatedAt: new Date(),
    };
    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });

    // Notify Waiter
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'system',
      message: `Item Unavailable: ${item.menuItem.name} (Table ${order.tableNumber})`,
      createdAt: new Date().toISOString(),
      read: false,
      recipientId: order.waiterId,
      recipientRole: 'waiter',
      data: { orderId: order.id, tableNumber: order.tableNumber }
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  return (
    <POSContext.Provider
      value={{
        state,
        dispatch,
        selectTable,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        processPayment,
        getCartTotal,
        updateTableStatus,
        setActiveView,
        setSelectedCategory,
        openModifierDialog,
        closeModifierDialog,
        addStaff,
        updateStaff,
        removeStaff,
        acceptOrder,
        startOrder,
        markOrderReady,
        markTableDone,
        markItemUnavailable,
        markNotificationRead,
        clearNotifications,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

// Hook
export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
