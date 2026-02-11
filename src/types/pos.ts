// POS System Types

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'assigned' | 'occupied' | 'reserved' | 'cleaning' | 'waiting-for-food' | 'in-service' | 'waiting-for-service';
  assignedWaiterId?: string;
  currentOrder?: Order;
  position: { x: number; y: number };
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifiers: Modifier[];
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  unavailable?: boolean;
  addedAt: Date;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'open' | 'pending' | 'accepted' | 'in-progress' | 'ready' | 'closed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  readyAt?: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: 'cash' | 'card' | 'mobile';
  tip?: number;
  servedBy: string;
  waiterId: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: Modifier[];
  specialInstructions?: string;
}

export interface Payment {
  method: 'cash' | 'card' | 'mobile';
  amount: number;
  tip: number;
  change?: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier';
  pin: string;
  isOnline?: boolean;
  currentSessionStart?: string | null; // ISO date string
  lastLogin?: string | null; // ISO date string
  dailyOnlineMinutes?: number;
  attendance?: {
    date: string; // YYYY-MM-DD
    status: 'late' | 'on-time' | 'absent';
    firstLogin: string; // ISO date string
    lateMinutes: number;
  } | null;
}

export interface Notification {
  id: string;
  type: 'order_new' | 'order_ready' | 'order_late' | 'system';
  message: string;
  createdAt: string; // ISO date string
  read: boolean;
  recipientRole?: Staff['role'];
  recipientId?: string; // For specific staff (e.g., waiter who placed order)
  data?: {
    orderId?: string;
    tableNumber?: number;
  };
}

export type TableStatus = 'available' | 'assigned' | 'occupied' | 'reserved' | 'cleaning' | 'waiting-for-food' | 'in-service' | 'waiting-for-service';
export type OrderStatus = 'open' | 'pending' | 'accepted' | 'in-progress' | 'ready' | 'closed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface KitchenOrder {
  orderId: string;
  tableNumber: number;
  items: OrderItem[];
  receivedAt: Date;
  priority: 'normal' | 'high' | 'rush';
  notes?: string;
}
