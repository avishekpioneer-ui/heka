import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      const res = await axios.get('http://localhost:5001/api/opd/reminders', { headers });
      setReminders(res.data);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  // Live-refresh the log whenever the background scanner (or another staff
  // session) pushes a new reminder.
  useOpdSocketEvent('opd:reminder', fetchReminders);

  const handleScanTrigger = async () => {
    setScanning(true);
    setSuccess('');
    setError('');

    try {
      const headers = { 'x-user-id': userId };
      const res = await axios.post('http://localhost:5001/api/opd/reminders/scan', {}, { headers });
      
      setSuccess(`Scan executed! Simulated notifications sent to ${res.data.remindersSent} patients due for follow-ups.`);
      fetchReminders(); // reload logs
    } catch (err) {
      setError('Error triggering scan engine.');
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Automated Follow-up Reminders</h1>
          <p className="text-gray-500 mt-1 font-dmsans">Review outgoing SMS/Email alerts dispatched before patient follow-up dates.</p>
        </div>
        <button
          onClick={handleScanTrigger}
          disabled={scanning}
          className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-xl shadow-sm text-sm font-semibold transition-all disabled:opacity-75 cursor-pointer flex items-center gap-2"
        >
          {scanning ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning consultations...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89l-1.786 1.786L18 8" />
              </svg>
              Trigger Follow-up Reminder Scan
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-semibold flex items-start">
          <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Reminder logs list card */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Reminder Despatch Audit Trails</h3>

        {loading ? (
          <div className="flex items-center justify-center min-h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-100 rounded-2xl">
            <p className="text-gray-400 text-sm">No follow-up reminders sent yet.</p>
            <p className="text-xs text-gray-400 mt-2 italic">Click 'Trigger Follow-up Reminder Scan' above to scan recent clinical records and log reminders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((rem) => (
              <div key={rem._id} className="p-4 border border-gray-50 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{rem.patientId?.name}</h4>
                    <span className="text-[9px] bg-teal-50 border border-teal-100 text-[#0D9488] font-bold px-2 py-0.5 rounded-full">
                      DISPATCHED: SMS
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{rem.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">Sent: {new Date(rem.sentAt).toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-teal-700 mt-1">Due Date: {new Date(rem.followUpDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdReminders;
