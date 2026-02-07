import { usePOS } from '@/store/posStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Search, Plus, Minus, Clock, ArrowLeft, ShoppingCart } from 'lucide-react';
import type { MenuItem, Modifier } from '@/types/pos';
import { menuItems as sampleMenuItems, categories } from '@/data/sampleData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export function MenuView() {
  const {
    state,
    addToCart,
    setActiveView,
    setSelectedCategory,
    openModifierDialog,
    closeModifierDialog,
    getCartTotal,
  } = usePOS();
  const { selectedTable, selectedCategory, cart, modifierItem, isModifierDialogOpen } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const filteredItems = sampleMenuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.isAvailable;
  });

  const cartTotal = getCartTotal();

  const handleItemClick = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      openModifierDialog(item);
      setSelectedModifiers([]);
      setSpecialInstructions('');
      setQuantity(1);
    } else {
      addToCart(item, 1, []);
    }
  };

  const handleAddWithModifiers = () => {
    if (modifierItem) {
      addToCart(modifierItem, quantity, selectedModifiers, specialInstructions);
      closeModifierDialog();
      setSelectedModifiers([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  };

  const toggleModifier = (modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.id === modifier.id);
      if (exists) {
        return prev.filter((m) => m.id !== modifier.id);
      }
      return [...prev, modifier];
    });
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-white p-3 sm:p-4 gap-3">
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
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Table {selectedTable.number}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {selectedTable.capacity} seats • Select items to order
            </p>
          </div>
        </div>
        
        {/* Cart Summary - Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          {cart.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg bg-orange-50 px-4 py-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-700">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
                <p className="text-lg font-bold text-orange-700">
                  ${cartTotal.total.toFixed(2)}
                </p>
              </div>
              <Button
                size="sm"
                className="ml-2 bg-orange-500 hover:bg-orange-600"
                onClick={() => setActiveView('cart')}
              >
                View Cart
              </Button>
            </div>
          )}
        </div>

        {/* Cart Summary - Mobile */}
        {cart.length > 0 && (
          <div className="sm:hidden flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items • ${cartTotal.total.toFixed(2)}
              </span>
            </div>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setActiveView('cart')}
            >
              View Cart
            </Button>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="border-b bg-slate-50 p-3 sm:p-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-slate-900' : ''}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className={
                  selectedCategory === category.name
                    ? 'bg-slate-900'
                    : 'text-slate-600'
                }
                style={
                  selectedCategory === category.name
                    ? { backgroundColor: category.color }
                    : {}
                }
              >
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Search */}
      <div className="border-b bg-white p-3 sm:p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:gap-3">
                  {/* Item Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                    <Badge variant="secondary" className="text-sm sm:text-lg font-bold shrink-0">
                      ${item.price.toFixed(2)}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 sm:pt-2">
                    {item.preparationTime && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{item.preparationTime} min</span>
                      </div>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        + Options
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="ml-auto bg-orange-500 hover:bg-orange-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Search className="mb-4 h-12 w-12 sm:h-16 sm:w-16" />
            <p className="text-base sm:text-lg font-medium">No items found</p>
            <p className="text-sm">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Modifier Dialog */}
      <Dialog open={isModifierDialogOpen} onOpenChange={closeModifierDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg">{modifierItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modifiers */}
            {modifierItem?.modifiers && modifierItem.modifiers.length > 0 && (
              <div>
                <label className="text-sm font-medium">Options</label>
                <div className="space-y-2 mt-2 max-h-48 overflow-auto">
                  {modifierItem.modifiers.map((modifier) => (
                    <div
                      key={modifier.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedModifiers.some((m) => m.id === modifier.id)}
                          onCheckedChange={() => toggleModifier(modifier)}
                        />
                        <span className="text-sm">{modifier.name}</span>
                      </div>
                      {modifier.price > 0 && (
                        <span className="text-sm text-slate-500">
                          +${modifier.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <label className="text-sm font-medium">Special Instructions</label>
              <Textarea
                placeholder="Any special requests..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={closeModifierDialog} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleAddWithModifiers}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
            >
              Add - $
              {(
                ((modifierItem?.price || 0) +
                  selectedModifiers.reduce((sum, m) => sum + m.price, 0)) * quantity
              ).toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
