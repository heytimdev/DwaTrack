import { X, Printer } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function ReceiptModal({ transaction, onClose }) {
  const { currentUser } = useAuth();

  if (!transaction) return null;

  const currency = currentUser?.currency || "GH₵";
  const shopName    = currentUser?.businessName  || "My Shop";
  const shopAddress = currentUser?.city          || "Ghana";
  const shopPhone   = currentUser?.phoneNumber   || "";
  const shopEmail   = currentUser?.businessEmail || "";
  const logoSrc     = currentUser?.businessLogo  || "";

  // ── Build the print HTML with full inline styles ──────────────────────────
  function buildPrintHTML() {
    const dash = `<div style="border-top:1px dashed #aaa;margin:10px 0;"></div>`;

    const logoHTML = logoSrc
      ? `<img src="${logoSrc}" alt="logo" style="width:56px;height:56px;object-fit:contain;display:block;margin:0 auto 4px;" />`
      : "";

    const voidedBanner = transaction.status === "voided"
      ? `<div style="text-align:center;border:1px solid #fca5a5;background:#fef2f2;border-radius:6px;padding:6px 10px;margin-bottom:10px;">
           <p style="margin:0;font-weight:700;font-size:11px;color:#dc2626;letter-spacing:2px;">VOIDED</p>
           ${transaction.voidReason ? `<p style="margin:2px 0 0;font-size:10px;color:#ef4444;">${transaction.voidReason}</p>` : ""}
         </div>`
      : "";

    const taxLine = (transaction.taxLabel && transaction.taxAmount > 0)
      ? `<tr>
           <td style="padding:2px 0;font-size:11px;color:#666;">Subtotal:</td>
           <td style="padding:2px 0;font-size:11px;text-align:right;color:#111;">${currency}${(transaction.total - transaction.taxAmount).toFixed(2)}</td>
         </tr>
         <tr>
           <td style="padding:2px 0;font-size:11px;color:#666;">${transaction.taxLabel}:</td>
           <td style="padding:2px 0;font-size:11px;text-align:right;color:#111;">${currency}${transaction.taxAmount.toFixed(2)}</td>
         </tr>`
      : `<tr>
           <td style="padding:2px 0;font-size:11px;color:#666;">Subtotal:</td>
           <td style="padding:2px 0;font-size:11px;text-align:right;color:#111;">${currency}${(transaction.total || 0).toFixed(2)}</td>
         </tr>`;

    const itemRows = (transaction.items || []).map((item) => `
      <tr>
        <td style="padding:3px 0;font-size:11px;color:#111;">${item.productName}</td>
        <td style="padding:3px 0;font-size:11px;text-align:center;color:#111;">${item.qty}</td>
        <td style="padding:3px 0;font-size:11px;text-align:right;color:#111;">${currency}${Number(item.price).toFixed(2)}</td>
        <td style="padding:3px 0;font-size:11px;text-align:right;color:#111;font-weight:600;">${currency}${(item.qty * item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt — ${transaction.receiptNumber}</title>
  <style>
    @page { margin: 10mm 8mm; }
    body { margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #111; background: #fff; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div style="max-width:360px;margin:0 auto;">

    <!-- Shop header -->
    <div style="text-align:center;margin-bottom:12px;">
      ${logoHTML}
      <p style="margin:0;font-size:15px;font-weight:700;color:#111;">${shopName}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#555;">${shopAddress}</p>
      ${shopPhone ? `<p style="margin:1px 0 0;font-size:10px;color:#555;">Tel: ${shopPhone}</p>` : ""}
      ${shopEmail ? `<p style="margin:1px 0 0;font-size:10px;color:#555;">${shopEmail}</p>` : ""}
    </div>

    ${voidedBanner}
    ${dash}

    <!-- Receipt metadata -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Receipt #:</td>
        <td style="font-size:11px;text-align:right;font-weight:600;color:#111;padding:2px 0;">${transaction.receiptNumber}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Date:</td>
        <td style="font-size:11px;text-align:right;color:#111;padding:2px 0;">${transaction.date}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Time:</td>
        <td style="font-size:11px;text-align:right;color:#111;padding:2px 0;">${transaction.time}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Cashier:</td>
        <td style="font-size:11px;text-align:right;color:#111;padding:2px 0;">${transaction.addedBy || ""}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Customer:</td>
        <td style="font-size:11px;text-align:right;color:#111;padding:2px 0;">${transaction.customer || "Walk-in Customer"}</td>
      </tr>
    </table>

    ${dash}

    <!-- Items -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
      <thead>
        <tr style="border-bottom:1px solid #ddd;">
          <th style="font-size:10px;font-weight:600;color:#666;text-align:left;padding:2px 0;">Item</th>
          <th style="font-size:10px;font-weight:600;color:#666;text-align:center;padding:2px 0;width:30px;">Qty</th>
          <th style="font-size:10px;font-weight:600;color:#666;text-align:right;padding:2px 0;width:70px;">Price</th>
          <th style="font-size:10px;font-weight:600;color:#666;text-align:right;padding:2px 0;width:70px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    ${dash}

    <!-- Totals -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
      ${taxLine}
      <tr>
        <td style="font-size:13px;font-weight:700;color:#111;padding:4px 0 2px;">TOTAL:</td>
        <td style="font-size:13px;font-weight:700;text-align:right;color:#111;padding:4px 0 2px;">${currency}${(transaction.total || 0).toFixed(2)}</td>
      </tr>
      ${transaction.paymentMethod ? `
      <tr>
        <td style="font-size:11px;color:#666;padding:2px 0;">Payment:</td>
        <td style="font-size:11px;text-align:right;text-transform:capitalize;color:#111;padding:2px 0;">${transaction.paymentMethod}</td>
      </tr>` : ""}
    </table>

    ${dash}

    <!-- Footer -->
    <div style="text-align:center;margin-top:4px;">
      <p style="margin:0;font-size:11px;color:#555;">Thank you for your business!</p>
      <p style="margin:2px 0 0;font-size:11px;color:#555;">${shopName}</p>
    </div>

  </div>
</body>
</html>`;
  }

  function handlePrint() {
    const popup = window.open("", "_blank", "width=460,height=700");
    popup.document.write(buildPrintHTML());
    popup.document.close();
    popup.focus();
    popup.print();
    popup.close();
  }

  // ── On-screen preview ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
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

        {/* Receipt preview */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="font-mono text-sm">

            {/* Shop header */}
            <div className="text-center mb-4">
              {logoSrc && (
                <img src={logoSrc} alt="shop logo" className="w-14 h-14 mx-auto mb-1 object-contain" />
              )}
              <p className="font-bold text-base m-0">{shopName}</p>
              <p className="text-xs text-gray-500 m-0">{shopAddress}</p>
              {shopPhone && <p className="text-xs text-gray-500 m-0">Tel: {shopPhone}</p>}
              {shopEmail && <p className="text-xs text-gray-500 m-0">{shopEmail}</p>}
            </div>

            {transaction.status === "voided" && (
              <div className="text-center bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
                <p className="text-red-600 font-bold text-xs m-0 uppercase tracking-widest">VOIDED</p>
                {transaction.voidReason && (
                  <p className="text-red-500 text-xs m-0 mt-0.5">{transaction.voidReason}</p>
                )}
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Receipt info */}
            <div className="mb-3 text-xs space-y-1">
              {[
                ["Receipt #:", transaction.receiptNumber],
                ["Date:", transaction.date],
                ["Time:", transaction.time],
                ["Cashier:", transaction.addedBy],
                ["Customer:", transaction.customer],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ) : null)}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="mb-3">
              <div className="flex text-xs font-semibold text-gray-500 mb-2">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              {(transaction.items || []).map((item, i) => (
                <div key={i} className="flex text-xs mb-1">
                  <span className="flex-1 truncate">{item.productName}</span>
                  <span className="w-8 text-center">{item.qty}</span>
                  <span className="w-20 text-right">{currency}{Number(item.price).toFixed(2)}</span>
                  <span className="w-20 text-right font-medium">{currency}{(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Totals */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>{currency}{(transaction.taxAmount > 0 ? transaction.total - transaction.taxAmount : transaction.total || 0).toFixed(2)}</span>
              </div>
              {transaction.taxLabel && transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{transaction.taxLabel}:</span>
                  <span>{currency}{transaction.taxAmount.toFixed(2)}</span>
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
