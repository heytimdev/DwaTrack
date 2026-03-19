import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useApp } from "../../context/AppContext";

function BarChart({ data, valueKey, nameKey, color = "bg-teal-500", currency = "GH₵" }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="truncate max-w-[60%]">{item[nameKey]}</span>
            <span className="font-medium ml-2 flex-shrink-0">
              {typeof item[valueKey] === "number" && valueKey === "revenue"
                ? `${currency}${item[valueKey].toFixed(2)}`
                : item[valueKey]}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Analysis() {
  const { transactions, products, getProductSalesData } = useApp();
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const currency = "GH₵";

  const productSales = getProductSalesData();

  // Build comparison data
  function getProductStats(productName) {
    if (!productName) return null;
    return productSales.find((p) => p.name === productName) || { name: productName, qty: 0, revenue: 0 };
  }

  const statsA = getProductStats(compareA);
  const statsB = getProductStats(compareB);

  function getTrend(a, b, key) {
    if (!a || !b || b[key] === 0) return null;
    const diff = ((a[key] - b[key]) / b[key]) * 100;
    return diff;
  }

  const revenueTrend = getTrend(statsA, statsB, "revenue");
  const qtyTrend = getTrend(statsA, statsB, "qty");

  // Build daily trend data for selected products
  const dailyMap = {};
  transactions.forEach((tx) => {
    const d = new Date(parseInt(tx.id));
    const dateStr = d.toLocaleDateString("en-GH", { month: "short", day: "numeric" });
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr };
    (tx.items || []).forEach((item) => {
      if (!dailyMap[dateStr][item.productName]) dailyMap[dateStr][item.productName] = 0;
      dailyMap[dateStr][item.productName] += item.qty * item.price;
    });
  });

  const allProductNames = [...new Set(transactions.flatMap((tx) => tx.items?.map((i) => i.productName) || []))];

  // All products revenue for the bar chart
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800 m-0">Analysis</h2>
        <p className="text-sm text-gray-500 m-0">Compare product performance and identify trends.</p>
      </div>

      {/* Product comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Product Comparison</h3>

        {allProductNames.length < 2 ? (
          <p className="text-sm text-gray-400 m-0">
            Add at least 2 different products to transactions to compare them here.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product A</label>
                <select
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">Select product</option>
                  {allProductNames.filter((n) => n !== compareB).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product B</label>
                <select
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white"
                >
                  <option value="">Select product</option>
                  {allProductNames.filter((n) => n !== compareA).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {statsA && statsB && compareA && compareB && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Revenue comparison */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide m-0 mb-3">Revenue</p>
                  <div className="space-y-3">
                    {[statsA, statsB].map((s, i) => {
                      const maxRev = Math.max(statsA.revenue, statsB.revenue, 1);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{s.name}</span>
                            <span className="text-teal-600 font-semibold">{currency}{s.revenue.toFixed(2)}</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? "bg-teal-500" : "bg-blue-400"}`}
                              style={{ width: `${(s.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {revenueTrend !== null && (
                    <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${revenueTrend > 0 ? "text-teal-600" : revenueTrend < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {revenueTrend > 0 ? <TrendingUp size={14} /> : revenueTrend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {compareA} earns {Math.abs(revenueTrend).toFixed(1)}% {revenueTrend > 0 ? "more" : "less"} than {compareB}
                    </div>
                  )}
                </div>

                {/* Units sold comparison */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide m-0 mb-3">Units Sold</p>
                  <div className="space-y-3">
                    {[statsA, statsB].map((s, i) => {
                      const maxQty = Math.max(statsA.qty, statsB.qty, 1);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{s.name}</span>
                            <span className="font-semibold text-gray-800">{s.qty} units</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? "bg-teal-500" : "bg-blue-400"}`}
                              style={{ width: `${(s.qty / maxQty) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {qtyTrend !== null && (
                    <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${qtyTrend > 0 ? "text-teal-600" : qtyTrend < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {qtyTrend > 0 ? <TrendingUp size={14} /> : qtyTrend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {compareA} sells {Math.abs(qtyTrend).toFixed(1)}% {qtyTrend > 0 ? "more" : "fewer"} units than {compareB}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top products by revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Top Products by Revenue</h3>
          {productSales.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet.</p>
          ) : (
            <BarChart data={productSales} valueKey="revenue" nameKey="name" color="bg-teal-500" currency={currency} />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 m-0 mb-4">Top Products by Units Sold</h3>
          {productSales.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet.</p>
          ) : (
            <BarChart
              data={[...productSales].sort((a, b) => b.qty - a.qty)}
              valueKey="qty"
              nameKey="name"
              color="bg-blue-400"
              currency={currency}
            />
          )}
        </div>
      </div>
    </div>
  );
}
