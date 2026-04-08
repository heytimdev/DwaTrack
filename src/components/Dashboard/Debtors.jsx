import { useState, useEffect, useCallback } from "react";
import {
  Users, ChevronDown, ChevronUp, Phone, CreditCard,
  CheckCircle, Clock, AlertCircle, X, Loader,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function daysSince(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function urgencyColor(days) {
  if (days >= 30) return "text-red-600";
  if (days >= 14) return "text-amber-600";
  return "text-gray-500";
}

function urgencyBadge(days) {
  if (days >= 30) return { label: "Overdue", cls: "bg-red-100 text-red-700" };
  if (days >= 14) return { label: "2+ weeks", cls: "bg-amber-100 text-amber-700" };
  return { label: "Recent", cls: "bg-green-100 text-green-700" };
}

// ── Record Payment Modal ──────────────────────────────────────────────────────
function PaymentModal({ tx, currency, onClose, onPaid }) {
  const { recordDebtPayment } = useApp();
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (amt > tx.outstanding + 0.001) {
      setError(`Cannot exceed outstanding balance of ${currency}${tx.outstanding.toFixed(2)}.`);
      return;
    }
    setSaving(true);
    try {
      const result = await recordDebtPayment(tx.id, amt, note);
      onPaid(result);
    } catch {
      setError("Failed to record payment. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0">Record Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Receipt</span>
              <span className="font-medium">{tx.receiptNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total</span>
              <span>{currency}{tx.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-red-600">
              <span>Still owed</span>
              <span>{currency}{tx.outstanding.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg m-0">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Amount being paid ({currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={tx.outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max ${currency}${tx.outstanding.toFixed(2)}`}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Cash, MoMo ref: 12345"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          </div>

          <div className="flex gap-2 pt-1">
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
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader size={14} className="animate-spin" /> Saving…</>
              ) : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Customer Debt Detail Panel ─────────────────────────────────────────────────
function CustomerPanel({ debtor, currency, onClose, onPaymentRecorded }) {
  const { fetchCustomerDebts } = useApp();
  const [txList,   setTxList]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payingTx, setPayingTx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerDebts(debtor.customerId);
      setTxList(data);
    } finally {
      setLoading(false);
    }
  }, [debtor.customerId, fetchCustomerDebts]);

  useEffect(() => { load(); }, [load]);

  function handlePaid(result) {
    setPayingTx(null);
    // Refresh the list; remove tx if now fully paid
    setTxList((prev) =>
      prev
        .map((t) =>
          t.id === result.transactionId
            ? { ...t, outstanding: result.outstanding, paymentsMade: t.paymentsMade + result.amount,
                payments: [...t.payments, { id: result.id, amount: result.amount, note: result.note, createdAt: result.createdAt }] }
            : t
        )
        .filter((t) => t.outstanding > 0.001)
    );
    onPaymentRecorded();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-40 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 m-0">{debtor.name}</h2>
            {debtor.phone && (
              <a href={`tel:${debtor.phone}`} className="text-xs text-teal-600 flex items-center gap-1 mt-0.5 no-underline">
                <Phone size={12} /> {debtor.phone}
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-3 bg-red-50 border-b border-red-100 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-700 font-medium">Total outstanding</span>
            <span className="text-xl font-bold text-red-700">
              {currency}{debtor.totalOutstanding.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-red-500 m-0 mt-0.5">{debtor.openDebts} open debt{debtor.openDebts !== 1 ? "s" : ""}</p>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size={24} className="animate-spin text-teal-500" />
            </div>
          ) : txList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">All debts cleared.</p>
          ) : (
            txList.map((tx) => {
              const age = daysSince(tx.createdAt);
              const badge = urgencyBadge(age);
              return (
                <div key={tx.id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 m-0">{tx.receiptNumber}</p>
                      <p className="text-xs text-gray-400 m-0">{fmtDate(tx.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Total sale</span>
                      <span>{currency}{tx.total.toFixed(2)}</span>
                    </div>
                    {tx.amountPaid > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid at sale</span>
                        <span>{currency}{tx.amountPaid.toFixed(2)}</span>
                      </div>
                    )}
                    {tx.paymentsMade > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Subsequent payments</span>
                        <span>{currency}{tx.paymentsMade.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-red-600 pt-1 border-t border-gray-100">
                      <span>Still owed</span>
                      <span>{currency}{tx.outstanding.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment history */}
                  {tx.payments.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {tx.payments.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-gray-400">
                          <CheckCircle size={11} className="text-green-500 shrink-0" />
                          <span>{fmtDate(p.createdAt)} — {currency}{p.amount.toFixed(2)}</span>
                          {p.note && <span className="text-gray-300">· {p.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setPayingTx(tx)}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold py-2 rounded-lg border-none cursor-pointer transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {payingTx && (
        <PaymentModal
          tx={payingTx}
          currency={currency}
          onClose={() => setPayingTx(null)}
          onPaid={handlePaid}
        />
      )}
    </>
  );
}

// ── Main Debtors Page ─────────────────────────────────────────────────────────
export function Debtors() {
  const { fetchDebtors } = useApp();
  const { currency, canManageDebtors } = useAuth();

  const [debtors,       setDebtors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [search,        setSearch]        = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDebtors();
      setDebtors(data);
    } finally {
      setLoading(false);
    }
  }, [fetchDebtors]);

  useEffect(() => { load(); }, [load]);

  if (!canManageDebtors) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <AlertCircle size={36} />
        <p className="text-sm">You don't have permission to view the debtors book.</p>
      </div>
    );
  }

  const filtered = debtors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone || "").includes(search)
  );

  const totalOutstanding = debtors.reduce((s, d) => s + d.totalOutstanding, 0);
  const overdueCount     = debtors.filter((d) => daysSince(d.lastActivity) >= 30).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 m-0">Debtors Book</h1>
        <p className="text-sm text-gray-400 mt-1 m-0">Track credit sales and collect outstanding balances.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Total Outstanding</p>
          <p className="text-xl font-bold text-red-600 m-0">{currency}{totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Debtors</p>
          <p className="text-xl font-bold text-gray-900 m-0">{debtors.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Overdue (30d+)</p>
          <p className={`text-xl font-bold m-0 ${overdueCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={28} className="animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-3">
          <Users size={40} />
          <p className="text-sm text-gray-400">
            {search ? "No debtors match your search." : "No outstanding debts. All clear!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((debtor) => {
            const age   = daysSince(debtor.lastActivity);
            const badge = urgencyBadge(age);
            return (
              <button
                key={debtor.customerId}
                onClick={() => setSelectedDebtor(debtor)}
                className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:border-teal-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 m-0">{debtor.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    {debtor.phone && (
                      <p className="text-xs text-gray-400 m-0 mt-0.5 flex items-center gap-1">
                        <Phone size={11} /> {debtor.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CreditCard size={12} />
                        {debtor.openDebts} open debt{debtor.openDebts !== 1 ? "s" : ""}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${urgencyColor(age)}`}>
                        <Clock size={12} />
                        {age === 0 ? "Today" : `${age}d ago`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-red-600 m-0">{currency}{debtor.totalOutstanding.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 m-0">owed</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Customer detail panel */}
      {selectedDebtor && (
        <CustomerPanel
          debtor={selectedDebtor}
          currency={currency}
          onClose={() => setSelectedDebtor(null)}
          onPaymentRecorded={() => {
            load(); // refresh main list
            // If all debts cleared, close panel
          }}
        />
      )}
    </div>
  );
}
