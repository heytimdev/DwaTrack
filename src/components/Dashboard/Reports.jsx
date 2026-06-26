import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

const PERIOD_LABELS = { week: "This Week", month: "This Month", all: "All Time" };

export function Reports() {
  const { transactions, expenses } = useApp();
  const { currency } = useAuth();
  const [period, setPeriod] = useState("month");

  // ── Period-filtered slices (summary cards) ────────────────────────────────────
  const { filteredTx, filteredExp } = useMemo(() => {
    const now = new Date();

    function inPeriod(dateVal) {
      if (period === "all") return true;
      const d = new Date(dateVal);
      if (period === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    return {
      filteredTx:  transactions.filter((tx)  => tx.status !== "voided" && inPeriod(tx.createdAt)),
      filteredExp: expenses.filter((exp) => inPeriod(exp.createdAt || exp.date)),
    };
  }, [transactions, expenses, period]);

  const totalRevenue  = useMemo(
    () => filteredTx.reduce((s, t) => s + ((t.total || 0) - (t.taxAmount || 0)), 0),
    [filteredTx]
  );
  const totalExpenses = useMemo(
    () => filteredExp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [filteredExp]
  );
  const netProfit    = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;

  // ── Monthly revenue chart (all-time, voided excluded, reliable sort key) ──────
  const { monthlyData, maxMonthly } = useMemo(() => {
    const byMonth = {};
    transactions.forEach((tx) => {
      if (tx.status === "voided") return;
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + ((tx.total || 0) - (tx.taxAmount || 0));
    });
    const data = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, total]) => {
        const [y, m] = key.split("-");
        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-GH", {
          month: "short", year: "numeric",
        });
        return [label, total];
      });
    return { monthlyData: data, maxMonthly: Math.max(...data.map(([, v]) => v), 1) };
  }, [transactions]);

  // ── Expenses by category (all-time) ───────────────────────────────────────────
  const expCatData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (parseFloat(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // ── Payment methods (all-time, voided excluded, consistent tax basis) ─────────
  const { paymentEntries, paymentGross } = useMemo(() => {
    const map = {};
    let gross = 0;
    transactions.forEach((tx) => {
      if (tx.status === "voided") return;
      const rev = (tx.total || 0) - (tx.taxAmount || 0);
      const m = tx.paymentMethod || "cash";
      map[m] = (map[m] || 0) + rev;
      gross += rev;
    });
    return {
      paymentEntries: Object.entries(map).sort((a, b) => b[1] - a[1]),
      paymentGross: gross,
    };
  }, [transactions]);

  // ── Calendar heatmap (current month, voided excluded) ────────────────────────
  const { heatmapWeeks, heatmapMax } = useMemo(() => {
    const byDay = {};
    transactions.forEach((tx) => {
      if (tx.status === "voided") return;
      const key = new Date(tx.createdAt).toDateString();
      byDay[key] = (byDay[key] || 0) + ((tx.total || 0) - (tx.taxAmount || 0));
    });

    const today    = new Date();
    const year     = today.getFullYear();
    const month    = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart   = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);

    const endOffset = 6 - ((lastDay.getDay() + 6) % 7);
    const gridEnd   = new Date(lastDay);
    gridEnd.setDate(lastDay.getDate() + endOffset);

    const weeks = [];
    let maxVal = 0;
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date    = new Date(cursor);
        const inMonth = date.getMonth() === month;
        const total   = inMonth ? (byDay[date.toDateString()] || 0) : null;
        if (total !== null && total > maxVal) maxVal = total;
        days.push({ date, total, isFuture: date > today, inMonth });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(days);
    }

    return { heatmapWeeks: weeks, heatmapMax: maxVal };
  }, [transactions]);

  function heatColor(total, max, isFuture) {
    if (isFuture) return "bg-gray-50 border border-dashed border-gray-200";
    if (!total)   return "bg-gray-100";
    const pct = total / max;
    if (pct < 0.25) return "bg-teal-200";
    if (pct < 0.5)  return "bg-teal-400";
    if (pct < 0.75) return "bg-teal-600";
    return "bg-teal-800";
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header + period selector */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 m-0">Reports</h2>
          <p className="text-sm text-gray-500 m-0">Financial summary and business performance.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {["week", "month", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer transition-colors
                ${period === p ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards — 4 across */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-teal-600 m-0">{currency}{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 m-0 mt-1">{filteredTx.length} transactions</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Expenses</p>
          <p className="text-2xl font-bold text-red-500 m-0">{currency}{totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-400 m-0 mt-1">{filteredExp.length} records</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Net Profit</p>
          <p className={`text-2xl font-bold m-0 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netProfit >= 0 ? "+" : "−"}{currency}{Math.abs(netProfit).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 m-0 mt-1">Revenue − Expenses</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Profit Margin</p>
          <p className={`text-2xl font-bold m-0 ${
            profitMargin === null ? "text-gray-400"
            : profitMargin >= 20  ? "text-green-600"
            : profitMargin >= 0   ? "text-amber-500"
            : "text-red-600"
          }`}>
            {profitMargin === null ? "—" : `${profitMargin.toFixed(1)}%`}
          </p>
          <p className="text-xs text-gray-400 m-0 mt-1">Net ÷ Revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly revenue chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Monthly Revenue (Last 6 Months)</h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map(([month, total]) => (
                <div key={month}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{month}</span>
                    <span className="font-medium">{currency}{total.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${(total / maxMonthly) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses by category */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Expenses by Category</h3>
          {expCatData.length === 0 ? (
            <p className="text-sm text-gray-400">No expense data yet.</p>
          ) : (
            <div className="space-y-3">
              {expCatData.map(([cat, total]) => {
                const maxExp = expCatData[0][1];
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{cat}</span>
                      <span className="font-medium text-red-500">{currency}{total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(total / maxExp) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Revenue by Payment Method</h3>
          {paymentEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {paymentEntries.map(([method, total]) => (
                <div key={method} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 capitalize m-0 mb-1">{method}</p>
                  <p className="text-lg font-bold text-gray-900 m-0">{currency}{total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 m-0">
                    {paymentGross > 0 ? ((total / paymentGross) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales calendar heatmap */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 m-0">Sales Activity</h3>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              {new Date().toLocaleDateString("en-GH", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-400">Low</span>
            {["bg-gray-100", "bg-teal-200", "bg-teal-400", "bg-teal-600", "bg-teal-800"].map((c) => (
              <div key={c} className={`w-4 h-4 rounded ${c}`} />
            ))}
            <span className="text-xs text-gray-400">High</span>
          </div>
        </div>

        {transactions.filter(t => t.status !== "voided").length === 0 ? (
          <p className="text-sm text-gray-400">No sales data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-2">
              <div className="flex flex-col gap-2 pt-0.5 shrink-0">
                {DAY_LABELS.map((label, di) => (
                  <div key={label} className="h-9 flex items-center">
                    <span className="text-xs text-gray-400 w-8 text-right pr-1">
                      {di % 2 === 0 ? label : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-2">
                    {week.map((cell, di) => {
                      if (!cell.inMonth) return <div key={di} className="w-9 h-9" />;
                      const isToday = cell.date.toDateString() === new Date().toDateString();
                      const tipLabel = cell.isFuture
                        ? cell.date.toLocaleDateString("en-GH", { weekday: "short", day: "numeric" })
                        : `${cell.date.toLocaleDateString("en-GH", { weekday: "short", day: "numeric" })}: ${currency}${(cell.total || 0).toFixed(2)}`;
                      return (
                        <div
                          key={di}
                          title={tipLabel}
                          className={`w-9 h-9 rounded-lg cursor-default flex items-center justify-center transition-all hover:scale-110 hover:shadow-md
                            ${heatColor(cell.total, heatmapMax, cell.isFuture)}
                            ${isToday ? "ring-2 ring-teal-500 ring-offset-1" : ""}`}
                        >
                          <span className={`text-xs font-semibold leading-none ${cell.total > 0 && !cell.isFuture ? "text-white" : "text-gray-400"}`}>
                            {cell.date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
