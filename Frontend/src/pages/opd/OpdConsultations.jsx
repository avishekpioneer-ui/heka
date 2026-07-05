import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdConsultations = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected appointment details
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState([
    { medicineName: '', dosage: '1-0-1', duration: '5 days' }
  ]);
  const [followUpDate, setFollowUpDate] = useState('');

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  // Pre-fill active consultation if redirected from dashboard or appointments screen
  useEffect(() => {
    if (routerLocation.state?.appt) {
      const appt = routerLocation.state.appt;
      setSelectedAppt(appt);
    }
  }, [routerLocation.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };

      // Load scheduled appointments for doctor dropdown
      const apptsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
      const activeAppts = apptsRes.data.filter(a => a.status === 'Scheduled');
      setAppointments(activeAppts);

      // Load medicines database for prescription autocomplete/selector
      const medsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/medicines', { headers });
      setMedicinesList(medsRes.data);

      // Load clinical consultation history logs
      const consultsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/consultations', { headers });
      setConsultations(consultsRes.data);
    } catch (err) {
      console.error('Error loading consultation parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Keep the active-appointment dropdown and case log history live.
  useOpdSocketEvent('opd:appointment', fetchData);
  useOpdSocketEvent('opd:consultation', fetchData);

  const handleSelectAppointmentChange = (e) => {
    const apptId = e.target.value;
    const appt = appointments.find(a => a._id === apptId);
    setSelectedAppt(appt || null);
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescription];
    updated[index][field] = value;
    setPrescription(updated);
  };

  const addPrescriptionRow = () => {
    setPrescription([...prescription, { medicineName: '', dosage: '1-0-1', duration: '5 days' }]);
  };

  const removePrescriptionRow = (index) => {
    if (prescription.length === 1) return;
    const updated = prescription.filter((_, i) => i !== index);
    setPrescription(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) {
      setError('Please select an active scheduled appointment.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const headers = { 'x-user-id': userId };
      
      const payload = {
        appointmentId: selectedAppt._id,
        patientId: selectedAppt.patientId?._id || selectedAppt.patientId,
        doctorId: selectedAppt.doctorId || undefined,
        doctorName: selectedAppt.doctorName,
        symptoms,
        diagnosis,
        prescription: prescription.filter(p => p.medicineName.trim() !== ''),
        followUpDate: followUpDate || null
      };

      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/consultations', payload, { headers });

      setSuccess('Consultation completed successfully! Prescription saved, appointment updated.');
      
      // Reset form
      setSelectedAppt(null);
      setSymptoms('');
      setDiagnosis('');
      setPrescription([{ medicineName: '', dosage: '1-0-1', duration: '5 days' }]);
      setFollowUpDate('');
      
      fetchData(); // reload lists
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving consultation details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Doctor Workspace</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Perform patient diagnosis, digital prescribing, and clinical history logging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Consultation Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Active Consultation Form</h3>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Select Scheduled Appointment *</label>
              <select
                value={selectedAppt?._id || ''}
                onChange={handleSelectAppointmentChange}
                disabled={routerLocation.state?.appt !== undefined}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
              >
                <option value="">-- Choose Active Appointment --</option>
                {selectedAppt && (
                  <option value={selectedAppt._id}>
                    {selectedAppt.patientId?.name} (Dr. {selectedAppt.doctorName})
                  </option>
                )}
                {appointments
                  .filter(a => a._id !== selectedAppt?._id)
                  .map(a => (
                    <option key={a._id} value={a._id}>
                      {a.patientId?.name} - Dr. {a.doctorName} ({new Date(a.appointmentDate).toLocaleString()})
                    </option>
                  ))
                }
              </select>
            </div>

            {selectedAppt && (
              <div className="bg-teal-50/40 rounded-xl p-4 border border-teal-50 grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Patient Name</p>
                  <p className="font-semibold text-teal-950">{selectedAppt.patientId?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Doctor In-Charge</p>
                  <p className="font-semibold text-teal-950">Dr. {selectedAppt.doctorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Patient Age / Gender</p>
                  <p className="font-semibold text-teal-950">{selectedAppt.patientId?.age} yrs / {selectedAppt.patientId?.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Consultation Fee</p>
                  <p className="font-semibold font-mono text-teal-950">${selectedAppt.consultationFee}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Symptoms / Chief Complaint</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows="2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800 resize-none"
                placeholder="Patient reports mild fever, cough, and throat irritation for 3 days."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Diagnosis Notes</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows="2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800 resize-none"
                placeholder="Acute Bronchitis, suspected viral infection."
              />
            </div>

            {/* Prescription Editor */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-gray-600 uppercase">Digital Prescription Details</label>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="text-xs text-[#0D9488] hover:text-[#0f766e] font-bold flex items-center gap-1 cursor-pointer"
                >
                  + Add Medicine
                </button>
              </div>

              <div className="space-y-2">
                {prescription.map((row, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-slate-50/60 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-gray-100 sm:border-0">
                    <div className="flex-1 min-w-0">
                      <select
                        value={row.medicineName}
                        onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800"
                      >
                        <option value="">-- Select Medicine --</option>
                        {medicinesList.map(m => (
                          <option key={m._id} value={m.name}>{m.name}</option>
                        ))}
                        {row.medicineName && !medicinesList.find(m => m.name === row.medicineName) && (
                          <option value={row.medicineName}>{row.medicineName}</option>
                        )}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 sm:w-28 sm:flex-none">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 1-0-1)"
                          value={row.dosage}
                          onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800"
                        />
                      </div>

                      <div className="flex-1 sm:w-28 sm:flex-none">
                        <input
                          type="text"
                          placeholder="Duration (e.g. 5 days)"
                          value={row.duration}
                          onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={prescription.length === 1}
                        onClick={() => removePrescriptionRow(index)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1 cursor-pointer flex-shrink-0"
                        aria-label="Remove medicine row"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Follow-up Date (If required)</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 text-xs bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedAppt}
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {submitting ? 'Prescribing...' : 'Finalize & Generate Digital Prescription'}
            </button>
          </form>
        </div>

        {/* History / Case Logs */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Recent Case Sheet Logs</h3>

          {loading ? (
            <div className="flex items-center justify-center min-h-[150px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No historical consultations recorded.</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[600px]">
              {consultations.map((cons) => (
                <div key={cons._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 text-sm">{cons.patientId?.name}</h4>
                    <span className="text-[10px] text-gray-400">
                      {new Date(cons.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Diagnosed by: <span className="font-medium text-teal-800">Dr. {cons.doctorName}</span></p>
                  
                  {cons.diagnosis && (
                    <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg text-gray-600 border border-slate-100">
                      <strong>Dx:</strong> {cons.diagnosis}
                    </div>
                  )}

                  {cons.prescription && cons.prescription.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Rx Medicines:</p>
                      <ul className="list-disc pl-4 text-xs text-gray-600 mt-1">
                        {cons.prescription.map((rx, idx) => (
                          <li key={idx}>
                            {rx.medicineName} ({rx.dosage} • {rx.duration})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cons.followUpDate && (
                    <div className="mt-2 text-[10px] font-bold text-teal-700 flex items-center gap-1">
                      <span>⏰ Follow-up:</span>
                      <span>{new Date(cons.followUpDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpdConsultations;
