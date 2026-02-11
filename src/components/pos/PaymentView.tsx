import { usePOS } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import type { Payment, Order } from '@/types/pos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Receipt } from './Receipt';

export function PaymentView() {
  const { state, processPayment, setActiveView } = usePOS();
  const { selectedTable, cart, currentOrder, currentStaff } = state;

  const [showReceipt, setShowReceipt] = useState(false);
  // We'll store the order data used for the receipt here to ensure it persists 
  // even if the global state clears after payment.
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Unified data source logic: if we have a currentOrder, use it. Otherwise use cart.
  const displayItems = currentOrder
    ? currentOrder.items.map(item => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.menuItem.price + item.modifiers.reduce((sum, m) => sum + m.price, 0)
    }))
    : cart.map(item => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.menuItem.price + item.modifiers.reduce((sum, m) => sum + m.price, 0)
    }));

  const totals = currentOrder
    ? { subtotal: currentOrder.subtotal, tax: currentOrder.tax, total: currentOrder.total }
    : (function () {
      const subtotal = cart.reduce((total, item) => {
        const itemPrice = item.menuItem.price;
        const modifiersPrice = item.modifiers.reduce((sum, m) => sum + m.price, 0);
        return total + (itemPrice + modifiersPrice) * item.quantity;
      }, 0);
      const tax = subtotal * 0.08;
      return { subtotal, tax, total: subtotal + tax };
    })();

  const handleProcessPayment = () => {
    const payment: Payment = {
      method: 'cash', // Default to cash for simplified view
      amount: totals.total,
      tip: 0,
      change: 0,
    };

    // Construct the order object for the receipt *before* potentially clearing state
    const orderForReceipt: any = currentOrder ? { ...currentOrder } : {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      tableId: selectedTable?.id,
      tableNumber: selectedTable?.number,
      status: 'closed',
      items: cart.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      discount: 0,
      paymentMethod: 'cash',
      servedBy: currentStaff?.name || 'Staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterId: currentStaff?.id,
    };

    // Ensure we have the latest totals just in case
    orderForReceipt.total = totals.total;
    orderForReceipt.subtotal = totals.subtotal;
    orderForReceipt.tax = totals.tax;

    const success = processPayment(payment);
    if (success) {
      setReceiptOrder(orderForReceipt);
      setShowReceipt(true);
    }
  };

  if (!selectedTable) {
    return null; // Should be handled by parent or previous view
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-white dark:bg-slate-900 p-3 sm:p-4 gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveView('tables')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50">Payment</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Table {selectedTable.number} • Order Summary
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-sm border flex flex-col overflow-hidden">

          <div className="p-4 sm:p-6 border-b flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-slate-500" />
              Order Summary
            </h3>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase mb-4 pb-2 border-b">
              <div className="col-span-6">Name</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="space-y-4">
              {displayItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 text-sm items-center">
                  <div className="col-span-6 font-medium text-slate-700 truncate">
                    {item.name}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-slate-500">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right font-bold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-8 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (8%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>

            <Button
              className="mt-6 w-full gap-2 bg-green-600 py-6 text-lg hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
              disabled={Boolean(currentOrder && currentStaff && (currentStaff.role !== 'admin' && currentStaff.role !== 'manager' && currentStaff.role !== 'cashier' && currentStaff.id !== currentOrder.waiterId))}
              title={(currentOrder && currentStaff && (currentStaff.role !== 'admin' && currentStaff.role !== 'manager' && currentStaff.role !== 'cashier' && currentStaff.id !== currentOrder.waiterId)) ? "Only the waiter who placed this order, a manager, or a cashier can process payment" : "Process payment"}
              onClick={handleProcessPayment}
            >
              <CheckCircle className="h-6 w-6" />
              Process & Print Receipt
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              onClick={() => setActiveView('tables')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md mx-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center py-4">
            <p className="text-slate-600">
              Payment has been processed successfully.
            </p>
            <div className="flex justify-center">
              {receiptOrder && <Receipt order={receiptOrder} />}
            </div>
          </div>

          <DialogFooter className="mt-4 sm:justify-center">
            <Button
              onClick={() => {
                setShowReceipt(false);
                setActiveView('tables');
              }}
              className="w-full sm:w-auto bg-slate-900 px-8"
            >
              Done & Return to Tables
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
