import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

const PAYMENT_METHODS = ["cash", "mobile money", "card", "bank transfer", "credit"];

export function AddTransactionModal({ onClose, onSuccess }) {
  const { products, addTransaction } = useApp();
  const { currentUser, currency } = useAuth();

  const taxEnabled = currentUser?.taxEnabled || false;
  const taxLabel   = currentUser?.taxLabel   || "VAT";
  const taxRate    = parseFloat(currentUser?.taxRate) || 0;

  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [items, setItems] = useState([{ productId: "", productName: "", price: "", qty: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "productId" && value) {
        const product = products.find((p) => p.id === value);
        if (product) {
          updated[index].productName = product.name;
          updated[index].price = product.price;
        }
      }
      return updated;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", productName: "", price: "", qty: 1 }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.qty) || 0;
    return sum + price * qty;
  }, 0);

  const afterDiscount = Math.max(0, subtotal - (parseFloat(discount) || 0));
  const taxAmount = taxEnabled ? parseFloat(((afterDiscount * taxRate) / 100).toFixed(2)) : 0;
  const total = afterDiscount + taxAmount;

  async function handleSubmit(e) {
    e.preventDefault();
    const validItems = items.filter((i) => i.productName && parseFloat(i.price) > 0 && parseInt(i.qty) > 0);
    if (validItems.length === 0) {
      setError("Please add at least one item with a name, price, and quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const tx = await addTransaction({
        customer: customer || "Walk-in Customer",
        paymentMethod,
        items: validItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          price: parseFloat(i.price),
          qty: parseInt(i.qty),
        })),
        subtotal,
        discount: parseFloat(discount) || 0,
        taxLabel: taxEnabled ? taxLabel : null,
        taxAmount,
        total,
        note,
        status: "completed",
      });
      onSuccess(tx);
    } catch {
      setError("Failed to record transaction. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-800 m-0">New Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer name</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white capitalize"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 border-none bg-transparent cursor-pointer font-medium"
                >
                  <Plus size={14} /> Add item
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {/* Product dropdown */}
                      <div className="col-span-2 min-w-0">
                        <label className="block text-xs text-gray-500 mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white"
                        >
                          <option value="">-- Select product or type below --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {currency}{Number(p.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Manual name (if not from list) */}
                      {!item.productId && (
                        <div className="col-span-2 min-w-0">
                          <label className="block text-xs text-gray-500 mb-1">Item name</label>
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                            placeholder="e.g. Bottled Water"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price ({currency})</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Subtotal: {currency}{((parseFloat(item.price) || 0) * (parseInt(item.qty) || 0)).toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Total summary */}
            <div className="bg-teal-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>
              {parseFloat(discount) > 0 && (
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Discount</span>
                  <span>-{currency}{parseFloat(discount).toFixed(2)}</span>
                </div>
              )}
              {taxEnabled && taxAmount > 0 && (
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>{taxLabel} ({taxRate}%)</span>
                  <span>{currency}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base mt-2 pt-2 border-t border-teal-200">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                  Recording...
                </>
              ) : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
