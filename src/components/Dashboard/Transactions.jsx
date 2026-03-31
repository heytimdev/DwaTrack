import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Trash2, Printer, ChevronDown, Package, Download } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AddTransactionModal } from "./AddTransactionModal";
import { ReceiptModal } from "./ReceiptModal";

export function Transactions() {
  const { transactions, deleteTransaction, addProduct, products, deleteProduct } = useApp();
  const { canAddTransactions, canDeleteTransactions, canManageProducts, currency } = useAuth();
  const location = useLocation();

  const [showAdd, setShowAdd] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);
  const [viewTx, setViewTx] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("transactions"); // "transactions" | "products"
  const [datePreset, setDatePreset] = useState("all"); // "all" | "today" | "week" | "month" | "custom"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // New product form
  const [newProduct, setNewProduct] = useState({ name: "", price: "", costPrice: "", category: "" });
  const [productError, setProductError] = useState("");

  useEffect(() => {
    if (location.state?.openAdd) {
      setShowAdd(true);
      window.history.replaceState({}, "");
    }
    if (location.state?.viewId) {
      const tx = transactions.find((t) => t.id === location.state.viewId);
      if (tx) setViewTx(tx);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const filtered = transactions.filter((tx) => {
    // text search
    const q = search.toLowerCase();
    const matchesSearch =
      tx.customer?.toLowerCase().includes(q) ||
      tx.receiptNumber?.toLowerCase().includes(q) ||
      tx.items?.some((i) => i.productName?.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    // date filter
    const txDate = new Date(tx.createdAt);
    const now = new Date();

    if (datePreset === "today") {
      return txDate.toDateString() === now.toDateString();
    }
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

  const filteredTotal = filtered.reduce((s, t) => s + (t.total || 0), 0);

  function handleAddSuccess(tx) {
    setShowAdd(false);
    setReceiptTx(tx);
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
    const headers = ["Receipt #", "Date", "Time", "Customer", "Items", "Payment Method", `Total (${currency})`, "Added By"];
    const rows = transactions.map((tx) => [
      tx.receiptNumber || "",
      tx.date || "",
      tx.time || "",
      tx.customer || "",
      (tx.items || []).map((i) => `${i.productName} x${i.qty}`).join("; "),
      tx.paymentMethod || "",
      (tx.total || 0).toFixed(2),
      tx.addedBy || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
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
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full max-w-xs">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, receipt..."
                className="bg-transparent border-none outline-none text-sm text-gray-600 w-full"
              />
            </div>

            {/* Preset buttons */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: "all",   label: "All" },
                { key: "today", label: "Today" },
                { key: "week",  label: "This Week" },
                { key: "month", label: "This Month" },
                { key: "custom",label: "Custom" },
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

            {/* Custom date range */}
            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-400 bg-white"
                />
                <span className="text-gray-400 text-sm">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-teal-400 bg-white"
                />
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
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 text-sm text-teal-500 hover:text-teal-700 border-none bg-transparent cursor-pointer font-medium"
                  >
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
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-teal-700 font-medium">{tx.receiptNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 m-0">{tx.customer}</p>
                          <p className="text-xs text-gray-400 m-0 capitalize">{tx.paymentMethod}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {tx.items?.map((i) => `${i.productName} x${i.qty}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {tx.date}<br />{tx.time}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {currency}{(tx.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setReceiptTx(tx)}
                              title="Print receipt"
                              className="text-gray-400 hover:text-teal-600 border-none bg-transparent cursor-pointer"
                            >
                              <Printer size={16} />
                            </button>
                            {canDeleteTransactions && (
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                title="Delete"
                                className="text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filtered summary */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-xs text-gray-400 m-0">
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                {datePreset !== "all" && (
                  <button
                    onClick={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
                    className="ml-2 text-teal-500 hover:text-teal-700 border-none bg-transparent cursor-pointer text-xs font-medium p-0"
                  >
                    Clear filter ×
                  </button>
                )}
              </p>
              <p className="text-sm font-semibold text-gray-800 m-0">
                Total: <span className="text-teal-600">{currency}{filteredTotal.toFixed(2)}</span>
              </p>
            </div>
          )}
        </>
      )}

      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Add product form */}
          {canManageProducts && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Add Product</h3>
              <form onSubmit={handleAddProduct} className="space-y-3">
                {productError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{productError}</p>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Bottled Water"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category (optional)</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="e.g. Beverages"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
                >
                  Add Product
                </button>
              </form>
            </div>
          )}

          {/* Products list */}
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
                    const cost = Number(p.costPrice) || 0;
                    const price = Number(p.price) || 0;
                    const margin = price > 0 && cost > 0
                      ? (((price - cost) / price) * 100).toFixed(1)
                      : null;
                    const marginColor = margin === null ? "" : parseFloat(margin) >= 30 ? "text-teal-600" : parseFloat(margin) >= 10 ? "text-amber-500" : "text-red-500";
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm m-0">{p.name}</p>
                          {p.category && <p className="text-xs text-gray-400 m-0">{p.category}</p>}
                          {cost > 0 && (
                            <p className="text-xs text-gray-400 m-0">Cost: {currency}{cost.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-teal-600 m-0">{currency}{price.toFixed(2)}</p>
                            {margin !== null && (
                              <p className={`text-xs font-medium m-0 ${marginColor}`}>{margin}% margin</p>
                            )}
                          </div>
                          {canManageProducts && (
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer"
                            >
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

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />}
      {receiptTx && <ReceiptModal transaction={receiptTx} onClose={() => setReceiptTx(null)} />}
    </div>
  );
}
