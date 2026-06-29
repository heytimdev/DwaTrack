import { useState } from "react";
import { Trash2, Receipt, Loader, Download, ScanLine, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { ConfirmModal } from "./ConfirmModal";
import api from "../../api";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Inventory", "Transport", "Marketing", "Equipment", "Other"];

export function Expenses() {
  const { expenses, addExpense, deleteExpense } = useApp();
  const { canManageExpenses, canDeleteTransactions, currency } = useAuth();

  const [form,         setForm]         = useState({ description: "", amount: "", category: "Other" });
  const [error,        setError]        = useState("");
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ocrPreview,   setOcrPreview]   = useState(null);
  const [ocrLoading,   setOcrLoading]   = useState(false);
  const [ocrSuccess,   setOcrSuccess]   = useState(false);
  const [ocrError,     setOcrError]     = useState("");


  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  function exportCSV() {
    const headers = ["Date", "Description", "Category", `Amount (${currency})`, "Added By"];
    const rows = expenses.map((e) => [
      e.date || "",
      e.description,
      e.category || "",
      Number(e.amount).toFixed(2),
      e.addedBy || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
      img.src = url;
    });
  }

  async function handleScanReceipt(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    ev.target.value = "";

    setOcrError("");
    setOcrSuccess(false);
    setOcrLoading(true);

    try {
      const dataUrl = await compressImage(file);
      setOcrPreview(dataUrl);

      const result = await api.post("/ai/ocr-receipt", { image: dataUrl });

      setForm((prev) => ({
        description: result.description || prev.description,
        amount:      result.amount > 0 ? String(result.amount) : prev.amount,
        category:    CATEGORIES.includes(result.category) ? result.category : prev.category,
      }));
      setOcrSuccess(true);
    } catch (err) {
      setOcrError(err.message || "Could not read receipt. Try a clearer photo.");
    } finally {
      setOcrLoading(false);
    }
  }

  function clearScan() {
    setOcrPreview(null);
    setOcrSuccess(false);
    setOcrError("");
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.description || !form.amount) {
      setError("Description and amount are required.");
      return;
    }
    setSaving(true);
    const result = await addExpense({ description: form.description, amount: parseFloat(form.amount), category: form.category });
    setSaving(false);
    if (result) {
      setForm({ description: "", amount: "", category: "Other" });
      setError("");
      clearScan();
    }
  }


  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 m-0">Expenses</h2>
          <p className="text-sm text-gray-500 m-0">Track your business costs and outgoings.</p>
        </div>
        {expenses.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 cursor-pointer transition-colors"
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500 m-0">{currency}{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 m-0">{expenses.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-2">Top Category</p>
          <p className="text-base font-bold text-gray-900 m-0">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Add expense form */}
        {canManageExpenses && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Add Expense</h3>

            {/* OCR scan area */}
            <input
              id="receipt-scan-input"
              type="file"
              accept="image/*,image/heic,image/heif"
              className="absolute opacity-0 w-0 h-0 overflow-hidden"
              onChange={handleScanReceipt}
            />

            {!ocrPreview ? (
              <label
                htmlFor="receipt-scan-input"
                className="w-full mb-4 flex items-center justify-center gap-2 border border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-600 text-sm font-medium py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                <ScanLine size={15} />
                Scan Receipt
              </label>
            ) : (
              <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden">
                <img src={ocrPreview} alt="Receipt preview" className="w-full h-28 object-cover block" />
                <div className="px-3 py-2 flex items-center justify-between gap-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {ocrLoading && (
                      <>
                        <Loader size={12} className="animate-spin text-teal-500 shrink-0" />
                        <span className="text-xs text-gray-500 truncate">Reading receipt…</span>
                      </>
                    )}
                    {ocrSuccess && !ocrLoading && (
                      <>
                        <CheckCircle size={12} className="text-teal-500 shrink-0" />
                        <span className="text-xs text-teal-600 truncate">Fields filled — review and save</span>
                      </>
                    )}
                    {ocrError && !ocrLoading && (
                      <span className="text-xs text-red-500 truncate">{ocrError}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearScan}
                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer py-1 px-2 -mr-1 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Monthly rent"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving || ocrLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader size={14} className="animate-spin" /> Saving…</> : "Add Expense"}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div className={canManageExpenses ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 m-0">All Expenses</h3>
            </div>
            {expenses.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm m-0">No expenses recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <div key={exp.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm m-0 truncate">{exp.description}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{exp.date}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded">{exp.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-semibold text-red-500">-{currency}{Number(exp.amount).toFixed(2)}</span>
                      {canDeleteTransactions && (
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          aria-label={`Delete expense: ${exp.description}`}
                          className="text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Expense"
          message={`Delete "${deleteTarget.description}" (${currency}${Number(deleteTarget.amount).toFixed(2)})? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { deleteExpense(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
