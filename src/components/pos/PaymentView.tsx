import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Receipt,
} from 'lucide-react';
import type { Payment } from '@/types/pos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function PaymentView() {
  const { state, processPayment, setActiveView, getCartTotal } = usePOS();
  const { selectedTable, cart, currentOrder } = state;

  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [tip, setTip] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const cartTotal = getCartTotal();
  const totalWithTip = cartTotal.total + (parseFloat(tip) || 0);
  const change = parseFloat(amountReceived) - totalWithTip;

  const handleProcessPayment = () => {
    const payment: Payment = {
      method: paymentMethod,
      amount: parseFloat(amountReceived) || totalWithTip,
      tip: parseFloat(tip) || 0,
      change: change > 0 ? change : 0,
    };

    const success = processPayment(payment);
    if (success) {
      setShowReceipt(true);
    }
  };

  const quickAmounts = [5, 10, 20, 50, 100];
  const quickTips = [0, 2, 5, 10, 15, 20];

  if (!selectedTable) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4">
        <CreditCard className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <p className="text-base sm:text-lg font-medium">No table selected</p>
        <p className="mb-4 text-sm">Please select a table first</p>
        <Button onClick={() => setActiveView('tables')}>Go to Tables</Button>
      </div>
    );
  }

  if (cart.length === 0 && !currentOrder) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4">
        <Receipt className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <p className="text-base sm:text-lg font-medium">No active order</p>
        <p className="mb-4 text-sm">Add items to process payment</p>
        <Button onClick={() => setActiveView('menu')}>Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-white p-3 sm:p-4 gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActiveView('cart')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Payment</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Table {selectedTable.number} • Process payment
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Payment Methods */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
            {/* Payment Method Selection */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Payment Method</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className={`flex flex-col items-center gap-1 sm:gap-2 py-4 sm:py-6 text-xs sm:text-sm ${
                      paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    className={`flex flex-col items-center gap-1 sm:gap-2 py-4 sm:py-6 text-xs sm:text-sm ${
                      paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span>Card</span>
                  </Button>
                  <Button
                    variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                    className={`flex flex-col items-center gap-1 sm:gap-2 py-4 sm:py-6 text-xs sm:text-sm ${
                      paymentMethod === 'mobile' ? 'bg-purple-600 hover:bg-purple-700' : ''
                    }`}
                    onClick={() => setPaymentMethod('mobile')}
                  >
                    <Smartphone className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span>Mobile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tip Selection */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Tip</h3>
                <div className="flex flex-wrap gap-2">
                  {quickTips.map((tipAmount) => (
                    <Button
                      key={tipAmount}
                      variant={
                        parseFloat(tip) === tipAmount ? 'default' : 'outline'
                      }
                      onClick={() => setTip(tipAmount.toString())}
                      className={`text-xs sm:text-sm ${
                        parseFloat(tip) === tipAmount ? 'bg-orange-500' : ''
                      }`}
                      size="sm"
                    >
                      {tipAmount === 0 ? 'No Tip' : `$${tipAmount}`}
                    </Button>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">Custom:</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tip}
                      onChange={(e) => setTip(e.target.value)}
                      className="w-20 sm:w-24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Payment - Amount Received */}
            {paymentMethod === 'cash' && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Amount Received</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() =>
                          setAmountReceived(
                            (parseFloat(amountReceived) + amount).toString()
                          )
                        }
                        size="sm"
                      >
                        +${amount}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-lg font-semibold">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="text-base sm:text-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setAmountReceived('')}
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>

                  {change > 0 && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3 sm:p-4">
                      <p className="text-base sm:text-lg font-semibold text-green-700">
                        Change: ${change.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {change < 0 && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 sm:p-4">
                      <p className="text-base sm:text-lg font-semibold text-red-700">
                        Insufficient: ${Math.abs(change).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Card/Mobile Payment Info */}
            {(paymentMethod === 'card' || paymentMethod === 'mobile') && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-center gap-4 py-6 sm:py-8">
                    <div className="text-center">
                      {paymentMethod === 'card' ? (
                        <>
                          <CreditCard className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-blue-500" />
                          <p className="text-base sm:text-lg font-medium">
                            Ready to process card payment
                          </p>
                          <p className="text-slate-500">
                            Total: ${totalWithTip.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <>
                          <Smartphone className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-purple-500" />
                          <p className="text-base sm:text-lg font-medium">
                            Ready to process mobile payment
                          </p>
                          <p className="text-slate-500">
                            Total: ${totalWithTip.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-slate-50 p-3 sm:p-6 shrink-0">
          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Order Summary</h3>

          <ScrollArea className="h-32 sm:h-48 mb-4">
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between text-xs sm:text-sm">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="font-medium shrink-0">
                    ${
                      (
                        (item.menuItem.price +
                          item.modifiers.reduce((sum, m) => sum + m.price, 0)) *
                        item.quantity
                      ).toFixed(2)
                    }
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-3 sm:my-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-slate-600 text-sm sm:text-base">
              <span>Subtotal</span>
              <span>${cartTotal.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm sm:text-base">
              <span>Tax (8%)</span>
              <span>${cartTotal.tax.toFixed(2)}</span>
            </div>
            {parseFloat(tip) > 0 && (
              <div className="flex justify-between text-slate-600 text-sm sm:text-base">
                <span>Tip</span>
                <span>${parseFloat(tip).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg sm:text-xl font-bold text-slate-900">
              <span>Total</span>
              <span>${totalWithTip.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="mt-4 sm:mt-6 w-full gap-2 bg-green-600 py-4 sm:py-6 text-base sm:text-lg hover:bg-green-700"
            onClick={handleProcessPayment}
            disabled={
              paymentMethod === 'cash' &&
              (amountReceived === '' || parseFloat(amountReceived) < totalWithTip)
            }
          >
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Process Payment
          </Button>

          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setActiveView('cart')}
          >
            Back to Cart
          </Button>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-slate-500">Receipt #REC-{Date.now()}</p>
              <p className="text-xs sm:text-sm text-slate-500">
                {new Date().toLocaleString()}
              </p>
              <p className="mt-2 text-base sm:text-lg font-semibold">
                Table {selectedTable.number}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${cartTotal.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${cartTotal.tax.toFixed(2)}</span>
              </div>
              {parseFloat(tip) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>${parseFloat(tip).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base sm:text-lg font-bold">
                <span>Total Paid</span>
                <span>${totalWithTip.toFixed(2)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Change</span>
                  <span>${change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-blue-700">
                Thank you for dining with us!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowReceipt(false);
                setActiveView('tables');
              }}
              className="w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
