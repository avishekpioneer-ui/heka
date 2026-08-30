import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';
import PrescriptionPdfModal from '../../components/opd/PrescriptionPdfModal';

const QUICK_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Blood Sugar Fasting (FBS)',
  'Blood Sugar PP (PPBS)',
  'HbA1c',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Chest X-Ray PA View',
  'ECG (12 Lead)',
  'Urine Routine & Micro',
  'Thyroid Profile (T3/T4/TSH)',
  'Serum Creatinine',
  'Serum Electrolytes',
  'Ultrasound Whole Abdomen'
];

const OpdConsultations = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePdfConsultation, setActivePdfConsultation] = useState(null);

  // Selected appointment details
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState([
    { medicineName: '', dosage: '1-0-1', duration: '5 days' }
  ]);
  const [tests, setTests] = useState([]);
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

      // Load registered diagnostic tests catalog
      const testsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests', { headers });
      setTestsList(testsRes.data);

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

  // ── Tests Handlers ──
  const handleTestChange = (index, field, value) => {
    const updated = [...tests];
    updated[index][field] = value;
    setTests(updated);
  };

  const addTestRow = () => {
    setTests([...tests, { testName: '', notes: '' }]);
  };

  const removeTestRow = (index) => {
    const updated = tests.filter((_, i) => i !== index);
    setTests(updated);
  };

  const handleAddQuickTest = (testName) => {
    const exists = tests.some(t => t.testName.toLowerCase() === testName.toLowerCase());
    if (exists) return;
    setTests([...tests, { testName, notes: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) {
      setError('Please select an active scheduled appointment.');
      return;
    }

    const validPrescriptions = prescription.filter(p => p.medicineName.trim() !== '');
    const validTests = tests.filter(t => t.testName && t.testName.trim() !== '');

    if (validPrescriptions.length === 0 && !diagnosis.trim() && validTests.length === 0) {
      setError('Please add at least a clinical diagnosis, 1 prescribed medicine, or recommended test.');
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
        prescription: validPrescriptions,
        tests: validTests,
        followUpDate: followUpDate || null
      };

      const res = await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/consultations', payload, { headers });

      setSuccess('Consultation completed successfully! Prescription generated.');
      
      const createdCons = res.data?.consultation || {
        ...payload,
        patientId: selectedAppt.patientId,
        createdAt: new Date().toISOString()
      };
      setActivePdfConsultation(createdCons);

      // Reset form
      setSelectedAppt(null);
      setSymptoms('');
      setDiagnosis('');
      setPrescription([{ medicineName: '', dosage: '1-0-1', duration: '5 days' }]);
      setTests([]);
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
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold flex items-center justify-between">
              <span>{success}</span>
              {activePdfConsultation && (
                <button
                  type="button"
                  onClick={() => setActivePdfConsultation(activePdfConsultation)}
                  className="text-xs bg-[#0b4d3c] text-white px-3 py-1.5 rounded-lg hover:bg-[#08382b] transition-all cursor-pointer font-bold"
                >
                  📄 View / Print PDF
                </button>
              )}
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase">Select Scheduled Appointment *</label>
                {selectedAppt && (
                  <button
                    type="button"
                    onClick={() => setSelectedAppt(null)}
                    className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                  >
                    Clear / Change
                  </button>
                )}
              </div>
              <select
                value={selectedAppt?._id || ''}
                onChange={handleSelectAppointmentChange}
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

            {/* Selected Patient Banner */}
            {selectedAppt && (
              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl flex flex-wrap gap-4 items-center justify-between text-xs text-teal-900">
                <div>
                  <span className="font-semibold text-teal-950 block text-sm">{selectedAppt.patientId?.name}</span>
                  <span className="text-teal-700">Phone: {selectedAppt.patientId?.phone || 'N/A'} • Age: {selectedAppt.patientId?.age || 'N/A'} • Gender: {selectedAppt.patientId?.gender || 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-semibold block text-teal-950">Dr. {selectedAppt.doctorName}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Chief Symptoms / Complaints</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild fever, persistent dry cough for 3 days..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Clinical Diagnosis (Dx) *</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                />
              </div>
            </div>

            {/* Prescription Editor */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-600 uppercase">Digital Prescription Details</label>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span> Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {prescription.map((rx, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex-1 w-full relative">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Paracetamol 650mg)"
                        value={rx.medicineName}
                        onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800 font-medium"
                        list={`med-list-${index}`}
                      />
                      <datalist id={`med-list-${index}`}>
                        {medicinesList.map(m => (
                          <option key={m._id} value={`${m.name} (${m.strength})`} />
                        ))}
                      </datalist>
                    </div>

                    <div className="w-full sm:w-44">
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1-0-1)"
                        value={rx.dosage}
                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                        list={`dosage-list-${index}`}
                      />
                      <datalist id={`dosage-list-${index}`}>
                        <option value="1-0-1 (Morning & Night)" />
                        <option value="1-1-1 (Thrice Daily)" />
                        <option value="1-0-0 (Morning only)" />
                        <option value="0-0-1 (Night only)" />
                        <option value="1-0-0-1 (Four times)" />
                        <option value="SOS (As Needed)" />
                        <option value="Before Meals (AC)" />
                        <option value="After Meals (PC)" />
                      </datalist>
                    </div>

                    <div className="w-full sm:w-36 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        value={rx.duration}
                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                        list={`duration-list-${index}`}
                      />
                      <datalist id={`duration-list-${index}`}>
                        <option value="3 days" />
                        <option value="5 days" />
                        <option value="7 days" />
                        <option value="10 days" />
                        <option value="14 days" />
                        <option value="1 month" />
                        <option value="2 months" />
                      </datalist>

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

            {/* Recommended Tests Editor */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase">Recommended Lab & Diagnostic Tests (🔬)</label>
                  <p className="text-[11px] text-gray-400">Order pathology, radiology, or cardiology investigations for this visit</p>
                </div>
                <button
                  type="button"
                  onClick={addTestRow}
                  className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span> Add Test
                </button>
              </div>

              {/* Quick Test Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_TESTS.map((tName) => {
                  const isAdded = tests.some(t => t.testName.toLowerCase() === tName.toLowerCase());
                  return (
                    <button
                      key={tName}
                      type="button"
                      onClick={() => handleAddQuickTest(tName)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {isAdded ? `✓ ${tName}` : `+ ${tName}`}
                    </button>
                  );
                })}
              </div>

              {tests.length === 0 ? (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <p className="text-xs text-gray-400">No tests added. Click quick test badges above or "+ Add Test" button.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tests.map((tItem, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 w-full relative">
                        <input
                          type="text"
                          placeholder="Test name (e.g. Complete Blood Count / Chest X-Ray)"
                          value={tItem.testName}
                          onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 font-medium"
                          list={`test-list-${index}`}
                        />
                        <datalist id={`test-list-${index}`}>
                          {testsList.map(t => (
                            <option key={t._id} value={t.name} />
                          ))}
                        </datalist>
                      </div>

                      <div className="w-full sm:w-64 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Instructions (e.g. Fasting 10 hrs / Stat)"
                          value={tItem.notes}
                          onChange={(e) => handleTestChange(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                        />

                        <button
                          type="button"
                          onClick={() => removeTestRow(index)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer flex-shrink-0"
                          aria-label="Remove test row"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              className="w-full bg-[#0b4d3c] hover:bg-[#08382b] text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm tracking-wide"
            >
              {submitting ? 'Prescribing & Generating PDF...' : '💾 Finalize & Issue Digital Prescription (PDF)'}
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
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{cons.patientId?.name || cons.patientName || 'Patient'}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Diagnosed by: <span className="font-medium text-teal-800">Dr. {cons.doctorName}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-gray-400">
                        {new Date(cons.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePdfConsultation(cons)}
                        className="bg-[#0b4d3c] hover:bg-[#08382b] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>📄 PDF</span>
                      </button>
                    </div>
                  </div>
                  
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

                  {cons.tests && cons.tests.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase font-bold text-emerald-700">🔬 Recommended Tests:</p>
                      <ul className="list-disc pl-4 text-xs text-emerald-800 mt-1">
                        {cons.tests.map((t, idx) => (
                          <li key={idx}>
                            {typeof t === 'string' ? t : (t.testName || t.name)}{t.notes ? ` (${t.notes})` : ''}
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

      {/* Prescription PDF Modal Preview & Print Dialog */}
      {activePdfConsultation && (
        <PrescriptionPdfModal
          consultation={activePdfConsultation}
          onClose={() => setActivePdfConsultation(null)}
        />
      )}
    </div>
  );
};

export default OpdConsultations;
