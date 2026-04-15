import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Search, Trash2, Printer, ChevronDown, Package,
  Download, Ban, ChevronLeft, ChevronRight, X, Loader,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AddTransactionModal } from "./AddTransactionModal";
import { ReceiptModal } from "./ReceiptModal";

const PAGE_SIZE = 25;

// ── Void Transaction Modal ────────────────────────────────────────────────────
function VoidModal({ tx, currency, onClose, onVoided }) {
  const { voidTransaction } = useApp();
  const [reason,  setReason]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) { setError("A reason is required."); return; }
    setSaving(true);
    try {
      const updated = await voidTransaction(tx.id, reason.trim());
      onVoided(updated);
    } catch {
      setError("Failed to void transaction. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0">Void Transaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Receipt</span>
              <span className="font-medium">{tx.receiptNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Customer</span>
              <span>{tx.customer}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800">
              <span>Total</span>
              <span>{currency}{(tx.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Reason for voiding <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer returned items, duplicate entry..."
              rows={3}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 resize-none"
            />
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg m-0">
            Voiding keeps the transaction in your records as cancelled. Use Delete to remove it entirely.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader size={14} className="animate-spin" /> Voiding…</> : "Void Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Transactions() {
  const { transactions, deleteTransaction, addProduct, products, deleteProduct } = useApp();
  const { canAddTransactions, canDeleteTransactions, canManageProducts, currency } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const [showAdd,    setShowAdd]    = useState(false);
  const [receiptTx,  setReceiptTx]  = useState(null);
  const [voidTx,     setVoidTx]     = useState(null);
  const [search,     setSearch]     = useState("");
  const [tab,        setTab]        = useState("transactions");
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [page,       setPage]       = useState(1);

  // New product form
  const [newProduct,   setNewProduct]   = useState({ name: "", price: "", costPrice: "", category: "" });
  const [productError, setProductError] = useState("");

  // Accept search query from header global search
  useEffect(() => {
    if (location.state?.openAdd) {
      setShowAdd(true);
      window.history.replaceState({}, "");
    }
    if (location.state?.search) {
      setSearch(location.state.search);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Reset to page 1 whenever filter changes
  useEffect(() => { setPage(1); }, [search, datePreset, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    const q   = search.toLowerCase();
    const now = new Date();
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.customer?.toLowerCase().includes(q) ||
        tx.receiptNumber?.toLowerCase().includes(q) ||
        tx.items?.some((i) => i.productName?.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const txDate = new Date(tx.createdAt);
      if (datePreset === "today") return txDate.toDateString() === now.toDateString();
      if (datePreset === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      }
      if (datePreset === "month") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (datePreset === "custom") {
        if (dateFrom && txDate < new Date(dateFrom + "T00:00:00")) return false;
        if (dateTo   && txDate > new Date(dateTo   + "T23:59:59")) return false;
      }
      return true;
    });
  }, [transactions, search, datePreset, dateFrom, dateTo]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, t) => s + (t.total || 0), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  function handleAddSuccess(tx) {
    setShowAdd(false);
    setReceiptTx(tx);
  }

  function handleVoided(updated) {
    setVoidTx(null);
  }

  function handleAddProduct(e) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      setProductError("Name and price are required.");
      return;
    }
    addProduct({ name: newProduct.name, price: parseFloat(newProduct.price), costPrice: parseFloat(newProduct.costPrice) || 0, category: newProduct.category });
    setNewProduct({ name: "", price: "", costPrice: "", category: "" });
    setProductError("");
  }

  function exportCSV() {
    const headers = ["Receipt #", "Date", "Time", "Customer", "Items", "Payment Method", `Total (${currency})`, "Status", "Added By"];
    const rows = transactions.map((tx) => [
      tx.receiptNumber || "",
      tx.date || "",
      tx.time || "",
      tx.customer || "",
      (tx.items || []).map((i) => `${i.productName} x${i.qty}`).join("; "),
      tx.paymentMethod || "",
      (tx.total || 0).toFixed(2),
      tx.status || "completed",
      tx.addedBy || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 m-0">Transactions</h2>
          <p className="text-sm text-gray-500 m-0">Manage your sales and products.</p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 cursor-pointer transition-colors"
            >
              <Download size={16} /> Export CSV
            </button>
          )}
          {canAddTransactions && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg border-none cursor-pointer transition-colors"
            >
              <Plus size={16} /> New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        {["transactions", "products"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer transition-colors capitalize
              ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 bg-transparent hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
        <>
          {/* Search + date filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full max-w-xs">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, receipt..."
                className="bg-transparent border-none outline-none text-sm text-gray-600 w-full"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 border-none bg-transparent cursor-pointer p-0">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: "all",    label: "All" },
                { key: "today",  label: "Today" },
                { key: "week",   label: "This Week" },
                { key: "month",  label: "This Month" },
                { key: "custom", label: "Custom" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDatePreset(key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors
                    ${datePreset === key ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-400 bg-white" />
                <span className="text-gray-400 text-sm">—</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-400 bg-white" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <ChevronDown size={36} className="mx-auto mb-2 opacity-30" />
                <p className="m-0 text-sm">
                  {search || datePreset !== "all" ? "No transactions match your filter." : "No transactions yet."}
                </p>
                {canAddTransactions && !search && datePreset === "all" && (
                  <button onClick={() => setShowAdd(true)}
                    className="mt-3 text-sm text-teal-500 hover:text-teal-700 border-none bg-transparent cursor-pointer font-medium">
                    Record your first sale →
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Receipt #</th>
                      <th className="text-left px-4 py-3 font-medium">Customer</th>
                      <th className="text-left px-4 py-3 font-medium">Items</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-right px-4 py-3 font-medium">Total</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((tx) => {
                      const isVoided = tx.status === "voided";
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${isVoided ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-teal-700 font-medium m-0">{tx.receiptNumber}</p>
                            {isVoided && (
                              <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                VOIDED
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 m-0">{tx.customer}</p>
                            <p className="text-xs text-gray-400 m-0 capitalize">{tx.paymentMethod}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {isVoided
                              ? <span className="text-red-400 italic">{tx.voidReason || "Voided"}</span>
                              : tx.items?.map((i) => `${i.productName} x${i.qty}`).join(", ")}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {tx.date}<br />{tx.time}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            <span className={isVoided ? "line-through text-gray-400" : ""}>
                              {currency}{(tx.total || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isVoided && (
                                <button onClick={() => setReceiptTx(tx)} title="Print receipt"
                                  className="text-gray-400 hover:text-teal-600 border-none bg-transparent cursor-pointer">
                                  <Printer size={16} />
                                </button>
                              )}
                              {canDeleteTransactions && !isVoided && (
                                <button onClick={() => setVoidTx(tx)} title="Void transaction"
                                  className="text-gray-400 hover:text-amber-500 border-none bg-transparent cursor-pointer">
                                  <Ban size={15} />
                                </button>
                              )}
                              {canDeleteTransactions && (
                                <button onClick={() => deleteTransaction(tx.id)} title="Delete permanently"
                                  className="text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer: summary + pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1 flex-wrap gap-3">
              <p className="text-xs text-gray-400 m-0">
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                {" — "}showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                {datePreset !== "all" && (
                  <button onClick={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
                    className="ml-2 text-teal-500 hover:text-teal-700 border-none bg-transparent cursor-pointer text-xs font-medium p-0">
                    Clear filter ×
                  </button>
                )}
              </p>

              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-800 m-0">
                  Total: <span className="text-teal-600">{currency}{filteredTotal.toFixed(2)}</span>
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-500 px-2">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {canManageProducts && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Add Product</h3>
              <form onSubmit={handleAddProduct} className="space-y-3">
                {productError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{productError}</p>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product name</label>
                  <input type="text" value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Bottled Water"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling price ({currency})</label>
                  <input type="number" min="0" step="0.01" value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost price ({currency})</label>
                  <input type="number" min="0" step="0.01" value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category (optional)</label>
                  <input type="text" value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="e.g. Beverages"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                </div>
                <button type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors">
                  Add Product
                </button>
              </form>
            </div>
          )}

          <div className={canManageProducts ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800 m-0">Product Catalogue ({products.length})</h3>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm m-0">No products added yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {products.map((p) => {
                    const cost   = Number(p.costPrice) || 0;
                    const price  = Number(p.price)     || 0;
                    const margin = price > 0 && cost > 0
                      ? (((price - cost) / price) * 100).toFixed(1) : null;
                    const marginColor = margin === null ? "" :
                      parseFloat(margin) >= 30 ? "text-teal-600" :
                      parseFloat(margin) >= 10 ? "text-amber-500" : "text-red-500";
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm m-0">{p.name}</p>
                          {p.category && <p className="text-xs text-gray-400 m-0">{p.category}</p>}
                          {cost > 0 && <p className="text-xs text-gray-400 m-0">Cost: {currency}{cost.toFixed(2)}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-teal-600 m-0">{currency}{price.toFixed(2)}</p>
                            {margin !== null && (
                              <p className={`text-xs font-medium m-0 ${marginColor}`}>{margin}% margin</p>
                            )}
                          </div>
                          {canManageProducts && (
                            <button onClick={() => deleteProduct(p.id)}
                              className="text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdd  && <AddTransactionModal onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />}
      {receiptTx && <ReceiptModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />}
      {voidTx   && <VoidModal tx={voidTx} currency={currency} onClose={() => setVoidTx(null)} onVoided={handleVoided} />}
    </div>
  );
}
