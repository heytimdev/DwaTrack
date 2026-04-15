import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export function Reports() {
  const { transactions, expenses } = useApp();
  const { currency } = useAuth();

  const totalRevenue = useMemo(
    () => transactions.reduce((s, t) => s + ((t.total || 0) - (t.taxAmount || 0)), 0),
    [transactions]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [expenses]
  );
  const netProfit = totalRevenue - totalExpenses;

  const { monthlyData, maxMonthly } = useMemo(() => {
    const byMonth = {};
    transactions.forEach((tx) => {
      const key = new Date(tx.createdAt).toLocaleDateString("en-GH", { month: "short", year: "numeric" });
      byMonth[key] = (byMonth[key] || 0) + ((tx.total || 0) - (tx.taxAmount || 0));
    });
    const data = Object.entries(byMonth)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-6);
    return { monthlyData: data, maxMonthly: Math.max(...data.map(([, v]) => v), 1) };
  }, [transactions]);

  const expCatData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (parseFloat(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const paymentData = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const m = tx.paymentMethod || "cash";
      map[m] = (map[m] || 0) + (tx.total || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  // ── Calendar heatmap: current month ──────────────────────────────────────────
  const { heatmapWeeks, heatmapMax } = useMemo(() => {
    const byDay = {};
    transactions.forEach((tx) => {
      if (tx.status === "voided") return;
      const key = new Date(tx.createdAt).toDateString();
      byDay[key] = (byDay[key] || 0) + ((tx.total || 0) - (tx.taxAmount || 0));
    });

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start grid from Monday on or before the 1st
    const startOffset = (firstDay.getDay() + 6) % 7; // 0=Mon
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);

    // End grid on Sunday on or after the last day
    const endOffset = (6 - ((lastDay.getDay() + 6) % 7));
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(lastDay.getDate() + endOffset);

    const weeks = [];
    let maxVal = 0;
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const inMonth = date.getMonth() === month;
        const total = inMonth ? (byDay[date.toDateString()] || 0) : null;
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
    if (!total)    return "bg-gray-100";
    const pct = total / max;
    if (pct < 0.25) return "bg-teal-200";
    if (pct < 0.5)  return "bg-teal-400";
    if (pct < 0.75) return "bg-teal-600";
    return "bg-teal-800";
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800 m-0">Reports</h2>
        <p className="text-sm text-gray-500 m-0">Financial summary and business performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-teal-600 m-0">{currency}{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 m-0 mt-1">{transactions.length} transactions</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500 m-0">{currency}{totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-400 m-0 mt-1">{expenses.length} records</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Net Profit</p>
          <p className={`text-2xl font-bold m-0 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netProfit >= 0 ? "+" : ""}{currency}{netProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 m-0 mt-1">Revenue - Expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly revenue chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Monthly Revenue</h3>
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
          {paymentData.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {paymentData.map(([method, total]) => (
                <div key={method} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 capitalize m-0 mb-1">{method}</p>
                  <p className="text-lg font-bold text-gray-900 m-0">{currency}{total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 m-0">
                    {((total / totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sales Calendar Heatmap ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 m-0">Sales Activity</h3>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              {new Date().toLocaleDateString("en-GH", { month: "long", year: "numeric" })}
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-400">Low</span>
            {["bg-gray-100", "bg-teal-200", "bg-teal-400", "bg-teal-600", "bg-teal-800"].map((c) => (
              <div key={c} className={`w-4 h-4 rounded ${c}`} />
            ))}
            <span className="text-xs text-gray-400">High</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400">No sales data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-2">
              {/* Day-of-week labels */}
              <div className="flex flex-col gap-2 pt-0.5 shrink-0">
                {DAY_LABELS.map((label, di) => (
                  <div key={label} className="h-9 flex items-center">
                    <span className="text-xs text-gray-400 w-8 text-right pr-1">
                      {di % 2 === 0 ? label : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-2">
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-2">
                    {week.map((cell, di) => {
                      if (!cell.inMonth) {
                        return <div key={di} className="w-9 h-9" />;
                      }

                      const isToday = cell.date.toDateString() === new Date().toDateString();
                      const tipLabel = cell.isFuture
                        ? cell.date.toLocaleDateString("en-GH", { weekday: "short", day: "numeric" })
                        : `${cell.date.toLocaleDateString("en-GH", { weekday: "short", day: "numeric" })}: ${currency}${cell.total.toFixed(2)}`;

                      return (
                        <div
                          key={di}
                          title={tipLabel}
                          className={`w-9 h-9 rounded-lg cursor-default flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-md ${heatColor(cell.total, heatmapMax, cell.isFuture)} ${isToday ? "ring-2 ring-teal-500 ring-offset-1" : ""}`}
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
