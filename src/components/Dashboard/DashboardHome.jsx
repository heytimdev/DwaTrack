import { Link } from "react-router-dom";
import {
  TrendingUp,
  ArrowLeftRight,
  FileText,
  Plus,
  Zap,
  Eye,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

function StatCard({ title, value, sub, subColor, icon: Icon, iconBg }) {
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
}

function SimpleBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d) => {
        const height = Math.max((d.total / max) * 100, 4);
        return (
          <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${d.isToday ? "bg-teal-500" : "bg-teal-200"}`}
              style={{ height: `${height}%` }}
            />
            <span className="text-xs text-gray-400">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardHome() {
  const { transactions, getWeeklyData } = useApp();
  const { currentUser, canAddTransactions } = useAuth();

  const todayStr = new Date().toDateString();
  const todayTx = transactions.filter((t) => {
    const d = new Date(parseInt(t.id));
    return d.toDateString() === todayStr;
  });
  const todaySales = todayTx.reduce((s, t) => s + (t.total || 0), 0);
  const totalTx = transactions.length;
  const pending = transactions.filter((t) => t.status === "pending").length;
  const weeklyData = getWeeklyData();
  const bestDay = [...weeklyData].sort((a, b) => b.total - a.total)[0];
  const recent = transactions.slice(0, 5);

  const currency = "GH₵";

  return (
    <div className="max-w-6xl mx-auto">
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
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-800 m-0">Weekly Trend</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Current Week</span>
          </div>
          <SimpleBarChart data={weeklyData} />
          {bestDay && bestDay.total > 0 && (
            <p className="text-xs text-gray-500 mt-3 m-0">
              Your best selling day this week was{" "}
              <span className="text-teal-600 font-semibold">{bestDay.day}</span>.
              Consider stocking up on essentials before this day.
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
