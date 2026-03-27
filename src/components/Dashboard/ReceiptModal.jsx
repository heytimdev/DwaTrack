import { useRef } from "react";
import { X, Printer } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ktLogo from "../../assets/logo.svg";

export function ReceiptModal({ transaction, onClose }) {
  const { currentUser } = useAuth();
  const printRef = useRef(null);

  if (!transaction) return null;

  const currency = "GH₵";
  const shopName = currentUser?.businessName || "My Shop";
  const shopAddress = currentUser?.city || "Ghana";
  const shopPhone = currentUser?.phoneNumber || "";
  const shopEmail = currentUser?.businessEmail || "";

  function handlePrint() {
    const printContent = printRef.current.innerHTML;
    const popup = window.open("", "_blank", "width=420,height=680");
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { margin: 0; }
            body { margin: 14mm 12mm; font-family: monospace; font-size: 12px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    popup.close();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 m-0">Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable receipt */}
        <div className="overflow-y-auto flex-1 p-5">
          <div ref={printRef} className="font-mono text-sm">
            {/* Shop header */}
            <div className="text-center mb-4">
              {currentUser?.businessLogo
                ? <img src={currentUser.businessLogo} alt="shop logo" className="w-14 h-14 mx-auto mb-1 object-contain" />
                : <img src={ktLogo} alt="logo" className="w-10 h-10 mx-auto mb-1" />
              }
              <p className="font-bold text-base m-0">{shopName}</p>
              <p className="text-xs text-gray-500 m-0">{shopAddress}</p>
              {shopPhone && <p className="text-xs text-gray-500 m-0">Tel: {shopPhone}</p>}
              {shopEmail && <p className="text-xs text-gray-500 m-0">{shopEmail}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Receipt info */}
            <div className="mb-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt #:</span>
                <span className="font-semibold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{transaction.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span>{transaction.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span>{transaction.addedBy}</span>
              </div>
              {transaction.customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span>{transaction.customer}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="mb-3">
              <div className="flex text-xs font-semibold text-gray-500 mb-2">
                <span className="flex-1">Item</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              {(transaction.items || []).map((item, i) => (
                <div key={i} className="flex text-xs mb-1">
                  <span className="flex-1 truncate">{item.productName}</span>
                  <span className="w-10 text-center">{item.qty}</span>
                  <span className="w-20 text-right">{currency}{Number(item.price).toFixed(2)}</span>
                  <span className="w-20 text-right">{currency}{(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Totals */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>{currency}{(transaction.total || 0).toFixed(2)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span>-{currency}{transaction.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm mt-1">
                <span>TOTAL:</span>
                <span>{currency}{(transaction.total || 0).toFixed(2)}</span>
              </div>
              {transaction.paymentMethod && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Payment:</span>
                  <span className="capitalize">{transaction.paymentMethod}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Footer */}
            <div className="text-center text-xs text-gray-500">
              <p className="m-0">Thank you for your business!</p>
              <p className="m-0">{shopName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
