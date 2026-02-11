import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CartView() {
  const {
    state,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    setActiveView,
    getCartTotal,
  } = usePOS();
  const { cart, selectedTable } = state;

  const cartTotal = getCartTotal();

  const handlePlaceOrder = () => {
    const order = placeOrder();
    if (order) {
      setActiveView('kitchen');
    }
  };

  if (!selectedTable) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4">
        <ShoppingCart className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <p className="text-base sm:text-lg font-medium">No table selected</p>
        <p className="mb-4 text-sm">Please select a table first</p>
        <Button onClick={() => setActiveView('tables')}>Go to Tables</Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-4">
        <ShoppingCart className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
        <p className="text-base sm:text-lg font-medium">Your cart is empty</p>
        <p className="mb-4 text-sm">Add items from the menu</p>
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
            onClick={() => setActiveView('menu')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Order Cart
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Table {selectedTable.number} • Review before sending to kitchen
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-red-500 w-full sm:w-auto">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Cart</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all items from your cart. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cart Items & Summary */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4 max-w-3xl">
            {cart.map((item, index) => {
              const itemPrice = item.menuItem.price;
              const modifiersPrice = item.modifiers.reduce(
                (sum, m) => sum + m.price,
                0
              );
              const totalPrice = (itemPrice + modifiersPrice) * item.quantity;

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                              {item.menuItem.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {item.menuItem.category}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-sm sm:text-lg font-bold shrink-0">
                            ${totalPrice.toFixed(2)}
                          </Badge>
                        </div>

                        {/* Modifiers */}
                        {item.modifiers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.modifiers.map((modifier) => (
                              <Badge
                                key={modifier.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {modifier.name}
                                {modifier.price > 0 &&
                                  ` (+$${modifier.price.toFixed(2)})`}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Special Instructions */}
                        {item.specialInstructions && (
                          <p className="mt-2 text-xs sm:text-sm text-amber-600">
                            Note: {item.specialInstructions}
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="mt-3 flex items-center gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() =>
                              updateCartQuantity(index, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() =>
                              updateCartQuantity(index, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="text-xs sm:text-sm text-slate-500">
                            × ${(itemPrice + modifiersPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                        onClick={() => removeFromCart(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-slate-50 p-3 sm:p-6 shrink-0">
          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Order Summary</h3>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between text-slate-600 text-sm sm:text-base">
              <span>Subtotal</span>
              <span>${cartTotal.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm sm:text-base">
              <span>Tax (8%)</span>
              <span>${cartTotal.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg sm:text-xl font-bold text-slate-900">
              <span>Total</span>
              <span>${cartTotal.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <Button
              className={`w-full gap-2 py-4 sm:py-6 text-base sm:text-lg ${state.currentStaff?.role === 'chef'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
                }`}
              onClick={handlePlaceOrder}
              disabled={state.currentStaff?.role === 'chef'}
              title={state.currentStaff?.role === 'chef' ? "Chefs cannot place orders" : "Send to Kitchen"}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              Send to Kitchen
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveView('menu')}
              disabled={state.currentStaff?.role === 'chef'}
            >
              Add More Items
            </Button>
          </div>

          <div className="mt-4 sm:mt-6 rounded-lg bg-blue-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Table {selectedTable.number}</strong>
              <br />
              {selectedTable.capacity} guests
              <br />
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
