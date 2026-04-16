import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ShoppingCart, TrendingUp, LogOut, ArrowLeft, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('dwatrack_admin_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function fmt(currency, amount) {
  return `${currency || ''}${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
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
  const filtered = businesses.filter(b =>
    b.businessName.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search businesses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500 w-72"
        />
        <span className="text-gray-500 text-sm">{filtered.length} business{filtered.length !== 1 ? 'es' : ''}</span>
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
              <th className="text-left text-gray-400 font-medium px-5 py-3">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={`border-b border-gray-800/50 hover:bg-gray-800/60 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}
              >
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
                <td className="px-5 py-3.5 text-right text-teal-400 font-medium">
                  {fmt(b.currency, b.totalRevenue)}
                </td>
                <td className="px-5 py-3.5 text-right text-gray-300">{b.transactionCount}</td>
                <td className="px-5 py-3.5 text-right text-gray-300">{b.teamCount}</td>
                <td className="px-5 py-3.5 text-gray-400">{timeAgo(b.lastTransactionAt)}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-500">No businesses found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Business detail ───────────────────────────────────────────────────────────
function BusinessDetail({ businessId, onBack }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('transactions');

  useEffect(() => {
    fetch(`${BASE}/admin/businesses/${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return <div className="text-gray-400 py-10">Failed to load business data.</div>;

  const { business, team, recentTransactions, recentExpenses } = data;

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to all businesses
      </button>

      {/* Business header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-xl">
              {business.businessName.charAt(0)}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{business.businessName}</h2>
              <p className="text-gray-400 text-sm">{business.ownerName} · {business.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">{business.city ? `${business.city}, ` : ''}{business.country} · Joined {new Date(business.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            {business.taxEnabled && (
              <span className="inline-block bg-teal-600/20 text-teal-400 text-xs px-2.5 py-1 rounded-full">
                {business.taxLabel} {business.taxRate}%
              </span>
            )}
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-800">
          {[
            { label: 'Total Revenue',   value: fmt(business.currency, business.totalRevenue),   color: 'text-teal-400' },
            { label: 'Total Expenses',  value: fmt(business.currency, business.totalExpenses),  color: 'text-red-400' },
            { label: 'Net Profit',      value: fmt(business.currency, business.netProfit),       color: business.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Transactions',    value: business.transactionCount,                        color: 'text-white' },
            { label: 'Stock Items',     value: `${business.stockTotal} (${business.stockLow} low)`, color: business.stockLow > 0 ? 'text-amber-400' : 'text-white' },
          ].map(m => (
            <div key={m.label}>
              <p className="text-gray-500 text-xs">{m.label}</p>
              <p className={`font-bold text-lg ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team members */}
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
                    : <AlertCircle  className="w-3.5 h-3.5 text-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {['transactions', 'expenses'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Transactions table */}
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
                  <td className="px-5 py-3 text-right text-white font-medium">
                    {fmt(business.currency, tx.total)}
                  </td>
                  <td className="px-5 py-3 text-gray-400 capitalize">{tx.payment_method}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'voided'
                        ? 'bg-red-500/20 text-red-400'
                        : tx.payment_status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tx.status === 'voided' ? 'Voided' : tx.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{tx.added_by || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses table */}
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
                  <td className="px-5 py-3 text-right text-red-400 font-medium">
                    {fmt(business.currency, ex.amount)}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{ex.added_by || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(ex.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentExpenses.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-500">No expenses yet</td></tr>
              )}
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
  const [stats, setStats]             = useState(null);
  const [businesses, setBusinesses]   = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [loading, setLoading]         = useState(true);

  const admin = JSON.parse(localStorage.getItem('dwatrack_admin') || '{}');

  const load = useCallback(async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`${BASE}/admin/stats`,      { headers: authHeaders() }),
        fetch(`${BASE}/admin/businesses`, { headers: authHeaders() }),
      ]);
      if (sRes.status === 401 || bRes.status === 401) {
        localStorage.removeItem('dwatrack_admin_token');
        localStorage.removeItem('dwatrack_admin');
        navigate('/admin');
        return;
      }
      const [s, b] = await Promise.all([sRes.json(), bRes.json()]);
      setStats(s);
      setBusinesses(b);
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
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
          <BusinessDetail businessId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <div className="mb-8">
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

            {/* Business list */}
            <BusinessList businesses={businesses} onSelect={setSelectedId} />
          </>
        )}
      </main>
    </div>
  );
}
