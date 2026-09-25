import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const OpdBillingSummary = () => {
  const userId = localStorage.getItem('userId');
  const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('all-due'); // 'all-due' | 'this-month' | 'this-week' | 'today' | 'recent-paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [payingBillId, setPayingBillId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setError('');
      const res = await axios.get(`${backendUrl}/api/opd/billing/summary`, {
        headers: { 'x-user-id': userId }
      });
      if (res.data?.success && res.data?.summary) {
        setData(res.data.summary);
      } else {
        setError('Failed to load billing summary data.');
      }
    } catch (err) {
      console.error('Fetch billing summary error:', err);
      setError(err.response?.data?.message || 'Failed to connect to billing analytics server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [backendUrl, userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleMarkPaid = async (billId) => {
    if (!billId) return;
    if (!window.confirm('Mark this invoice as fully Paid?')) return;
    try {
      setPayingBillId(billId);
      await axios.put(`${backendUrl}/api/opd/billing/${billId}/pay`, {}, {
        headers: { 'x-user-id': userId }
      });
      setActionSuccess('Payment recorded successfully! Invoice marked as Paid.');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchSummary();
    } catch (err) {
      console.error('Error marking bill paid:', err);
      alert(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setPayingBillId(null);
    }
  };

  const allTime = data?.allTime || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };
  const thisMonth = data?.thisMonth || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0, monthName: '' };
  const thisWeek = data?.thisWeek || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };
  const today = data?.today || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };

  const collectionRate = allTime.totalBilled > 0
    ? Math.round((allTime.totalPaid / allTime.totalBilled) * 100)
    : 0;

  // Filtered invoices according to active tab
  const displayedInvoices = useMemo(() => {
    if (!data) return [];
    let list = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    if (activeTab === 'recent-paid') {
      list = data.recentPaidInvoices || [];
    } else {
      const dues = data.dueInvoices || [];
      if (activeTab === 'all-due') {
        list = dues;
      } else if (activeTab === 'today') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfToday);
      } else if (activeTab === 'this-week') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfWeek);
      } else if (activeTab === 'this-month') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfMonth);
      }
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(b => {
      const pName = (b.patientId?.name || '').toLowerCase();
      const pPhone = (b.patientId?.phone || '').toLowerCase();
      const invNo = String(b.invoiceNumber || b._id || '').toLowerCase();
      return pName.includes(q) || pPhone.includes(q) || invNo.includes(q);
    });
  }, [data, activeTab, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revenue & Dues Overview</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time financial summary tracking total collections, outstanding dues, this month and this week.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl border border-gray-200 transition-colors shadow-xs disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/opd/billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
          >
            <span>🧾</span>
            Manage Invoices
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span>✓</span> {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchSummary} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Calculating financial metrics...</p>
        </div>
      ) : (
        <>
          {/* Primary Financial Overview: Billed, Received, Due */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: All-Time Total Billed */}
            <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white p-6 rounded-2xl shadow-md border border-teal-800/40 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-28 h-28 rounded-full bg-teal-600/10 pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-teal-300">Total Billed</span>
                  <span className="p-2 bg-teal-800/60 text-teal-200 rounded-xl text-xs font-semibold">All Time</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight mt-3 text-white">
                  {formatINR(allTime.totalBilled)}
                </div>
                <p className="text-xs text-teal-300 mt-2">
                  Total gross billed across <span className="font-bold text-white">{allTime.totalCount}</span> patient invoices.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-teal-800/60 flex items-center justify-between text-xs">
                <span className="text-teal-200">Settled: <strong>{allTime.paidCount}</strong></span>
                <span className="text-teal-200">Unsettled: <strong>{allTime.dueCount}</strong></span>
              </div>
            </div>

            {/* Card 2: Total Received (Collected) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-emerald-50 pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-800">Total Received Amount</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                    {allTime.paidCount} Paid
                  </span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight mt-3 text-emerald-700">
                  {formatINR(allTime.totalPaid)}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total cash, UPI & card collections settled in OPD.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span>✓</span> Fully Collected
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {collectionRate}% Collection Rate
                </span>
              </div>
            </div>

            {/* Card 3: Total Outstanding Due */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-200 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-rose-50 pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-rose-700">Total Outstanding Due</span>
                  <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-200">
                    {allTime.dueCount} Unpaid
                  </span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight mt-3 text-rose-600">
                  {formatINR(allTime.totalDue)}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pending receivables from <span className="font-semibold text-gray-700">{allTime.dueCount}</span> patient bills.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <span>⏳</span> Needs Collection
                </span>
                <span className="text-gray-400 font-medium">
                  {allTime.totalBilled > 0 ? Math.round((allTime.totalDue / allTime.totalBilled) * 100) : 0}% of Total
                </span>
              </div>
            </div>
          </div>

          {/* Period Comparisons: This Month, This Week, Today */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Period 1: This Month */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-gray-700">This Month</span>
                  <span className="p-1 px-2 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold">
                    {thisMonth.monthName || 'Current Month'}
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight mt-2 text-gray-900">
                  {formatINR(thisMonth.totalBilled)}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{thisMonth.totalCount} bills this month</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold">Received: <strong>{formatINR(thisMonth.totalPaid)}</strong></span>
                <span className="text-rose-600 font-semibold">Due: <strong>{formatINR(thisMonth.totalDue)}</strong></span>
              </div>
            </div>

            {/* Period 2: This Week */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-gray-700">This Week</span>
                  <span className="p-1 px-2 bg-teal-50 text-teal-700 rounded-md text-[11px] font-bold">
                    {thisWeek.totalCount} Invoices
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight mt-2 text-gray-900">
                  {formatINR(thisWeek.totalBilled)}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">Current week (Mon – Sun)</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold">Received: <strong>{formatINR(thisWeek.totalPaid)}</strong></span>
                <span className="text-rose-600 font-semibold">Due: <strong>{formatINR(thisWeek.totalDue)}</strong></span>
              </div>
            </div>

            {/* Period 3: Today */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-800">Today</span>
                  <span className="p-1 px-2 bg-amber-50 text-amber-800 rounded-md text-[11px] font-bold">
                    {today.totalCount} Bills
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight mt-2 text-gray-900">
                  {formatINR(today.totalBilled)}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">Today's billing activity</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-semibold">Received: <strong>{formatINR(today.totalPaid)}</strong></span>
                <span className="text-rose-600 font-semibold">Due: <strong>{formatINR(today.totalDue)}</strong></span>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row (Today snapshot & Quick overview bar) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Today's Total Billing</span>
                <div className="text-2xl font-bold text-amber-900 mt-1">{formatINR(today.totalBilled)}</div>
                <p className="text-xs text-amber-700 mt-0.5">{today.totalCount} bills created today</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-700">Paid: {formatINR(today.totalPaid)}</div>
                <div className="text-xs font-semibold text-rose-700 mt-1">Due: {formatINR(today.totalDue)}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Settled Invoices</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{allTime.paidCount} Bills</div>
                <p className="text-xs text-gray-500 mt-0.5">Fully collected & closed</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl font-bold">✓</div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Unsettled Invoices</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">{allTime.dueCount} Bills</div>
                <p className="text-xs text-gray-500 mt-0.5">Pending collection from patients</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl font-bold">⏳</div>
            </div>
          </div>

          {/* Dues & Invoices Breakdown Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Outstanding Dues & Invoices</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filter pending bills by time range, search patient names, or mark payments as settled.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search patient, phone, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50/50">
              <button
                onClick={() => setActiveTab('all-due')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all-due'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All Outstanding Dues ({data?.dueInvoices?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('this-month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'this-month'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                This Month Dues ({thisMonth.dueCount})
              </button>
              <button
                onClick={() => setActiveTab('this-week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'this-week'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                This Week Dues ({thisWeek.dueCount})
              </button>
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'today'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Today Dues ({today.dueCount})
              </button>
              <button
                onClick={() => setActiveTab('recent-paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'recent-paid'
                    ? 'bg-gray-800 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Recent Settled / Paid ({data?.recentPaidInvoices?.length || 0})
              </button>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              {displayedInvoices.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
                    📋
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">No invoices found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No bills match your search criteria. Try a different query.'
                      : activeTab === 'recent-paid'
                      ? 'No settled payments to display in this list.'
                      : 'There are no outstanding dues in this category. All bills are settled!'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Bill Type & Items</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedInvoices.map((inv) => {
                      const isPaid = (inv.status === 'Paid' || inv.status === 'PAID' || inv.paymentStatus === 'Paid');
                      const invId = inv._id;
                      const invCode = String(inv.invoiceNumber || invId || '').slice(-8).toUpperCase();
                      const patient = inv.patientId || {};
                      const testsCount = (inv.tests || []).length;
                      const medsCount = (inv.medicines || []).length;
                      const consultFee = parseFloat(inv.consultationFee || 0);

                      return (
                        <tr key={invId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0f766e]">
                            #{invCode}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                            {formatDate(inv.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900">{patient.name || 'Walk-in Patient'}</div>
                            {patient.phone ? (
                              <div className="text-xs text-gray-500 font-mono">{patient.phone}</div>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
                                {inv.billingType || 'Combined'}
                              </span>
                              {consultFee > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium">
                                  👨‍⚕️ Consult
                                </span>
                              )}
                              {testsCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 font-medium">
                                  🧪 {testsCount} Test{testsCount > 1 ? 's' : ''}
                                </span>
                              )}
                              {medsCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium">
                                  💊 {medsCount} Med{medsCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-extrabold font-mono text-sm ${isPaid ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {formatINR(inv.totalAmount)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isPaid ? '✓ Paid' : '⏳ Pending / Due'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {!isPaid ? (
                              <button
                                onClick={() => handleMarkPaid(invId)}
                                disabled={payingBillId === invId}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                              >
                                {payingBillId === invId ? 'Saving...' : '💳 Mark Paid'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold">Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OpdBillingSummary;
