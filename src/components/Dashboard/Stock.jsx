import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Package, Plus, Trash2, RefreshCw, AlertTriangle, X } from "lucide-react";

function AddStockModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", quantity: "", unit: "pcs", lowStockThreshold: "5" });
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Item name is required");
    if (!form.quantity || Number(form.quantity) < 0) return setError("Enter a valid quantity");
    onAdd(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 m-0">Add Stock Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm m-0">{error}</p>}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              placeholder="e.g. Coca Cola 50cl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Low Stock Alert Threshold</label>
            <input
              type="number"
              min="0"
              placeholder="5"
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            <p className="text-xs text-gray-400 m-0">Alert when quantity falls below this number</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-teal-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RestockModal({ item, onClose, onRestock }) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) return setError("Enter a valid quantity to add");
    onRestock(item.id, Number(qty));
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 m-0">Restock: {item.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm m-0">{error}</p>}
          <p className="text-sm text-gray-600 m-0">Current quantity: <strong>{item.quantity} {item.unit}</strong></p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quantity to Add</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-teal-700"
            >
              Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Stock() {
  const { stock, addStockItem, deleteStockItem, restockItem } = useApp();
  const { canManageExpenses } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [search, setSearch] = useState("");

  const isOwnerOrManager = canManageExpenses;

  const filtered = stock.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = stock.filter((s) => s.quantity <= s.lowStockThreshold);

  const totalItems = stock.length;
  const totalUnits = stock.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 m-0">Stock / Inventory</h1>
          <p className="text-sm text-gray-500 m-0 mt-0.5">Track your product inventory</p>
        </div>
        {isOwnerOrManager && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-teal-700 border-none"
          >
            <Plus size={16} />
            Add Item
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 m-0 mb-1">Total Items</p>
          <p className="text-2xl font-semibold text-gray-800 m-0">{totalItems}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 m-0 mb-1">Total Units</p>
          <p className="text-2xl font-semibold text-gray-800 m-0">{totalUnits}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 m-0 mb-1">Low Stock Alerts</p>
          <p className={`text-2xl font-semibold m-0 ${lowStockItems.length > 0 ? "text-amber-500" : "text-gray-800"}`}>
            {lowStockItems.length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 m-0 mb-1">Out of Stock</p>
          <p className={`text-2xl font-semibold m-0 ${stock.filter(s => s.quantity === 0).length > 0 ? "text-red-500" : "text-gray-800"}`}>
            {stock.filter((s) => s.quantity === 0).length}
          </p>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 m-0">Low stock on {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}</p>
            <p className="text-xs text-amber-700 m-0 mt-0.5">
              {lowStockItems.map((s) => `${s.name} (${s.quantity} ${s.unit})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search stock items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={40} className="mb-3 opacity-40" />
            <p className="text-sm m-0">{stock.length === 0 ? "No stock items yet. Add your first item." : "No items match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Item</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Quantity</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Threshold</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  {isOwnerOrManager && (
                    <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  const isOut = item.quantity === 0;
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                            <Package size={14} className="text-teal-600" />
                          </div>
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-800"}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.lowStockThreshold}</td>
                      <td className="px-4 py-3 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Out of Stock</span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">In Stock</span>
                        )}
                      </td>
                      {isOwnerOrManager && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setRestockTarget(item)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 border-none cursor-pointer"
                            >
                              <RefreshCw size={12} />
                              Restock
                            </button>
                            <button
                              onClick={() => deleteStockItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer rounded-lg hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={addStockItem} />}
      {restockTarget && (
        <RestockModal
          item={restockTarget}
          onClose={() => setRestockTarget(null)}
          onRestock={restockItem}
        />
      )}
    </div>
  );
}
