import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    consultations: 0,
    billingPending: 0,
    billingPaid: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };

      // Fetch patients count
      let patientsCount = 0;
      if (hasPermission('manage_patients')) {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients', { headers });
        patientsCount = res.data.length;
      }

      // Fetch appointments list
      let appts = [];
      if (hasPermission('manage_appointments') || hasPermission('manage_consultations')) {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
        appts = res.data;
        setAppointments(appts.slice(0, 5)); // show recent 5
      }

      // Fetch consultations count
      let consultsCount = 0;
      if (hasPermission('manage_consultations') || hasPermission('manage_billing')) {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/consultations', { headers });
        consultsCount = res.data.length;
      }

      // Fetch bills stats
      let pending = 0;
      let paid = 0;
      if (hasPermission('manage_billing')) {
        const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/billing', { headers });
        const bills = res.data;
        pending = bills.filter(b => b.status === 'Pending').length;
        paid = bills.filter(b => b.status === 'Paid').length;
      }

      setStats({
        patients: patientsCount,
        appointments: appts.length,
        consultations: consultsCount,
        billingPending: pending,
        billingPaid: paid
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Live refresh whenever any other staff member books/updates an
  // appointment, completes a consultation, or generates/pays a bill.
  useOpdSocketEvent('opd:appointment', fetchDashboardData);
  useOpdSocketEvent('opd:consultation', fetchDashboardData);
  useOpdSocketEvent('opd:bill', fetchDashboardData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.patients,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Appointments booked',
      value: stats.appointments,
      color: 'bg-teal-50 text-teal-600 border-teal-100',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Consultations Done',
      value: stats.consultations,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Bills (Paid / Pending)',
      value: `${stats.billingPaid} / ${stats.billingPending}`,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1M10 21h4a2 2 0 002-2V5a2 2 0 00-2-2H10a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">OPD Operations Console</h1>
          <p className="text-gray-500 mt-1 font-dmsans">Real-time status of clinical consultations, checkups, and invoicing.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {hasPermission('manage_patients') && (
            <button
              onClick={() => navigate('/opd/patients')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#0D9488] text-white rounded-xl shadow-sm hover:bg-[#0f766e] text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              + Register Patient
            </button>
          )}
          {hasPermission('manage_appointments') && (
            <button
              onClick={() => navigate('/opd/appointments')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-teal-50 text-[#0D9488] rounded-xl border border-teal-100 hover:bg-teal-100/50 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="text-3xl font-bold text-teal-950 mt-2">{card.value}</h3>
            </div>
            <div className={`p-4 rounded-xl border ${card.color} group-hover:scale-105 transition-transform duration-300`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-teal-950 font-literata">Active Consultations Feed</h3>
            <button 
              onClick={() => navigate('/opd/appointments')}
              className="text-xs text-[#0D9488] hover:text-[#0f766e] font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All Appointments →
            </button>
          </div>

          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No scheduled appointments found for today.</p>
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 hover:bg-slate-50 border border-gray-100 rounded-xl transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appt.patientId?.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Doctor: <span className="font-semibold text-teal-800">{appt.doctorName}</span> • Phone: {appt.patientId?.phone}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Date: {new Date(appt.appointmentDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      appt.status === 'Completed' ? 'bg-green-50 text-green-700' :
                      appt.status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {appt.status}
                    </span>
                    {appt.status === 'Scheduled' && hasPermission('manage_consultations') && (
                      <button 
                        onClick={() => navigate('/opd/consultations', { state: { appt } })}
                        className="text-xs bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Consult
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Help / Info Guide */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-teal-950 mb-4 font-literata">OPD Workflow Summary</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                <p className="text-xs text-gray-600 mt-1"><strong>Registration:</strong> Register new/existing patient profiles in Patients Registry.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <p className="text-xs text-gray-600 mt-1"><strong>Booking:</strong> Book doctor appointments, assign consult fees.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                <p className="text-xs text-gray-600 mt-1"><strong>Consultation:</strong> Doctor enters diagnoses, prescribes medicines, schedules follow-ups.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                <p className="text-xs text-gray-600 mt-1"><strong>Billing:</strong> Generate combined invoices for appointments, pharmacy sales, and tests.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-teal-700 font-bold uppercase tracking-wider">Automated Tasks</p>
            <p className="text-xs text-gray-500 mt-1">System background scheduler scans and logs follow-up reminders automatically for patients scheduled to visit soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpdDashboard;
