import { useApp } from "../../context/AppContext";

export function Reports() {
  const { transactions, expenses } = useApp();
  const currency = "GH₵";

  const totalRevenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Revenue by month
  const byMonth = {};
  transactions.forEach((tx) => {
    const d = new Date(parseInt(tx.id));
    const key = d.toLocaleDateString("en-GH", { month: "short", year: "numeric" });
    byMonth[key] = (byMonth[key] || 0) + (tx.total || 0);
  });

  const monthlyData = Object.entries(byMonth).slice(-6);
  const maxMonthly = Math.max(...monthlyData.map(([, v]) => v), 1);

  // Expenses by category
  const expByCategory = {};
  expenses.forEach((e) => {
    expByCategory[e.category] = (expByCategory[e.category] || 0) + (parseFloat(e.amount) || 0);
  });
  const expCatData = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]);

  // Payment method breakdown
  const byPayment = {};
  transactions.forEach((tx) => {
    const m = tx.paymentMethod || "cash";
    byPayment[m] = (byPayment[m] || 0) + (tx.total || 0);
  });
  const paymentData = Object.entries(byPayment).sort((a, b) => b[1] - a[1]);

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
    </div>
  );
}
