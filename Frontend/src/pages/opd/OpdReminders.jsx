import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'LATER'
  const [statusFilter, setStatusFilter] = useState('ALL');

  const userId = localStorage.getItem('userId');
  const backendUri = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001';

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      const res = await axios.get(`${backendUri}/api/opd/reminders`, { headers });
      const rData = res.data?.reminders || res.data || [];
      setReminders(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  // Live-refresh on socket events
  useOpdSocketEvent('opd:reminder', fetchReminders);
  useOpdSocketEvent('opd:consultation', fetchReminders);

  const handleScanTrigger = async () => {
    setScanning(true);
    setSuccess('');
    setError('');

    try {
      const headers = { 'x-user-id': userId };
      const res = await axios.post(`${backendUri}/api/opd/reminders/scan`, {}, { headers });
      
      const count = res.data?.remindersSent ?? res.data?.count ?? 0;
      setSuccess(`Sync executed! Synced follow-up advisories for ${count} patient(s) from clinical consults.`);
      fetchReminders();
    } catch (err) {
      setError('Error triggering sync engine.');
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const headers = { 'x-user-id': userId };
      await axios.patch(`${backendUri}/api/opd/reminders/${id}/status`, { status }, { headers });
      fetchReminders();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Are you sure you want to remove this follow-up advisory?')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${backendUri}/api/opd/reminders/${id}`, { headers });
      fetchReminders();
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const handleWhatsApp = (phone, name, message, dueDate) => {
    if (!phone) {
      alert('Patient does not have a registered phone number.');
      return;
    }
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'your scheduled date';

    const text = `Hello ${name || 'Patient'}, this is a follow-up reminder from Heka OPD. Your follow-up consultation is advised for *${formattedDate}*. ${message ? `\n\nAdvisory: ${message}` : ''}\n\nPlease visit the clinic on time. Thank you!`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getDiffDays = (dateStr) => {
    if (!dateStr) return 999;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 999;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetClean = new Date(target);
    targetClean.setHours(0, 0, 0, 0);

    const diffMs = targetClean.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((rem) => {
        const pName = (rem.patientId?.name || rem.patientName || '').toLowerCase();
        const pPhone = (rem.patientId?.phone || '').toLowerCase();
        const msg = (rem.message || rem.note || '').toLowerCase();
        const q = searchQuery.toLowerCase().trim();

        const matchesSearch = !q || pName.includes(q) || pPhone.includes(q) || msg.includes(q);
        const matchesStatus =
          statusFilter === 'ALL' ||
          (rem.status || 'Scheduled').toLowerCase() === statusFilter.toLowerCase();

        const dueDate = rem.followUpDate || rem.scheduledDate || rem.createdAt;
        const diff = getDiffDays(dueDate);

        let matchesDate = true;
        if (dateFilter === 'OVERDUE') matchesDate = diff < 0;
        else if (dateFilter === 'TODAY') matchesDate = diff === 0;
        else if (dateFilter === 'TOMORROW') matchesDate = diff === 1;
        else if (dateFilter === 'WEEK') matchesDate = diff >= 0 && diff <= 7;
        else if (dateFilter === 'LATER') matchesDate = diff > 7;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        // Earliest / fewer date comes first (ascending)
        const dateA = new Date(a.followUpDate || a.scheduledDate || a.createdAt || '9999-12-31').getTime();
        const dateB = new Date(b.followUpDate || b.scheduledDate || b.createdAt || '9999-12-31').getTime();
        return dateA - dateB;
      });
  }, [reminders, searchQuery, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let tomorrow = 0;
    let thisWeek = 0;

    reminders.forEach((r) => {
      const diff = getDiffDays(r.followUpDate || r.scheduledDate || r.createdAt);
      if (diff < 0) overdue++;
      if (diff === 0) today++;
      if (diff === 1) tomorrow++;
      if (diff >= 0 && diff <= 7) thisWeek++;
    });

    return {
      total: reminders.length,
      overdue,
      today,
      tomorrow,
      thisWeek,
    };
  }, [reminders]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Patient Follow-up Advisories</h1>
          <p className="text-gray-500 mt-1 font-dmsans text-sm">Chronological due queue • Instant Phone Call & WhatsApp advisory dispatch.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScanTrigger}
            disabled={scanning}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-xl shadow-sm text-sm font-bold transition-all disabled:opacity-75 cursor-pointer flex items-center gap-2"
          >
            {scanning ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Consults...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89l-1.786 1.786L18 8" />
                </svg>
                Sync from Clinical Consults
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar with Date Filter Clicks */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setDateFilter('ALL')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            dateFilter === 'ALL' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-100 shadow-sm'
          }`}
        >
          <p className="text-xs text-gray-500 font-semibold">Total Advisories</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
        </div>
        <div
          onClick={() => setDateFilter('TODAY')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            dateFilter === 'TODAY' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-100 shadow-sm'
          }`}
        >
          <p className="text-xs text-amber-700 font-semibold">Due Today</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.today}</h3>
        </div>
        <div
          onClick={() => setDateFilter('TOMORROW')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            dateFilter === 'TOMORROW' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-gray-100 shadow-sm'
          }`}
        >
          <p className="text-xs text-sky-700 font-semibold">Due Tomorrow</p>
          <h3 className="text-2xl font-bold text-sky-600 mt-1">{stats.tomorrow}</h3>
        </div>
        <div
          onClick={() => setDateFilter('WEEK')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            dateFilter === 'WEEK' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-100 shadow-sm'
          }`}
        >
          <p className="text-xs text-teal-700 font-semibold">Next 7 Days</p>
          <h3 className="text-2xl font-bold text-teal-600 mt-1">{stats.thisWeek}</h3>
        </div>
        <div
          onClick={() => setDateFilter('OVERDUE')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            dateFilter === 'OVERDUE' ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100 shadow-sm'
          }`}
        >
          <p className="text-xs text-red-700 font-semibold">Overdue</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</h3>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-800 text-sm font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-800 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search patient, phone, or advisory notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: `All Dates (${stats.total})` },
            { id: 'TODAY', label: `Today (${stats.today})` },
            { id: 'TOMORROW', label: `Tomorrow (${stats.tomorrow})` },
            { id: 'WEEK', label: `Next 7 Days (${stats.thisWeek})` },
            { id: 'OVERDUE', label: `Overdue (${stats.overdue})` },
            { id: 'LATER', label: 'Later' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === tab.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advisory logs list card */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-teal-950 font-literata">
            Earliest Due Advisories Queue
          </h3>
          <span className="text-xs text-gray-500 italic">Sorted by earliest due date first</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-gray-400 text-sm font-medium">No follow-up advisories found matching date criteria.</p>
            <p className="text-xs text-gray-400 mt-1 italic">
              Follow-up advisories are generated automatically when a doctor sets a "Follow-up Advisory Date" during a Clinical Consultation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((rem) => {
              const status = rem.status || 'Scheduled';
              const pName = rem.patientId?.name || rem.patientName || 'Patient';
              const pPhone = rem.patientId?.phone || '';
              const dueDate = rem.followUpDate || rem.scheduledDate || rem.createdAt;
              const diff = getDiffDays(dueDate);

              return (
                <div
                  key={rem._id}
                  className="p-4 border border-gray-100 rounded-xl bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm">👤 {pName}</h4>
                      {pPhone && <span className="text-xs bg-teal-50 text-teal-800 font-mono px-2 py-0.5 rounded-md font-bold">{pPhone}</span>}
                      
                      {diff < 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          ⚠️ OVERDUE ({Math.abs(diff)}d ago)
                        </span>
                      ) : diff === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          🔥 DUE TODAY
                        </span>
                      ) : diff === 1 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                          ⏰ DUE TOMORROW
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          📅 In {diff} days
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100">
                      📝 {rem.message || rem.note}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {pPhone ? (
                        <a
                          href={`tel:${pPhone.replace(/[^0-9+]/g, '')}`}
                          className="flex-1 md:flex-initial text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          📞 Call
                        </a>
                      ) : null}
                      <button
                        onClick={() => handleWhatsApp(pPhone, pName, rem.message, dueDate)}
                        disabled={!pPhone}
                        className="flex-1 md:flex-initial text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        💬 WhatsApp
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-900">
                        📅 Due: {new Date(dueDate).toLocaleDateString()}
                      </span>
                      {status !== 'Completed' ? (
                        <button
                          onClick={() => handleUpdateStatus(rem._id, 'Completed')}
                          className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-2 py-1 rounded-md font-bold cursor-pointer transition-colors"
                        >
                          ✓ Done
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(rem._id, 'Scheduled')}
                          className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 px-2 py-1 rounded-md font-medium cursor-pointer transition-colors"
                        >
                          ↺ Reopen
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReminder(rem._id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md cursor-pointer"
                        title="Delete reminder"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdReminders;
