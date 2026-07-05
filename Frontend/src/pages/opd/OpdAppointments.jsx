import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdAppointments = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    consultationFee: '50' // default fee
  });

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  // Pre-select patient if navigating from the Patients list "Book Consult"
  useEffect(() => {
    if (routerLocation.state?.patient) {
      setFormData(prev => ({
        ...prev,
        patientId: routerLocation.state.patient._id
      }));
    }
  }, [routerLocation.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      
      // Load patients for the selector
      const patientsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients', { headers });
      setPatients(patientsRes.data);

      // Load registered doctors for the selector
      const doctorsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/staff/doctors', { headers });
      setDoctors(doctorsRes.data);

      // Load appointments list
      const appointmentsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
      setAppointments(appointmentsRes.data);
    } catch (err) {
      console.error('Error fetching appointment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Live-refresh the board when any staff member books/updates an appointment.
  useOpdSocketEvent('opd:appointment', fetchData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const headers = { 'x-user-id': userId };
      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', formData, { headers });
      
      setSuccess('Appointment booked successfully! Pending bill generated.');
      setFormData({
        patientId: '',
        doctorId: '',
        doctorName: '',
        appointmentDate: '',
        consultationFee: '50'
      });
      fetchData(); // reload
    } catch (err) {
      setError(err.response?.data?.message || 'Error booking appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/appointments/${id}/status`, { status }, { headers });
      fetchData(); // reload
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Error updating status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Appointments Booking</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Schedule patient visits for doctor consultations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Appointment Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Schedule Consultant Visit</h3>

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Select Patient *</label>
              <select
                required
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Doctor *</label>
              {doctors.length > 0 ? (
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => {
                    const doc = doctors.find(d => d._id === e.target.value);
                    setFormData({ ...formData, doctorId: e.target.value, doctorName: doc ? doc.name : '' });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                  placeholder="Dr. Watson"
                />
              )}
              {doctors.length === 0 && (
                <p className="text-[10px] text-gray-400 mt-1">No doctors found yet — in Roles &amp; Staff, assign a staff member a role named "Doctor" (or tick the Doctor checkbox) to enable this dropdown.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Consultation Fee *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Appointment Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-xs text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {submitting ? 'Scheduling...' : 'Book Appointment'}
            </button>
          </form>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Schedules & Calendar</h3>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No appointments scheduled yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[720px] text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Date / Time</th>
                    <th className="pb-3">Fee</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 pr-2 font-semibold text-gray-900">
                        {appt.patientId?.name}
                      </td>
                      <td className="py-3.5 pr-2 text-teal-800 font-medium">
                        {appt.doctorName}
                      </td>
                      <td className="py-3.5 pr-2 text-gray-600 text-xs">
                        {new Date(appt.appointmentDate).toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-2 font-mono text-gray-600">
                        ${appt.consultationFee}
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          appt.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          appt.status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right flex justify-end gap-1.5">
                        {appt.status === 'Scheduled' && (
                          <>
                            {hasPermission('manage_consultations') && (
                              <button
                                onClick={() => navigate('/opd/consultations', { state: { appt } })}
                                className="bg-teal-50 text-[#0D9488] hover:bg-teal-100 text-xs py-1 px-2.5 rounded-lg border border-teal-100 cursor-pointer font-semibold"
                              >
                                Consult
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(appt._id, 'Cancelled')}
                              className="bg-red-50 text-red-600 hover:bg-red-100 text-xs py-1 px-2.5 rounded-lg border border-red-100 cursor-pointer font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpdAppointments;
