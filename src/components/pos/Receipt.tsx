import { useRef } from 'react';
import { usePOS } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { Order } from '@/types/pos';

interface ReceiptProps {
  order: Order;
}

export function Receipt({ order }: ReceiptProps) {
  const { state } = usePOS();
  const { currentStaff } = state;
  const receiptRef = useRef<HTMLDivElement>(null);

  const canPrintReceipt =
    currentStaff?.role === 'admin' ||
    currentStaff?.role === 'manager' ||
    currentStaff?.role === 'cashier' ||
    (currentStaff?.role === 'waiter' && order.waiterId === currentStaff.id);

  if (!canPrintReceipt) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Write content to the iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      // ... (HTML Content Construction - Same as before)
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              /* ... (Same styles as before) ... */
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 80mm;
                margin: 0;
                padding: 10px;
                text-align: center;
                background: #fff;
                color: #000;
              }
              .header { margin-bottom: 20px; }
              .header h1 { font-size: 24px; margin: 0 0 5px 0; font-weight: bold; }
              .header p { margin: 2px 0; font-size: 12px; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .info-row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
              .items-table { width: 100%; font-size: 12px; border-collapse: collapse; margin: 10px 0; }
              .items-table th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 5px; }
              .items-table td { padding: 5px 0; vertical-align: top; }
              .item-qty { width: 30px; }
              .item-name { text-align: left; }
              .item-price { text-align: right; }
              .totals { text-align: right; font-size: 12px; margin-top: 10px; }
              .totals-row { display: flex; justify-content: space-between; margin: 2px 0; }
              .total-final { font-weight: bold; font-size: 14px; margin-top: 5px; }
              .footer { margin-top: 20px; font-size: 12px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>C-BOY RESTAURANT</h1>
              <p>123 Culinary Ave, Food City</p>
              <p>Tel: (555) 123-4567</p>
              <p>IG: @cboy_restaurant</p>
            </div>
            
            <div class="info-row">
              <span>${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}</span>
            </div>
            <div class="info-row">
              <span>Receipt: #R-${order.id.slice(-4).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span>Table: ${order.tableNumber}</span>
              <span>Server: ${order.servedBy}</span>
            </div>

            <div class="divider"></div>

            <table class="items-table">
              <thead>
                <tr>
                  <th class="item-qty">Qty</th>
                  <th class="item-name">Item</th>
                  <th class="item-price">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td class="item-qty">${item.quantity}</td>
                    <td class="item-name">
                      ${item.menuItem.name}
                      ${item.modifiers.length > 0 ? `<br/><span style="font-size:10px; padding-left:5px">- ${item.modifiers.map(m => m.name).join(', ')}</span>` : ''}
                    </td>
                    <td class="item-price">$${((item.menuItem.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="divider"></div>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>$${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Tax:</span>
                <span>$${order.tax.toFixed(2)}</span>
              </div>
              <div class="divider"></div>
              <div class="totals-row total-final">
                <span>Total:</span>
                <span>$${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>TIP IS NOT INCLUDED</p>
              <p>THANK YOU FOR DINING WITH US!</p>
              <p>PLEASE COME AGAIN</p>
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }, 250);
    }
  };

  return (
    <>
      <div style={{ display: 'none' }}>
        <div ref={receiptRef}>
          {/* This reference is mainly for the print logic above, 
              but since we construct the HTML manually string-based for the iframe,
              this div is actually just a placeholder hook for the ref. 
          */}
        </div>
      </div>
      <Button onClick={handlePrint} size="sm" variant="outline" className="gap-2">
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>
    </>
  );
}
