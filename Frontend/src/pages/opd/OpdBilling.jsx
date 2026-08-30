import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdBilling = () => {
  const location = useLocation();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [medicinesCatalog, setMedicinesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [printBill, setPrintBill] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);

  // Selected patient for new bill
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [consultationFee, setConsultationFee] = useState(0);
  
  // Custom items to add to the invoice
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  // Dropdown temporary choices
  const [tempTestId, setTempTestId] = useState('');
  const [tempMedicineId, setTempMedicineId] = useState('');
  const [tempMedicineQty, setTempMedicineQty] = useState(1);
  const [tempMedicinePrice, setTempMedicinePrice] = useState('');

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };

      // Load bills
      const billsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/billing', { headers });
      setBills(billsRes.data);

      // Load patients
      const patientsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients', { headers });
      setPatients(patientsRes.data);

      // Load tests catalog
      const testsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests', { headers });
      setTestsCatalog(testsRes.data);

      // Load medicines catalog
      const medsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/medicines', { headers });
      setMedicinesCatalog(medsRes.data);
    } catch (err) {
      console.error('Error loading billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Pre-fill patient and consultation fee if navigated from Appointments page
  useEffect(() => {
    if (location.state?.patientId) {
      setSelectedPatientId(location.state.patientId);
    }
    if (location.state?.consultationFee !== undefined) {
      setConsultationFee(location.state.consultationFee);
    }
  }, [location.state]);

  // Live-refresh the invoice audit log when any bill is generated, edited or deleted
  useOpdSocketEvent('opd:bill', fetchData);

  // If patient changes, check if they have a pending appointment or consultation fee to autofill
  const handlePatientChange = async (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);
    setConsultationFee(0);
    setSelectedTests([]);
    setSelectedMedicines([]);

    if (!patientId) return;

    try {
      const headers = { 'x-user-id': userId };
      const apptsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
      const patientAppts = apptsRes.data.filter(a => a.patientId?._id === patientId && a.status === 'Completed');
      
      if (patientAppts.length > 0) {
        setConsultationFee(patientAppts[0].consultationFee);
      }
    } catch (err) {
      console.error('Error searching patient appts:', err);
    }
  };

  // Add test to current invoice
  const addTestToInvoice = () => {
    if (!tempTestId) return;
    const testItem = testsCatalog.find(t => t._id === tempTestId);
    if (!testItem) return;

    // Check if already added
    if (selectedTests.find(t => t.testId === testItem._id)) {
      alert('Test already added to invoice');
      return;
    }

    setSelectedTests([...selectedTests, {
      testId: testItem._id,
      name: testItem.name,
      price: testItem.price,
      scheduledDate: new Date().toISOString().substring(0, 10),
      notes: ''
    }]);
    setTempTestId('');
  };

  // Add medicine to current invoice
  const addMedicineToInvoice = () => {
    if (!tempMedicineId) return;
    const medItem = medicinesCatalog.find(m => m._id === tempMedicineId);
    if (!medItem) return;

    const parsedPrice = tempMedicinePrice !== '' ? parseFloat(tempMedicinePrice) : parseFloat(medItem.price || 0);

    // Check if already added (if so, increment quantity and update price)
    const existing = selectedMedicines.find(m => m.medicineId === medItem._id);
    if (existing) {
      setSelectedMedicines(selectedMedicines.map(m => 
        m.medicineId === medItem._id ? { ...m, price: parsedPrice, quantity: m.quantity + parseInt(tempMedicineQty) } : m
      ));
    } else {
      setSelectedMedicines([...selectedMedicines, {
        medicineId: medItem._id,
        name: medItem.name,
        price: parsedPrice,
        quantity: parseInt(tempMedicineQty)
      }]);
    }

    setTempMedicineId('');
    setTempMedicineQty(1);
    setTempMedicinePrice('');
  };

  const removeTest = (testId) => {
    setSelectedTests(selectedTests.filter(t => t.testId !== testId));
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.medicineId !== medicineId));
  };

  const handlePrintBill = (bill) => {
    setPrintBill(bill);
  };

  const handleStartEdit = (bill) => {
    setEditingBillId(bill._id);
    setSelectedPatientId(bill.patientId?._id || bill.patientId || '');
    setConsultationFee(bill.consultationFee || 0);
    setSelectedTests((bill.tests || []).map(t => ({
      testId: t.testId?._id || t.testId || t._id || t.id,
      name: t.name,
      price: t.price
    })));
    setSelectedMedicines((bill.medicines || []).map(m => ({
      medicineId: m.medicineId?._id || m.medicineId || m._id || m.id,
      name: m.name,
      price: m.price,
      quantity: m.quantity || 1
    })));
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBillId(null);
    setSelectedPatientId('');
    setConsultationFee(0);
    setSelectedTests([]);
    setSelectedMedicines([]);
    setError('');
  };

  // Calculate live summary
  const subtotalConsultation = parseFloat(consultationFee || 0);
  const subtotalTests = selectedTests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
  const subtotalMedicines = selectedMedicines.reduce((sum, m) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);
  const grandTotal = subtotalConsultation + subtotalTests + subtotalMedicines;

  const handleSaveBill = async (status = 'Pending') => {
    if (!selectedPatientId) {
      setError('Please select a patient.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const headers = { 'x-user-id': userId };

      const hasConsult = subtotalConsultation > 0;
      const hasTests = selectedTests.length > 0;
      const hasMedicines = selectedMedicines.length > 0;
      const componentCount = [hasConsult, hasTests, hasMedicines].filter(Boolean).length;

      let billingType = 'Combined';
      if (componentCount <= 1) {
        if (hasTests) billingType = 'Diagnostic';
        else if (hasMedicines) billingType = 'Pharmacy';
        else if (hasConsult) billingType = 'Consultation';
      }

      const payload = {
        patientId: selectedPatientId,
        consultationFee: subtotalConsultation,
        tests: selectedTests,
        medicines: selectedMedicines,
        billingType,
        status
      };

      if (editingBillId) {
        const res = await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/billing/${editingBillId}`, payload, { headers });
        setSuccess(`Invoice updated successfully!`);
        handleCancelEdit();
        fetchData();
        if (res.data.bill) {
          handlePrintBill(res.data.bill);
        }
      } else {
        const res = await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/billing', payload, { headers });
        setSuccess(`Invoice generated successfully in '${status}' state!`);
        setSelectedPatientId('');
        setConsultationFee(0);
        setSelectedTests([]);
        setSelectedMedicines([]);
        fetchData();
        if (res.data.bill) {
          handlePrintBill(res.data.bill);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this invoice? This will restore any reserved medicine stock.')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/billing/${billId}`, { headers });
      setSuccess('Invoice deleted successfully!');
      if (editingBillId === billId) {
        handleCancelEdit();
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting bill:', err);
      alert(err.response?.data?.message || 'Error deleting invoice');
    }
  };

  const handlePayBill = async (billId) => {
    if (!confirm('Mark this invoice as Paid? This process cannot be undone.')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/billing/${billId}/pay`, {}, { headers });
      fetchData();
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error updating payment status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">OPD Billing & Invoices</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Generate clinical consultation bills, scheduled diagnostic bills, and pharmacy invoices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Invoice / Checkout */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-teal-950 font-literata">
                {editingBillId ? 'Edit Patient Invoice' : 'Generate Patient Combined Invoice'}
              </h3>
              {editingBillId && (
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                  Currently modifying invoice #{editingBillId.slice(-6).toUpperCase()}
                </p>
              )}
            </div>
            {editingBillId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>

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

          <div className="space-y-6">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Select Patient *
              </label>
              <select
                value={selectedPatientId}
                onChange={handlePatientChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all text-sm font-medium"
              >
                <option value="">-- Choose Registered Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.phone || 'No phone'}) - {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Consultation Fee */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all text-sm font-mono font-medium"
                placeholder="0.00"
              />
            </div>

            {/* Add Diagnostics Line Items */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Add Diagnostic Test
              </label>
              <div className="flex gap-2">
                <select
                  value={tempTestId}
                  onChange={(e) => setTempTestId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium"
                >
                  <option value="">-- Select Test from Catalog --</option>
                  {testsCatalog.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} (₹{t.price}) - {t.category || 'General'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addTestToInvoice}
                  className="px-4 py-2.5 bg-teal-50 text-[#0D9488] border border-teal-100 rounded-xl font-semibold text-xs hover:bg-teal-100/50 cursor-pointer flex-shrink-0"
                >
                  + Add Test
                </button>
              </div>
            </div>

            {/* Add Pharmacy Line Items */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Add Pharmacy Medicine
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={tempMedicineId}
                  onChange={(e) => {
                    setTempMedicineId(e.target.value);
                    const found = medicinesCatalog.find(m => m._id === e.target.value);
                    if (found) setTempMedicinePrice(found.price || 0);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium"
                >
                  <option value="">-- Select Medicine --</option>
                  {medicinesCatalog.map(m => (
                    <option key={m._id} value={m._id} disabled={m.stock <= 0}>
                      {m.name} ({m.strength}) - Stock: {m.stock} {m.stock <= 0 ? '(Out of Stock)' : ''}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tempMedicineQty}
                    onChange={(e) => setTempMedicineQty(e.target.value)}
                    placeholder="Qty"
                    className="w-16 px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-center font-medium"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tempMedicinePrice}
                    onChange={(e) => setTempMedicinePrice(e.target.value)}
                    placeholder="Price ₹"
                    className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-center font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={addMedicineToInvoice}
                    className="px-4 py-2.5 bg-teal-50 text-[#0D9488] border border-teal-100 rounded-xl font-semibold text-xs hover:bg-teal-100/50 cursor-pointer flex-shrink-0"
                  >
                    + Add Medicine
                  </button>
                </div>
              </div>
            </div>

            {/* Current Invoice Summary Layout */}
            {(selectedTests.length > 0 || selectedMedicines.length > 0 || subtotalConsultation > 0) && (
              <div className="border-t border-teal-100 pt-6 mt-6 bg-teal-50/20 rounded-2xl p-5 border border-dashed border-teal-100">
                <h4 className="text-sm font-bold text-teal-950 mb-3 uppercase tracking-wide">Live Checkout Sheet</h4>
                
                <div className="space-y-2 text-xs text-gray-700">
                  {subtotalConsultation > 0 && (
                    <div className="flex justify-between py-1 border-b border-teal-100/10">
                      <span>Doctor Consultation Fee</span>
                      <span className="font-mono font-semibold">₹{subtotalConsultation.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedTests.map((t, idx) => (
                    <div key={`sel-t-${t.testId || t._id || t.id || idx}-${idx}`} className="py-2 border-b border-teal-100/10 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                          <button onClick={() => removeTest(t.testId)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">×</button>
                          🧪 {t.name}
                        </span>
                        <span className="font-mono font-semibold">₹{t.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-4 text-[11px] text-gray-500">
                        <label className="flex items-center gap-1">
                          <span>📅 Schedule:</span>
                          <input
                            type="date"
                            value={t.scheduledDate ? t.scheduledDate.substring(0, 10) : ''}
                            onChange={(e) => {
                              const updated = [...selectedTests];
                              updated[idx] = { ...updated[idx], scheduledDate: e.target.value };
                              setSelectedTests(updated);
                            }}
                            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 bg-white"
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Note (e.g. Fasting, Urgent)"
                          value={t.notes || ''}
                          onChange={(e) => {
                            const updated = [...selectedTests];
                            updated[idx] = { ...updated[idx], notes: e.target.value };
                            setSelectedTests(updated);
                          }}
                          className="flex-1 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 bg-white"
                        />
                      </div>
                    </div>
                  ))}

                  {selectedMedicines.map((m, idx) => (
                    <div key={`sel-m-${m.medicineId || m._id || m.id || idx}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-teal-100/10 gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <button onClick={() => removeMedicine(m.medicineId)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">×</button>
                        Pharmacy: {m.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <span>Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={m.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setSelectedMedicines(selectedMedicines.map(item =>
                                item.medicineId === m.medicineId ? { ...item, quantity: qty } : item
                              ));
                            }}
                            className="w-12 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-center text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <span>Price (₹):</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={m.price}
                            onChange={(e) => {
                              const pr = parseFloat(e.target.value) || 0;
                              setSelectedMedicines(selectedMedicines.map(item =>
                                item.medicineId === m.medicineId ? { ...item, price: pr } : item
                              ));
                            }}
                            className="w-20 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-center text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <span className="font-mono font-semibold text-teal-950 w-28 text-right">
                          ₹{((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center text-sm font-bold text-teal-950 pt-3 mt-3 border-t border-teal-200/50">
                    <span>Invoice Grand Total</span>
                    <span className="font-mono text-lg text-teal-800">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  {editingBillId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                    >
                      Discard Changes
                    </button>
                  )}
                  <button
                    onClick={() => handleSaveBill('Pending')}
                    disabled={submitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                  >
                    {editingBillId ? 'Save (Pending)' : 'Draft Invoice (Pending)'}
                  </button>
                  <button
                    onClick={() => handleSaveBill('Paid')}
                    disabled={submitting}
                    className="flex-1 bg-[#0D9488] hover:bg-[#0f766e] text-white py-3 rounded-xl font-semibold transition-all shadow-sm cursor-pointer text-sm"
                  >
                    {editingBillId ? 'Save & Mark Paid' : 'Checkout (Mark Paid)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions / Bills List */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Invoices Audit Logs</h3>

          {loading ? (
            <div className="flex items-center justify-center min-h-[150px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No transaction bills generated.</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
              {bills.map((bill) => (
                <div key={bill._id} className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-xs">{bill.patientId?.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Date: {new Date(bill.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      bill.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {bill.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1">
                    {bill.consultationFee > 0 && (
                      <div className="flex justify-between">
                        <span>Consult Fee:</span>
                        <span>₹{parseFloat(bill.consultationFee).toFixed(2)}</span>
                      </div>
                    )}
                    {bill.tests && bill.tests.length > 0 && (
                      <div className="flex justify-between">
                        <span>Diagnostics ({bill.tests.length}):</span>
                        <span>₹{bill.tests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0).toFixed(2)}</span>
                      </div>
                    )}
                    {bill.medicines && bill.medicines.length > 0 && (
                      <div className="flex justify-between">
                        <span>Medicines ({bill.medicines.reduce((sum, m) => sum + (parseInt(m.quantity) || 1), 0)}):</span>
                        <span>₹{bill.medicines.reduce((sum, m) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-teal-950 pt-1.5 border-t border-slate-200/50">
                      <span>Total Amount:</span>
                      <span>₹{parseFloat(bill.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3.5 pt-2 border-t border-slate-200/40">
                    {bill.status === 'Pending' && (
                      <button
                        onClick={() => handlePayBill(bill._id)}
                        className="flex-1 min-w-[70px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer text-center border border-emerald-200/60"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(bill)}
                      className="flex-1 min-w-[50px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer text-center border border-amber-200/60"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill._id)}
                      className="min-w-[32px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-2 rounded-xl text-[10px] transition-all cursor-pointer text-center border border-rose-200/60"
                      title="Delete Invoice"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className={`flex-1 min-w-[80px] font-bold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer text-center border ${
                        bill.status === 'Paid'
                          ? 'bg-[#0D9488] hover:bg-[#0f766e] text-white border-transparent'
                          : 'bg-slate-100 hover:bg-slate-200 text-gray-700 border-slate-200'
                      }`}
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal Overlay */}
      {printBill && (
        <div className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-teal-50 p-6 space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-teal-950 font-literata">OPD Medical Invoice</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Invoice ID: {printBill._id}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Patient:</span>
                <span className="font-semibold text-teal-950">{printBill.patientId?.name || 'Patient'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="font-mono text-gray-600">{printBill.patientId?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span>{new Date(printBill.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-bold ${printBill.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                  {printBill.status.toUpperCase()}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                <p className="font-bold text-gray-500 uppercase tracking-wide text-[10px] mb-2">Itemized Breakdown</p>
                <div className="space-y-1.5">
                  {printBill.consultationFee > 0 && (
                    <div className="flex justify-between">
                      <span>Doctor Consultation Fee</span>
                      <span className="font-mono font-semibold">₹{parseFloat(printBill.consultationFee).toFixed(2)}</span>
                    </div>
                  )}
                  {printBill.tests && printBill.tests.map(t => (
                    <div key={t.testId || t._id} className="flex justify-between">
                      <span>Diagnostic: {t.name}</span>
                      <span className="font-mono font-semibold">₹{parseFloat(t.price || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {printBill.medicines && printBill.medicines.map(m => (
                    <div key={m.medicineId || m._id} className="flex justify-between">
                      <span>Pharmacy: {m.name} × {m.quantity || 1}</span>
                      <span className="font-mono font-semibold">₹{((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3 mt-3 text-sm font-bold text-teal-950">
                <span>Grand Total Amount:</span>
                <span className="text-base text-teal-800">₹{parseFloat(printBill.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              <button
                onClick={() => setPrintBill(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-5 rounded-xl transition-all cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdBilling;
