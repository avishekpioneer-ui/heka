import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdNotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useOpdSocketEvent('opd:reminder', (payload) => {
    if (payload?.type !== 'created' || !payload.reminder) return;
    setNotifications((prev) => [payload.reminder, ...prev].slice(0, 20));
  });

  const unreadCount = notifications.length;

  const handleOpenReminders = () => {
    setOpen(false);
    setNotifications([]);
    navigate('/opd/reminders');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center border border-teal-100/50 transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:inset-x-auto sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h4 className="text-sm font-bold text-teal-950">Live Follow-up Reminders</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs">Close</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No new reminders pushed yet.</p>
            ) : (
              notifications.map((r, idx) => (
                <div key={r._id || idx} className="p-3 border-b border-slate-50 last:border-b-0 text-xs text-gray-700">
                  <p className="font-semibold text-teal-900">{r.patientId?.name || 'Patient'}</p>
                  <p className="text-gray-500 mt-0.5 line-clamp-2">{r.message}</p>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleOpenReminders}
            className="w-full text-center text-xs font-semibold text-[#0D9488] hover:bg-teal-50 py-3 cursor-pointer"
          >
            View All Reminders
          </button>
        </div>
      )}
    </div>
  );
};

export default OpdNotificationBell;
