import { X, Printer } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function ReceiptModal({ transaction, onClose }) {
  const { currentUser } = useAuth();

  if (!transaction) return null;

  const currency   = currentUser?.currency     || "GH₵";
  const shopName   = currentUser?.businessName || "My Shop";
  const shopCity   = currentUser?.city         || "";
  const shopPhone  = currentUser?.phoneNumber  || "";
  const shopEmail  = currentUser?.businessEmail || "";
  const logoSrc    = currentUser?.businessLogo || "";

  const isPaid    = transaction.paymentStatus === "paid"    || !transaction.paymentStatus;
  const isPartial = transaction.paymentStatus === "partial";
  const isCredit  = transaction.paymentStatus === "credit";
  const isVoided  = transaction.status === "voided";

  const subtotal    = transaction.taxAmount > 0 ? transaction.total - transaction.taxAmount : transaction.total || 0;
  const amountPaid  = Number(transaction.amountPaid || 0);
  const balanceDue  = isPartial || isCredit ? (transaction.total || 0) - amountPaid : 0;
  const isWalkIn    = !transaction.customer || transaction.customer === "Walk-in Customer";

  // ── Print HTML ────────────────────────────────────────────────────────────
  function buildPrintHTML() {
    const div = (style, content) => `<div style="${style}">${content}</div>`;
    const row = (label, value, bold = false) =>
      `<tr>
        <td style="padding:3px 0;font-size:11px;color:#555;">${label}</td>
        <td style="padding:3px 0;font-size:11px;text-align:right;color:#111;${bold ? 'font-weight:700;font-size:13px;' : ''}">${value}</td>
      </tr>`;

    const logoBlock = logoSrc
      ? `<img src="${logoSrc}" alt="logo"
           style="width:64px;height:64px;object-fit:contain;display:block;margin:0 auto 8px;"
           onload="this.dataset.loaded='1'"
         />`
      : "";

    const itemRows = (transaction.items || []).map(item => `
      <tr>
        <td style="padding:4px 0 4px;font-size:11px;color:#111;vertical-align:top;">${item.productName}</td>
        <td style="padding:4px 0;font-size:11px;text-align:center;color:#555;white-space:nowrap;">${item.qty} × ${currency}${Number(item.price).toFixed(2)}</td>
        <td style="padding:4px 0;font-size:11px;text-align:right;color:#111;font-weight:600;white-space:nowrap;">${currency}${(item.qty * item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    const statusStamp = isVoided
      ? `<div style="text-align:center;border:2px solid #dc2626;border-radius:4px;padding:4px 12px;margin:10px 0;display:inline-block;">
           <span style="font-size:13px;font-weight:900;color:#dc2626;letter-spacing:3px;">VOID</span>
         </div>`
      : isCredit
      ? `<div style="text-align:center;border:2px solid #d97706;border-radius:4px;padding:4px 12px;margin:10px 0;display:inline-block;">
           <span style="font-size:13px;font-weight:900;color:#d97706;letter-spacing:3px;">CREDIT</span>
         </div>`
      : isPartial
      ? `<div style="text-align:center;border:2px solid #2563eb;border-radius:4px;padding:4px 12px;margin:10px 0;display:inline-block;">
           <span style="font-size:13px;font-weight:900;color:#2563eb;letter-spacing:3px;">PARTIAL</span>
         </div>`
      : "";

    const metaRows = [
      ["Date & Time", `${transaction.date}  ${transaction.time}`],
      ["Receipt No.", transaction.receiptNumber],
      ...(!isWalkIn ? [["Customer", transaction.customer]] : []),
      ...(transaction.addedBy ? [["Served by", transaction.addedBy]] : []),
    ].map(([l, v]) => row(l, v)).join("");

    const totalsBlock = `
      <table style="width:100%;border-collapse:collapse;">
        ${transaction.taxAmount > 0 ? row("Subtotal", `${currency}${subtotal.toFixed(2)}`) : ""}
        ${transaction.taxAmount > 0 ? row(transaction.taxLabel || "Tax", `${currency}${Number(transaction.taxAmount).toFixed(2)}`) : ""}
        ${row("TOTAL", `${currency}${(transaction.total || 0).toFixed(2)}`, true)}
        ${!isCredit ? row("Payment Method", (transaction.paymentMethod || "Cash").replace(/\b\w/g, c => c.toUpperCase())) : ""}
        ${isPartial || isCredit ? row("Amount Paid", `${currency}${amountPaid.toFixed(2)}`) : ""}
        ${isPartial || isCredit ? `<tr><td style="padding:3px 0;font-size:11px;color:#d97706;font-weight:600;">Balance Due</td><td style="padding:3px 0;font-size:11px;text-align:right;color:#d97706;font-weight:700;">${currency}${balanceDue.toFixed(2)}</td></tr>` : ""}
      </table>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title></title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    @page { marks: none; }
    body { margin:0; padding:12mm 10mm 8mm; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#111; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    * { box-sizing:border-box; }
    hr { border:none; border-top:1px dashed #ccc; margin:10px 0; }
  </style>
</head>
<body>
<div style="max-width:300px;margin:0 auto;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:12px;">
    ${logoBlock}
    <div style="font-size:17px;font-weight:700;color:#111;margin-bottom:3px;">${shopName}</div>
    ${shopCity   ? `<div style="font-size:10px;color:#666;">${shopCity}</div>` : ""}
    ${shopPhone  ? `<div style="font-size:10px;color:#666;">Tel: ${shopPhone}</div>` : ""}
    ${shopEmail  ? `<div style="font-size:10px;color:#666;">${shopEmail}</div>` : ""}
  </div>

  <!-- Stamp -->
  ${statusStamp ? `<div style="text-align:center;">${statusStamp}</div>` : ""}
  ${isVoided && transaction.voidReason ? `<div style="text-align:center;font-size:10px;color:#ef4444;margin-top:2px;margin-bottom:6px;">Reason: ${transaction.voidReason}</div>` : ""}

  <hr/>

  <!-- Meta -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
    ${metaRows}
  </table>

  <hr/>

  <!-- Items -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
    <thead>
      <tr style="border-bottom:1px solid #eee;">
        <th style="font-size:10px;font-weight:600;color:#888;text-align:left;padding:3px 0;">ITEM</th>
        <th style="font-size:10px;font-weight:600;color:#888;text-align:center;padding:3px 0;">QTY × PRICE</th>
        <th style="font-size:10px;font-weight:600;color:#888;text-align:right;padding:3px 0;">AMT</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr/>

  <!-- Totals -->
  ${totalsBlock}

  <hr/>

  <!-- Footer -->
  <div style="text-align:center;margin-top:8px;">
    <div style="font-size:11px;color:#555;margin-bottom:6px;">Thank you for your patronage!</div>
    <div style="display:inline-block;border-top:1px solid #e5e7eb;padding-top:6px;width:100%;">
      <div style="font-size:10px;color:#888;">Managed with <strong style="color:#0f766e;">DwaTrack</strong></div>
      <div style="font-size:10px;color:#0f766e;">dwatrack.netlify.app</div>
    </div>
  </div>

</div>

<script>
  // Wait for all images to load before printing
  window.addEventListener('load', function() {
    var imgs = document.querySelectorAll('img');
    if (imgs.length === 0) { window.print(); return; }
    var loaded = 0;
    function tryPrint() { loaded++; if (loaded >= imgs.length) window.print(); }
    imgs.forEach(function(img) {
      if (img.complete) { tryPrint(); }
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    });
  });
</script>
</body>
</html>`;
  }

  function handlePrint() {
    const popup = window.open("", "_blank", "width=420,height=700");
    popup.document.write(buildPrintHTML());
    popup.document.close();
  }

  // ── On-screen preview ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800 m-0">Receipt Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }} className="text-sm max-w-xs mx-auto">

            {/* Header */}
            <div className="text-center mb-4">
              {logoSrc && (
                <img src={logoSrc} alt="logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
              )}
              <p className="font-bold text-base m-0 text-gray-900">{shopName}</p>
              {shopCity  && <p className="text-xs text-gray-500 m-0">{shopCity}</p>}
              {shopPhone && <p className="text-xs text-gray-500 m-0">Tel: {shopPhone}</p>}
              {shopEmail && <p className="text-xs text-gray-500 m-0">{shopEmail}</p>}
            </div>

            {/* Status stamp */}
            {isVoided && (
              <div className="text-center mb-3">
                <span className="inline-block border-2 border-red-600 text-red-600 font-black text-sm tracking-[3px] px-3 py-1 rounded">VOID</span>
                {transaction.voidReason && <p className="text-xs text-red-500 mt-1">{transaction.voidReason}</p>}
              </div>
            )}
            {isCredit && !isVoided && (
              <div className="text-center mb-3">
                <span className="inline-block border-2 border-amber-600 text-amber-600 font-black text-sm tracking-[3px] px-3 py-1 rounded">CREDIT</span>
              </div>
            )}
            {isPartial && !isVoided && (
              <div className="text-center mb-3">
                <span className="inline-block border-2 border-blue-600 text-blue-600 font-black text-sm tracking-[3px] px-3 py-1 rounded">PARTIAL</span>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Meta */}
            <div className="space-y-1 mb-3 text-xs">
              {[
                ["Date & Time", `${transaction.date}  ${transaction.time}`],
                ["Receipt No.", transaction.receiptNumber],
                ...(!isWalkIn ? [["Customer", transaction.customer]] : []),
                ...(transaction.addedBy ? [["Served by", transaction.addedBy]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{val}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Items */}
            <div className="mb-3">
              <div className="flex text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                <span className="flex-1">Item</span>
                <span className="w-28 text-center">Qty × Price</span>
                <span className="w-16 text-right">Amt</span>
              </div>
              {(transaction.items || []).map((item, i) => (
                <div key={i} className="flex text-xs mb-1.5 items-start">
                  <span className="flex-1 text-gray-900 font-medium pr-2">{item.productName}</span>
                  <span className="w-28 text-center text-gray-500">{item.qty} × {currency}{Number(item.price).toFixed(2)}</span>
                  <span className="w-16 text-right font-semibold text-gray-900">{currency}{(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Totals */}
            <div className="text-xs space-y-1.5">
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{transaction.taxLabel || "Tax"}</span>
                  <span>{currency}{Number(transaction.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-1">
                <span>Total</span>
                <span>{currency}{(transaction.total || 0).toFixed(2)}</span>
              </div>
              {!isCredit && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-gray-500">Payment</span>
                  <span className="capitalize font-medium">{transaction.paymentMethod || "Cash"}</span>
                </div>
              )}
              {(isPartial || isCredit) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span>{currency}{amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-600">
                    <span>Balance Due</span>
                    <span>{currency}{balanceDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500 m-0 mb-2">Thank you for your patronage!</p>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400 m-0">Managed with <span className="text-teal-600 font-semibold">DwaTrack</span></p>
                <p className="text-xs text-teal-600 m-0">dwatrack.netlify.app</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
