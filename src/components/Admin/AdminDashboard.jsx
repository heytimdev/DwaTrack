import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, ShoppingCart, TrendingUp, LogOut, ArrowLeft,
  ChevronRight, AlertCircle, CheckCircle2, Bell, BarChart2,
  AlertTriangle, Package, Ban, RotateCcw, UserPlus,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('dwatrack_admin_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function fmt(currency, amount) {
  return `${currency || 'GH₵'}${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function timeAgo(date) {
  if (!date) return 'No activity';
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── Simple bar chart ──────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = 'bg-teal-500', prefix = '' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-gray-400 text-xs w-16 shrink-0 text-right">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
            <div
              className={`${color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max((d[valueKey] / max) * 100, 2)}%` }}
            >
              <span className="text-white text-xs font-medium">
                {prefix}{typeof d[valueKey] === 'number' && d[valueKey] > 999
                  ? `${(d[valueKey]/1000).toFixed(1)}k`
                  : d[valueKey]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white font-bold text-xl">{value}</p>
      </div>
    </div>
  );
}

// ── Business list ─────────────────────────────────────────────────────────────
function BusinessList({ businesses, onSelect }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = businesses.filter(b => {
    const matchSearch =
      b.businessName.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search businesses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500 w-64"
        />
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {['all', 'active', 'suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 font-medium px-5 py-3">Business</th>
              <th className="text-left text-gray-400 font-medium px-5 py-3">Owner</th>
              <th className="text-left text-gray-400 font-medium px-5 py-3">Country</th>
              <th className="text-right text-gray-400 font-medium px-5 py-3">Revenue</th>
              <th className="text-right text-gray-400 font-medium px-5 py-3">Sales</th>
              <th className="text-right text-gray-400 font-medium px-5 py-3">Team</th>
              <th className="text-left text-gray-400 font-medium px-5 py-3">Last Active</th>
              <th className="text-left text-gray-400 font-medium px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} onClick={() => onSelect(b.id)}
                className={`border-b border-gray-800/50 hover:bg-gray-800/60 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                      {b.businessName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{b.businessName}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-300">{b.ownerName}</td>
                <td className="px-5 py-3.5 text-gray-400">{b.country}</td>
                <td className="px-5 py-3.5 text-right text-teal-400 font-medium">{fmt(b.currency, b.totalRevenue)}</td>
                <td className="px-5 py-3.5 text-right text-gray-300">{b.transactionCount}</td>
                <td className="px-5 py-3.5 text-right text-gray-300">{b.teamCount}</td>
                <td className="px-5 py-3.5 text-gray-400">{timeAgo(b.lastTransactionAt)}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-gray-600" /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500">No businesses found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Insights panel ────────────────────────────────────────────────────────────
function InsightsPanel() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/admin/insights`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data)   return <div className="text-gray-400 py-10 text-center">Failed to load insights.</div>;

  return (
    <div className="space-y-6">
      {/* Two charts side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" /> New Signups — Last 6 Months
          </h3>
          {data.signupsByMonth.length > 0
            ? <BarChart data={data.signupsByMonth} valueKey="count" labelKey="month" color="bg-teal-500" />
            : <p className="text-gray-500 text-sm">No signup data yet.</p>
          }
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Platform Revenue — Last 6 Months
          </h3>
          {data.revenueByMonth.length > 0
            ? <BarChart data={data.revenueByMonth} valueKey="revenue" labelKey="month" color="bg-emerald-500" prefix="₵" />
            : <p className="text-gray-500 text-sm">No revenue data yet.</p>
          }
        </div>
      </div>

      {/* Top 5 by revenue */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" /> Top 5 Businesses by Revenue
        </h3>
        {data.topByRevenue.length > 0 ? (
          <div className="space-y-3">
            {data.topByRevenue.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-700'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{b.businessName}</p>
                  <p className="text-gray-500 text-xs">{b.ownerName} · {b.txCount} sales</p>
                </div>
                <span className="text-teal-400 font-bold text-sm">{fmt(b.currency, b.totalRevenue)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-sm">No revenue data yet.</p>}
      </div>

      {/* Dormant accounts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" /> Dormant Accounts
          <span className="text-xs text-gray-500 font-normal ml-1">No activity in 30+ days</span>
        </h3>
        {data.dormantBusinesses.length > 0 ? (
          <div className="mt-3 space-y-2">
            {data.dormantBusinesses.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm">{b.businessName}</p>
                  <p className="text-gray-500 text-xs">{b.ownerName}</p>
                </div>
                <span className="text-amber-400 text-xs">{timeAgo(b.lastTx)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-sm mt-3">No dormant accounts.</p>}
      </div>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────
function NotificationsPanel() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/admin/notifications`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data)   return <div className="text-gray-400 py-10 text-center">Failed to load notifications.</div>;

  const total = data.newSignups.length + data.highVoidRate.length;

  return (
    <div className="space-y-6">
      {total === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-medium">All clear</p>
          <p className="text-gray-500 text-sm mt-1">No new signups or flagged businesses.</p>
        </div>
      )}

      {/* New signups */}
      {data.newSignups.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" />
            New Signups This Week
            <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">{data.newSignups.length}</span>
          </h3>
          <div className="space-y-2">
            {data.newSignups.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{s.businessName}</p>
                  <p className="text-gray-500 text-xs">{s.name} · {s.email}</p>
                </div>
                <span className="text-gray-400 text-xs">{timeAgo(s.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High void rate */}
      {data.highVoidRate.length > 0 && (
        <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            High Void Rate — Possible Misuse
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{data.highVoidRate.length}</span>
          </h3>
          <p className="text-gray-500 text-xs mb-4">Businesses where ≥ 20% of transactions are voided (min 5 transactions)</p>
          <div className="space-y-2">
            {data.highVoidRate.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{b.businessName}</p>
                  <p className="text-gray-500 text-xs">{b.ownerName} · {b.voidedTx} of {b.totalTx} voided</p>
                </div>
                <span className="text-red-400 font-bold text-sm">{b.voidRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Business detail ───────────────────────────────────────────────────────────
function BusinessDetail({ businessId, onBack, onStatusChange }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('transactions');
  const [toggling, setToggling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${BASE}/admin/businesses/${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus() {
    if (!data) return;
    const newStatus = data.business.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} "${data.business.businessName}"?`)) return;
    setToggling(true);
    try {
      const res = await fetch(`${BASE}/admin/businesses/${businessId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData(d => ({ ...d, business: { ...d.business, status: newStatus } }));
        onStatusChange(businessId, newStatus);
      }
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!data)   return <div className="text-gray-400 py-10">Failed to load business data.</div>;

  const { business, team, recentTransactions, recentExpenses, products } = data;
  const isSuspended = business.status === 'suspended';

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to all businesses
      </button>

      {/* Business header */}
      <div className={`bg-gray-900 border rounded-xl p-6 mb-6 ${isSuspended ? 'border-red-900/50' : 'border-gray-800'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${isSuspended ? 'bg-red-600/20 text-red-400' : 'bg-teal-600/20 text-teal-400'}`}>
              {business.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl font-bold">{business.businessName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {business.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{business.ownerName} · {business.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">{business.city ? `${business.city}, ` : ''}{business.country} · Joined {new Date(business.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <button
            onClick={toggleStatus}
            disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              isSuspended
                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400'
                : 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
            }`}
          >
            {isSuspended ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            {toggling ? 'Updating…' : isSuspended ? 'Reactivate' : 'Suspend'}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-800">
          {[
            { label: 'Total Revenue',  value: fmt(business.currency, business.totalRevenue),  color: 'text-teal-400' },
            { label: 'Total Expenses', value: fmt(business.currency, business.totalExpenses), color: 'text-red-400' },
            { label: 'Net Profit',     value: fmt(business.currency, business.netProfit),      color: business.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Transactions',   value: business.transactionCount,                       color: 'text-white' },
            { label: 'Stock Items',    value: `${business.stockTotal} (${business.stockLow} low)`, color: business.stockLow > 0 ? 'text-amber-400' : 'text-white' },
          ].map(m => (
            <div key={m.label}>
              <p className="text-gray-500 text-xs">{m.label}</p>
              <p className={`font-bold text-lg ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      {team.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" /> Team Members ({team.length})
          </h3>
          <div className="space-y-2">
            {team.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <span className="text-white text-sm font-medium">{m.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{m.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{m.role}</span>
                  {m.status === 'active'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <AlertCircle  className="w-3.5 h-3.5 text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {['transactions', 'expenses', 'products'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3">Receipt</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Customer</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3">Total</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Method</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Recorded By</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, i) => (
                <tr key={tx.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                  <td className="px-5 py-3 text-teal-400 font-mono text-xs">{tx.receipt_number}</td>
                  <td className="px-5 py-3 text-gray-300">{tx.customer}</td>
                  <td className="px-5 py-3 text-right text-white font-medium">{fmt(business.currency, tx.total)}</td>
                  <td className="px-5 py-3 text-gray-400 capitalize">{tx.payment_method}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'voided' ? 'bg-red-500/20 text-red-400' : tx.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {tx.status === 'voided' ? 'Voided' : tx.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{tx.added_by || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentTransactions.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">No transactions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3">Description</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Category</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3">Amount</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Recorded By</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((ex, i) => (
                <tr key={ex.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                  <td className="px-5 py-3 text-gray-300">{ex.description}</td>
                  <td className="px-5 py-3 text-gray-400">{ex.category || '—'}</td>
                  <td className="px-5 py-3 text-right text-red-400 font-medium">{fmt(business.currency, ex.amount)}</td>
                  <td className="px-5 py-3 text-gray-400">{ex.added_by || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(ex.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentExpenses.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-500">No expenses yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Products */}
      {tab === 'products' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 font-medium px-5 py-3">Product</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Category</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3">Price</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3">Cost</th>
                <th className="text-right text-gray-400 font-medium px-5 py-3">Stock</th>
                <th className="text-left text-gray-400 font-medium px-5 py-3">Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                  <td className="px-5 py-3 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-500" />
                      {p.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{p.category || '—'}</td>
                  <td className="px-5 py-3 text-right text-teal-400">{fmt(business.currency, p.price)}</td>
                  <td className="px-5 py-3 text-right text-gray-400">{fmt(business.currency, p.costPrice)}</td>
                  <td className="px-5 py-3 text-right text-white">{p.stockQty}</td>
                  <td className="px-5 py-3">
                    {p.stockQty <= p.threshold && p.threshold > 0
                      ? <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Low stock</span>
                      : <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">OK</span>
                    }
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">No products yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard shell ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab]               = useState('businesses');
  const [loading, setLoading]       = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const admin = JSON.parse(localStorage.getItem('dwatrack_admin') || '{}');

  const load = useCallback(async () => {
    try {
      const [sRes, bRes, nRes] = await Promise.all([
        fetch(`${BASE}/admin/stats`,         { headers: authHeaders() }),
        fetch(`${BASE}/admin/businesses`,    { headers: authHeaders() }),
        fetch(`${BASE}/admin/notifications`, { headers: authHeaders() }),
      ]);
      if (sRes.status === 401) {
        localStorage.removeItem('dwatrack_admin_token');
        localStorage.removeItem('dwatrack_admin');
        navigate('/admin');
        return;
      }
      const [s, b, n] = await Promise.all([sRes.json(), bRes.json(), nRes.json()]);
      setStats(s);
      setBusinesses(b);
      setNotifCount((n.newSignups?.length || 0) + (n.highVoidRate?.length || 0));
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  function handleLogout() {
    localStorage.removeItem('dwatrack_admin_token');
    localStorage.removeItem('dwatrack_admin');
    navigate('/admin');
  }

  function handleStatusChange(id, newStatus) {
    setBusinesses(bs => bs.map(b => b.id === id ? { ...b, status: newStatus } : b));
  }

  const tabs = [
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'insights',   label: 'Insights',   icon: BarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifCount },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-white">DwaTrack Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{admin.name || admin.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedId ? (
          <BusinessDetail
            businessId={selectedId}
            onBack={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
              <p className="text-gray-400 text-sm mt-1">All businesses onboarded to DwaTrack</p>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Building2}    label="Total Businesses"   value={stats.totalBusinesses}   color="bg-teal-600" />
                <StatCard icon={ShoppingCart} label="Total Transactions" value={stats.totalTransactions} color="bg-indigo-600" />
                <StatCard icon={TrendingUp}   label="Platform Revenue"   value={`GH₵${Number(stats.totalRevenue).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`} color="bg-emerald-600" />
                <StatCard icon={Users}        label="Total Staff"        value={stats.totalTeamMembers}  color="bg-violet-600" />
              </div>
            )}

            {/* Tab nav */}
            <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${tab === t.id ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {t.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'businesses'    && <BusinessList businesses={businesses} onSelect={id => { setSelectedId(id); }} />}
            {tab === 'insights'      && <InsightsPanel />}
            {tab === 'notifications' && <NotificationsPanel />}
          </>
        )}
      </main>
    </div>
  );
}
