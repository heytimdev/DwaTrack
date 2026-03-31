import { useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Inventory", "Transport", "Marketing", "Equipment", "Other"];

export function Expenses() {
  const { expenses, addExpense, deleteExpense } = useApp();
  const { canManageExpenses, canDeleteTransactions, currency } = useAuth();

  const [form, setForm] = useState({ description: "", amount: "", category: "Other" });
  const [error, setError] = useState("");

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.description || !form.amount) {
      setError("Description and amount are required.");
      return;
    }
    addExpense({ description: form.description, amount: parseFloat(form.amount), category: form.category });
    setForm({ description: "", amount: "", category: "Other" });
    setError("");
  }


  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800 m-0">Expenses</h2>
        <p className="text-sm text-gray-500 m-0">Track your business costs and outgoings.</p>
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
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
              >
                Add Expense
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
                          onClick={() => deleteExpense(exp.id)}
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
    </div>
  );
}
