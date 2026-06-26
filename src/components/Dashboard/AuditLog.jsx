import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight, Filter, X, AlertCircle, RefreshCw } from "lucide-react";
import api from "../../api";

const ACTION_LABELS = {
  "transaction.add":    { label: "Sale recorded",      color: "bg-teal-100 text-teal-700" },
  "transaction.void":   { label: "Transaction voided", color: "bg-amber-100 text-amber-700" },
  "transaction.delete": { label: "Transaction deleted", color: "bg-red-100 text-red-700" },
  "expense.add":        { label: "Expense added",       color: "bg-orange-100 text-orange-700" },
  "expense.delete":     { label: "Expense deleted",     color: "bg-red-100 text-red-700" },
  "product.add":        { label: "Product added",       color: "bg-blue-100 text-blue-700" },
  "product.update":     { label: "Product updated",     color: "bg-blue-100 text-blue-700" },
  "product.delete":     { label: "Product deleted",     color: "bg-red-100 text-red-700" },
  "stock.add":          { label: "Stock item added",    color: "bg-purple-100 text-purple-700" },
  "stock.update":       { label: "Stock updated",       color: "bg-purple-100 text-purple-700" },
  "stock.restock":      { label: "Stock restocked",     color: "bg-green-100 text-green-700" },
  "stock.delete":       { label: "Stock item deleted",  color: "bg-red-100 text-red-700" },
  "team.add":           { label: "Team member added",   color: "bg-indigo-100 text-indigo-700" },
  "team.deactivate":    { label: "Member deactivated",  color: "bg-gray-100 text-gray-600" },
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function formatDetail(action, detail) {
  if (!detail) return null;
  if (action === "transaction.add")
    return `${detail.customer || "Walk-in"} · ${detail.paymentMethod} · GH₵${Number(detail.total).toFixed(2)}`;
  if (action === "transaction.void")
    return `Reason: ${detail.reason}`;
  if (action === "expense.add")
    return `${detail.description} · ${detail.category} · GH₵${Number(detail.amount).toFixed(2)}`;
  if (action.startsWith("product."))
    return detail.name ? `${detail.name}${detail.price != null ? ` · GH₵${Number(detail.price).toFixed(2)}` : ""}` : null;
  if (action === "stock.restock")
    return `+${detail.addQty} units added`;
  if (action.startsWith("stock."))
    return detail.name ? `${detail.name}${detail.quantity != null ? ` · qty ${detail.quantity}` : ""}` : null;
  if (action === "team.add")
    return `${detail.name} (${detail.role}) · ${detail.email}`;
  return null;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
}

export function AuditLog() {
  const [entries,  setEntries]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState("");
  const [error,    setError]    = useState(null);

  const fetchPage = useCallback(async (p, actionFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: 50 });
      if (actionFilter) params.set("action", actionFilter);
      const data = await api.get(`/audit?${params}`);
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
    } catch (err) {
      setEntries([]);
      setError(err.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1, filter); }, [filter]);

  function handlePageChange(p) { fetchPage(p, filter); }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldCheck size={18} className="text-teal-500" />
            <h2 className="text-lg font-semibold text-gray-800 m-0">Audit Log</h2>
          </div>
          <p className="text-sm text-gray-500 m-0">Every change made by your team, in order.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 bg-white px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              <X size={12} /> Clear filter
            </button>
          )}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5">
            <Filter size={13} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs text-gray-600 border-none outline-none bg-transparent cursor-pointer"
            >
              <option value="">All actions</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-teal-400 rounded-full animate-spin mr-2" />
            Loading…
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle size={36} className="mx-auto mb-2 text-red-300" />
            <p className="text-sm text-red-500 m-0 font-medium">Failed to load audit log</p>
            <p className="text-xs text-gray-400 m-0 mt-1">{error}</p>
            <button
              onClick={() => fetchPage(1, filter)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 border border-teal-200 bg-white px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShieldCheck size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm m-0">No activity recorded yet.</p>
            <p className="text-xs text-gray-400 m-0 mt-1">Actions by your team will appear here.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {entries.map((e) => {
                const badge   = ACTION_LABELS[e.action] || { label: e.action, color: "bg-gray-100 text-gray-600" };
                const detail  = formatDetail(e.action, e.detail);
                const actor   = e.actorName || "Unknown";
                const roleTag = e.actorRole === "owner" ? "Owner" : e.actorRole === "manager" ? "Manager" : "Cashier";
                return (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    {/* Actor avatar */}
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      {actor.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{actor}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{roleTag}</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                      {detail && (
                        <p className="text-xs text-gray-500 m-0 mt-0.5 truncate">{detail}</p>
                      )}
                    </div>

                    <span className="text-xs text-gray-400 shrink-0 mt-0.5 whitespace-nowrap" title={new Date(e.createdAt).toLocaleString("en-GH")}>
                      {timeAgo(e.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 m-0">{total} total entries</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer bg-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-600 px-2">Page {page} of {pages}</span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer bg-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
