import { Link } from "react-router-dom";
import { useState, useEffect, useMemo, memo } from "react";
import {
  TrendingUp,
  ArrowLeftRight,
  FileText,
  Plus,
  Zap,
  Eye,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("dwatrack_token"); }

const StatCard = memo(function StatCard({ title, value, sub, subColor, icon: Icon, iconBg }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-2">{title}</p>
        <p className="text-2xl font-bold text-gray-900 m-0 mb-1">{value}</p>
        <p className={`text-xs font-medium m-0 ${subColor || "text-gray-400"}`}>{sub}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  );
});

function WeeklyBarChart({ data, currency }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const weekTotal = data.reduce((s, d) => s + d.total, 0);
  const activeDays = data.filter((d) => d.total > 0).length;

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center justify-between mt-1 mb-4">
        <div>
          <p className="text-xl font-bold text-gray-900 m-0">{currency}{weekTotal.toFixed(2)}</p>
          <p className="text-xs text-gray-400 m-0">{activeDays} day{activeDays !== 1 ? "s" : ""} with sales</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">This week</span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5" style={{ height: 140 }}>
        {data.map((d) => {
          const heightPct = d.total > 0 ? Math.max((d.total / max) * 85, 8) : 0;
          const isEmpty = d.total === 0;
          return (
            <div key={d.day} className="flex flex-col items-center flex-1 gap-1 h-full justify-end group relative">
              {/* Tooltip on hover */}
              {!isEmpty && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {currency}{d.total.toFixed(2)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Amount label above bar */}
              {!isEmpty && (
                <p className="text-[9px] font-semibold text-teal-600 m-0 leading-none mb-0.5 truncate max-w-full px-0.5 text-center">
                  {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total.toFixed(0)}
                </p>
              )}

              {/* Bar */}
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  isEmpty
                    ? "bg-gray-100"
                    : d.isToday
                    ? "bg-teal-500 shadow-sm shadow-teal-200"
                    : "bg-teal-200 group-hover:bg-teal-300"
                }`}
                style={{ height: isEmpty ? 4 : `${heightPct}%` }}
              />

              {/* Day label */}
              <p className={`text-[11px] font-medium m-0 mt-1 ${d.isToday ? "text-teal-600" : "text-gray-400"}`}>
                {d.day}
              </p>
              {d.isToday && <div className="w-1 h-1 bg-teal-500 rounded-full -mt-0.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AISummaryBanner() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/daily-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSummary(data.summary || null);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (!loading && !summary) return null;

  return (
    <div className="bg-linear-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4 mb-6 flex gap-3">
      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-teal-700 m-0 uppercase tracking-wide">AI Daily Insight</p>
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto p-1 text-teal-400 hover:text-teal-600 border-none bg-transparent cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-teal-600 text-xs">
            <div className="w-3 h-3 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
            Generating your daily insight…
          </div>
        ) : (
          <p className="text-sm text-teal-800 m-0 leading-relaxed line-clamp-3">{summary}</p>
        )}
        <Link to="/dashboard/ai" className="text-xs text-teal-600 font-medium no-underline hover:text-teal-800 mt-1.5 inline-block">
          Open AI Assistant →
        </Link>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const { transactions, getWeeklyData } = useApp();
  const { canAddTransactions, currency } = useAuth();

  const todayStr = new Date().toDateString();

  const todayTx = useMemo(
    () => transactions.filter((t) => new Date(t.createdAt).toDateString() === todayStr),
    [transactions, todayStr]
  );
  const todaySales = useMemo(
    () => todayTx.reduce((s, t) => s + ((t.total || 0) - (t.taxAmount || 0)), 0),
    [todayTx]
  );
  const totalTx  = transactions.length;
  const pending  = useMemo(
    () => transactions.filter((t) => t.status === "pending").length,
    [transactions]
  );
  const weeklyData = useMemo(() => getWeeklyData(), [transactions]);
  const bestDay    = useMemo(
    () => [...weeklyData].sort((a, b) => b.total - a.total)[0],
    [weeklyData]
  );
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);


  return (
    <div className="max-w-6xl mx-auto">
      <AISummaryBanner />
      {/* Action buttons */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 m-0">Overview</h2>
          <p className="text-sm text-gray-500 m-0">Track your business health and record new activity.</p>
        </div>
        {canAddTransactions && (
          <div className="flex gap-3">
            <Link
              to="/dashboard/transactions"
              state={{ openAdd: true }}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg no-underline transition-colors"
            >
              <Plus size={16} /> Record New Sale
            </Link>
            <Link
              to="/dashboard/transactions"
              state={{ openAdd: true }}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg no-underline transition-colors"
            >
              <Zap size={16} /> Quick Entry
            </Link>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Today's Sales"
          value={`${currency}${todaySales.toFixed(2)}`}
          sub={todayTx.length > 0 ? `${todayTx.length} transaction(s) today` : "No sales yet today"}
          subColor="text-teal-600"
          icon={TrendingUp}
          iconBg="bg-teal-500"
        />
        <StatCard
          title="Total Transactions"
          value={totalTx}
          sub={totalTx > 0 ? "All time" : "No transactions yet"}
          subColor="text-blue-500"
          icon={ArrowLeftRight}
          iconBg="bg-blue-400"
        />
        <StatCard
          title="Pending Receipts"
          value={pending}
          sub={pending > 0 ? "Needs attention" : "All clear"}
          subColor={pending > 0 ? "text-amber-500" : "text-green-500"}
          icon={FileText}
          iconBg={pending > 0 ? "bg-amber-400" : "bg-gray-300"}
        />
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly trend */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0">Weekly Sales</h3>
          <WeeklyBarChart data={weeklyData} currency={currency} />
          {bestDay && bestDay.total > 0 && (
            <p className="text-xs text-gray-500 mt-3 m-0 pt-3 border-t border-gray-50">
              Best day: <span className="text-teal-600 font-semibold">{bestDay.day}</span>
              {" — "}{currency}{bestDay.total.toFixed(2)}
            </p>
          )}
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 m-0">Recent Transactions</h3>
            <Link to="/dashboard/transactions" className="text-sm font-medium text-teal-500 no-underline hover:text-teal-700">
              View All
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm m-0">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left pb-2 font-medium">Customer / Item</th>
                    <th className="text-left pb-2 font-medium">Time</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-800 m-0">
                          {tx.items?.[0]?.productName || tx.customer || "Sale"}
                        </p>
                        <p className="text-xs text-gray-400 m-0">{tx.customer || "Walk-in Customer"}</p>
                      </td>
                      <td className="py-2.5 text-gray-500">{tx.time}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">
                        {currency}{(tx.total || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to="/dashboard/transactions"
                          state={{ viewId: tx.id }}
                          className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg no-underline transition-colors"
                        >
                          <Eye size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
