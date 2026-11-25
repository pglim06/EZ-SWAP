import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Package,
  AlertTriangle,
  Flag,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  RotateCcw,
  Gavel,
  TrendingUp,
  Star,
  RefreshCw,
} from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

// ─── Reusable tiny stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
      <div className={`${bg} p-2.5 rounded-xl`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-black text-slate-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T16: Admin Dashboard & Moderation Portal (Frontend)
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user } = useAuth();

  // ── Active tab ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | listings | reports | disputes

  // ── Platform stats (Overview) ────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Users management ─────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilter, setUsersFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Listings moderation ──────────────────────────────────────────────────
  const [listings, setListings] = useState([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsSearch, setListingsSearch] = useState('');
  const [listingsStatus, setListingsStatus] = useState('');
  const [listingsLoading, setListingsLoading] = useState(false);

  // ── Reports moderation ───────────────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsFilter, setReportsFilter] = useState('');
  const [reportsLoading, setReportsLoading] = useState(false);

  // ── Disputes ─────────────────────────────────────────────────────────────
  const [disputes, setDisputes] = useState([]);
  const [disputesTotal, setDisputesTotal] = useState(0);
  const [disputesPage, setDisputesPage] = useState(1);
  const [disputesLoading, setDisputesLoading] = useState(false);

  // ── Action feedback ──────────────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Helper to show a toast then clear it
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Fetchers
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API}/stats`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (usersSearch) params.set('search', usersSearch);
      if (usersFilter) params.set('verificationStatus', usersFilter);
      const res = await fetch(`${API}/users?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
      setUsersPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchListings = async (page = 1) => {
    try {
      setListingsLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (listingsSearch) params.set('search', listingsSearch);
      if (listingsStatus) params.set('status', listingsStatus);
      const res = await fetch(`${API}/listings?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load listings');
      const data = await res.json();
      setListings(data.listings);
      setListingsTotal(data.total);
      setListingsPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchReports = async (page = 1) => {
    try {
      setReportsLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (reportsFilter) params.set('status', reportsFilter);
      const res = await fetch(`${API}/reports?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load reports');
      const data = await res.json();
      setReports(data.reports);
      setReportsTotal(data.total);
      setReportsPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchDisputes = async (page = 1) => {
    try {
      setDisputesLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      const res = await fetch(`${API}/disputes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load disputes');
      const data = await res.json();
      setDisputes(data.transactions);
      setDisputesTotal(data.total);
      setDisputesPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setDisputesLoading(false);
    }
  };

  // ── Load data on tab change ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'listings') fetchListings(1);
    if (activeTab === 'reports') fetchReports(1);
    if (activeTab === 'disputes') fetchDisputes(1);
  }, [activeTab]);

  // Re-fetch when filters change
  useEffect(() => { if (activeTab === 'users') fetchUsers(1); }, [usersFilter]);
  useEffect(() => { if (activeTab === 'listings') fetchListings(1); }, [listingsStatus]);
  useEffect(() => { if (activeTab === 'reports') fetchReports(1); }, [reportsFilter]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin Actions
  // ═══════════════════════════════════════════════════════════════════════════

  const updateUserVerification = async (userId, verificationStatus) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/users/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verificationStatus }),
      });
      if (!res.ok) throw new Error('Failed to update verification');
      showToast(`User verification set to "${verificationStatus}"`);
      fetchUsers(usersPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    if (!window.confirm(`Change this user's role to "${role}"?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      showToast(`User role updated to "${role}"`);
      fetchUsers(usersPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const updateListingStatus = async (listingId, status) => {
    const label = status === 'removed' ? 'Remove this listing?' : 'Reinstate this listing?';
    if (!window.confirm(label)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update listing status');
      showToast(`Listing ${status === 'removed' ? 'removed' : 'reinstated'}`);
      fetchListings(listingsPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    const adminNotes = status === 'dismissed' ? 'Dismissed by admin' : '';
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error('Failed to update report');
      showToast(`Report marked as "${status}"`);
      fetchReports(reportsPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const resolveDispute = async (transactionId, status) => {
    const label = status === 'completed' ? 'Mark as completed (seller wins)?' : 'Cancel transaction (buyer wins)?';
    if (!window.confirm(label)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/disputes/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to resolve dispute');
      showToast(`Dispute resolved as "${status}"`);
      fetchDisputes(disputesPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Guard — only admin
  // ═══════════════════════════════════════════════════════════════════════════
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <ShieldCheck className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 mb-6">
          This area is restricted to administrators. If you believe this is an error, contact a platform admin.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-xs"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Tabs config
  // ═══════════════════════════════════════════════════════════════════════════
  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'listings', label: 'Listings', icon: Package },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  ];

  // Pagination helper
  const Pagination = ({ page, total, limit = 15, onPage }) => {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer disabled:cursor-default"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {page} of {totalPages} ({total} total)
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer disabled:cursor-default"
        >
          Next
        </button>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          Admin Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          T16: Platform overview, user management, listing moderation, report handling, and dispute resolution
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB: Overview                                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {statsLoading ? (
            <div className="py-20 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading platform stats…
            </div>
          ) : stats ? (
            <>
              {/* Top-level KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Users" value={stats.users.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="Verified Students" value={stats.users.verified} icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Active Listings" value={stats.listings.active} icon={Package} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Trade Volume" value={`RM ${stats.trade.totalVolume.toLocaleString()}`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Listings" value={stats.listings.total} icon={Package} color="text-slate-600" bg="bg-slate-50" />
                <StatCard label="Sold Items" value={stats.listings.sold} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Removed Listings" value={stats.listings.removed} icon={Trash2} color="text-red-500" bg="bg-red-50" />
                <StatCard label="Recent Signups (7d)" value={stats.users.recentRegistrations} icon={Users} color="text-teal-600" bg="bg-teal-50" />
              </div>

              {/* Orders & Transactions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Orders" value={stats.orders.total} icon={Package} color="text-orange-600" bg="bg-orange-50" />
                <StatCard label="Pending Orders" value={stats.orders.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Completed Txns" value={stats.transactions.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Disputed Txns" value={stats.transactions.disputed} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
              </div>

              {/* Reports & Reviews */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Reports" value={stats.reports.total} icon={Flag} color="text-red-500" bg="bg-red-50" />
                <StatCard label="Pending Reports" value={stats.reports.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Total Reviews" value={stats.reviews.total} icon={Star} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="Unverified Users" value={stats.users.unverified} icon={XCircle} color="text-slate-500" bg="bg-slate-100" />
              </div>

              {/* Category distribution */}
              {stats.categories && stats.categories.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Listing Category Distribution
                  </h3>
                  <div className="space-y-2">
                    {stats.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700 w-28 truncate">{cat.name || 'Unknown'}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (cat.count / stats.listings.total) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-red-500">Failed to load platform stats. Is the server running?</p>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB: Users                                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div>
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or university ID…"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={usersFilter}
              onChange={(e) => setUsersFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={() => fetchUsers(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </div>

          {usersLoading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No users found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-500 font-semibold">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">University ID</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-slate-100 hover:bg-blue-50/30 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3 text-slate-600">{u.universityId || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-700'
                              : u.verificationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : u.verificationStatus === 'rejected'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {u.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {u.averageRating > 0 ? `${u.averageRating.toFixed(1)} ★` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.verificationStatus !== 'verified' && (
                              <button
                                onClick={() => updateUserVerification(u._id, 'verified')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                                title="Verify user"
                              >
                                Verify
                              </button>
                            )}
                            {u.verificationStatus === 'verified' && (
                              <button
                                onClick={() => updateUserVerification(u._id, 'unverified')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                                title="Revoke verification"
                              >
                                Revoke
                              </button>
                            )}
                            {u.verificationStatus === 'pending' && (
                              <button
                                onClick={() => updateUserVerification(u._id, 'rejected')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                                title="Reject verification"
                              >
                                Reject
                              </button>
                            )}
                            {u.role !== 'admin' ? (
                              <button
                                onClick={() => updateUserRole(u._id, 'admin')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition cursor-pointer disabled:opacity-50"
                                title="Promote to admin"
                              >
                                Make Admin
                              </button>
                            ) : u._id !== user._id ? (
                              <button
                                onClick={() => updateUserRole(u._id, 'student')}
                                disabled={actionLoading}
                                className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                                title="Demote to student"
                              >
                                Demote
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={usersPage} total={usersTotal} onPage={fetchUsers} />
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB: Listings                                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search listings by title or description…"
                value={listingsSearch}
                onChange={(e) => setListingsSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings(1)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={listingsStatus}
              onChange={(e) => setListingsStatus(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="removed">Removed</option>
            </select>
            <button
              onClick={() => fetchListings(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </div>

          {listingsLoading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading listings…
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No listings found.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {listings.map((listing) => (
                  <div key={listing._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-sm transition flex items-center gap-4">
                    {/* Thumbnail */}
                    <img
                      src={listing.images?.[0]?.imageUrl || 'https://via.placeholder.com/80'}
                      alt={listing.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/listings/${listing._id}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition line-clamp-1"
                      >
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>RM {listing.price}</span>
                        <span>•</span>
                        <span>{listing.category}</span>
                        <span>•</span>
                        <span>{listing.condition}</span>
                        <span>•</span>
                        <span>by {listing.sellerId?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    {/* Status */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      listing.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : listing.status === 'sold'
                        ? 'bg-blue-100 text-blue-700'
                        : listing.status === 'removed'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {listing.status}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {listing.status !== 'removed' ? (
                        <button
                          onClick={() => updateListingStatus(listing._id, 'removed')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => updateListingStatus(listing._id, 'active')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reinstate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={listingsPage} total={listingsTotal} onPage={fetchListings} />
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB: Reports                                                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <select
              value={reportsFilter}
              onChange={(e) => setReportsFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <button
              onClick={() => fetchReports(1)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {reportsLoading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading reports…
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
              <Flag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No reports found.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : report.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-700'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">
                            {report.targetType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Reported by <strong className="text-slate-700">{report.reporterId?.name || 'Unknown'}</strong>
                          {' '}&middot;{' '}{new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateReportStatus(report._id, 'reviewed')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => updateReportStatus(report._id, 'resolved')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => updateReportStatus(report._id, 'dismissed')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                      {report.status === 'reviewed' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateReportStatus(report._id, 'resolved')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => updateReportStatus(report._id, 'dismissed')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-xs text-slate-700">{report.reason}</p>
                    </div>
                    {report.adminNotes && (
                      <div className="mt-2 text-[11px] text-slate-500 italic">
                        Admin notes: {report.adminNotes}
                      </div>
                    )}
                    {report.resolvedAt && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Resolved: {new Date(report.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={reportsPage} total={reportsTotal} onPage={fetchReports} />
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB: Disputes                                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'disputes' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => fetchDisputes(1)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <span className="text-xs text-slate-500">Showing disputed transactions requiring admin intervention</span>
          </div>

          {disputesLoading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading disputes…
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No Active Disputes</p>
              <p className="text-xs text-slate-500">All transaction disputes have been resolved. 🎉</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {disputes.map((tx) => (
                  <div key={tx._id} className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          {tx.listingId?.title || 'Unknown Listing'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>RM {tx.listingId?.price || '—'}</span>
                          <span>•</span>
                          <span>{tx.listingId?.category || '—'}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                        <AlertTriangle className="w-3 h-3" /> Disputed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-3 mb-4">
                      <div>
                        <span className="text-slate-400 block font-medium">Buyer</span>
                        <span className="font-semibold text-slate-700">{tx.buyerId?.name || 'Unknown'} ({tx.buyerId?.email || ''})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Seller</span>
                        <span className="font-semibold text-slate-700">{tx.sellerId?.name || 'Unknown'} ({tx.sellerId?.email || ''})</span>
                      </div>
                    </div>

                    {tx.disputeReason && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                        <p className="text-xs font-semibold text-red-800 mb-0.5">Dispute Reason:</p>
                        <p className="text-xs text-red-700">{tx.disputeReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resolveDispute(tx._id, 'completed')}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete (Seller Wins)
                      </button>
                      <button
                        onClick={() => resolveDispute(tx._id, 'cancelled')}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel (Buyer Wins)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={disputesPage} total={disputesTotal} onPage={fetchDisputes} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
