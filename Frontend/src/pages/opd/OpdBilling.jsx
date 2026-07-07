import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdBilling = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [medicinesCatalog, setMedicinesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [printBill, setPrintBill] = useState(null);

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

  // Live-refresh the invoice audit log when any bill is generated or paid.
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
      // Find if they have any pending consultation bills we can merge or get consultation fee from recent appts
      const headers = { 'x-user-id': userId };
      const apptsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
      const patientAppts = apptsRes.data.filter(a => a.patientId?._id === patientId && a.status === 'Completed');
      
      if (patientAppts.length > 0) {
        // Use fee from recent appointment
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
      price: testItem.price
    }]);
    setTempTestId('');
  };

  // Add medicine to current invoice
  const addMedicineToInvoice = () => {
    if (!tempMedicineId) return;
    const medItem = medicinesCatalog.find(m => m._id === tempMedicineId);
    if (!medItem) return;

    const parsedPrice = parseFloat(tempMedicinePrice) || 0;

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
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculate live summary
  const subtotalConsultation = parseFloat(consultationFee || 0);
  const subtotalTests = selectedTests.reduce((sum, t) => sum + parseFloat(t.price), 0);
  const subtotalMedicines = selectedMedicines.reduce((sum, m) => sum + parseFloat(m.price || 0), 0);
  const grandTotal = subtotalConsultation + subtotalTests + subtotalMedicines;

  const handleCreateBill = async (status = 'Pending') => {
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

      const res = await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/billing', payload, { headers });
      
      setSuccess(`Invoice generated successfully in '${status}' state!`);
      setSelectedPatientId('');
      setConsultationFee(0);
      setSelectedTests([]);
      setSelectedMedicines([]);
      fetchData(); // reload
      
      if (res.data.bill) {
        handlePrintBill(res.data.bill);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBill = async (billId) => {
    if (!confirm('Mark this invoice as Paid? This process cannot be undone.')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/billing/${billId}/pay`, {}, { headers });
      fetchData(); // reload
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
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Generate Patient Combined Invoice</h3>

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
            {/* Step 1: Patient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Step 2: Add Diagnostic Test */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Add Diagnostic Tests to Bill</label>
              <div className="flex gap-2">
                <select
                  value={tempTestId}
                  onChange={(e) => setTempTestId(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-xs text-gray-800"
                >
                  <option value="">-- Choose Laboratory Test --</option>
                  {testsCatalog.map(t => (
                    <option key={t._id} value={t._id}>{t.name} (₹{t.price})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addTestToInvoice}
                  className="px-4 py-2.5 bg-teal-50 text-[#0D9488] border border-teal-100 rounded-xl font-semibold text-xs hover:bg-teal-100/50 cursor-pointer"
                >
                  + Add Test
                </button>
              </div>
            </div>

            {/* Step 3: Add Pharmacy Medicine */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Add Pharmacy Medicines to Invoice</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={tempMedicineId}
                  onChange={(e) => setTempMedicineId(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-xs text-gray-800"
                >
                  <option value="">-- Choose Stock Medicine --</option>
                  {medicinesCatalog.map(m => (
                    <option key={m._id} value={m._id} disabled={m.stock <= 0}>
                      {m.name} — {m.stock > 0 ? `${m.stock} in stock` : 'Out of stock'}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tempMedicineQty}
                    onChange={(e) => setTempMedicineQty(e.target.value)}
                    className="w-20 px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-xs text-gray-800"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tempMedicinePrice}
                    onChange={(e) => setTempMedicinePrice(e.target.value)}
                    className="w-24 px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-xs text-gray-800"
                    placeholder="Price (₹)"
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

                  {selectedTests.map(t => (
                    <div key={t.testId} className="flex justify-between py-1 border-b border-teal-100/10">
                      <span className="flex items-center gap-1.5">
                        <button onClick={() => removeTest(t.testId)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">×</button>
                        Diagnostic: {t.name}
                      </span>
                      <span className="font-mono font-semibold">₹{t.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {selectedMedicines.map(m => (
                    <div key={m.medicineId} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-teal-100/10 gap-2">
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
                        <span className="font-mono font-semibold text-teal-950 w-24 text-right">
                          ₹{(parseFloat(m.price) || 0).toFixed(2)}
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
                  <button
                    onClick={() => handleCreateBill('Pending')}
                    disabled={submitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                  >
                    Draft Invoice (Pending)
                  </button>
                  <button
                    onClick={() => handleCreateBill('Paid')}
                    disabled={submitting}
                    className="flex-1 bg-[#0D9488] hover:bg-[#0f766e] text-white py-3 rounded-xl font-semibold transition-all shadow-sm cursor-pointer text-sm"
                  >
                    Checkout (Mark Paid)
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
                        <span>₹{bill.consultationFee}</span>
                      </div>
                    )}
                    {bill.tests && bill.tests.length > 0 && (
                      <div className="flex justify-between">
                        <span>Diagnostics ({bill.tests.length}):</span>
                        <span>₹{bill.tests.reduce((sum, t) => sum + t.price, 0)}</span>
                      </div>
                    )}
                    {bill.medicines && bill.medicines.length > 0 && (
                      <div className="flex justify-between">
                        <span>Medicines ({bill.medicines.reduce((sum, m) => sum + m.quantity, 0)}):</span>
                        <span>₹{bill.medicines.reduce((sum, m) => sum + parseFloat(m.price || 0), 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-teal-950 pt-1.5 border-t border-slate-200/50">
                      <span>Total Amount:</span>
                      <span>₹{bill.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3.5">
                    {bill.status === 'Pending' && (
                      <button
                        onClick={() => handlePayBill(bill._id)}
                        className="flex-1 bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all cursor-pointer text-center border border-teal-100/50"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className={`flex-1 font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all cursor-pointer text-center border ${
                        bill.status === 'Paid'
                          ? 'bg-[#0D9488] hover:bg-[#0f766e] text-white border-transparent'
                          : 'bg-slate-100 hover:bg-slate-200 text-gray-700 border-slate-200'
                      }`}
                    >
                      Print Slip / PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Printable Invoice wrapper */}
      {printBill && (
        <div id="printable-invoice" style={{ display: 'none' }}>
          <div style={{ fontFamily: 'monospace', padding: '30px', maxWidth: '600px', margin: '0 auto', border: '1px dashed #000' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: '0', fontSize: '20px', letterSpacing: '1px' }}>HEKA MEDICAL CENTER</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>OPD Medical Invoice / Bill Receipt</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#555' }}>Invoice ID: {printBill._id}</p>
            </div>

            <div style={{ borderBottom: '1px dashed #000', marginBottom: '15px' }}></div>

            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', lineHeight: '2' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', width: '35%' }}>Patient Name:</td>
                  <td>{printBill.patientId?.name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Phone Number:</td>
                  <td>{printBill.patientId?.phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Date:</td>
                  <td>{new Date(printBill.createdAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Status:</td>
                  <td style={{ fontWeight: 'bold', color: printBill.status === 'Paid' ? 'green' : 'orange' }}>
                    {printBill.status.toUpperCase()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed #000', marginTop: '15px', marginBottom: '15px' }}></div>

            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase' }}>Billed Items</h4>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ paddingBottom: '5px' }}>Item Description</th>
                  <th style={{ paddingBottom: '5px', textAlign: 'center' }}>Qty</th>
                  <th style={{ paddingBottom: '5px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printBill.consultationFee > 0 && (
                  <tr>
                    <td style={{ padding: '5px 0' }}>Doctor Consultation Fee</td>
                    <td style={{ padding: '5px 0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>₹{printBill.consultationFee.toFixed(2)}</td>
                  </tr>
                )}
                {printBill.tests && printBill.tests.map(t => (
                  <tr key={t.testId}>
                    <td style={{ padding: '5px 0' }}>Diagnostic: {t.name}</td>
                    <td style={{ padding: '5px 0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>₹{t.price.toFixed(2)}</td>
                  </tr>
                ))}
                {printBill.medicines && printBill.medicines.map(m => (
                  <tr key={m.medicineId}>
                    <td style={{ padding: '5px 0' }}>Pharmacy: {m.name}</td>
                    <td style={{ padding: '5px 0', textAlign: 'center' }}>{m.quantity}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>₹{m.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed #000', marginTop: '15px', marginBottom: '15px' }}></div>

            <table style={{ width: '100%', fontSize: '14px', fontWeight: 'bold' }}>
              <tbody>
                <tr>
                  <td>Total Invoice Amount:</td>
                  <td style={{ textAlign: 'right' }}>₹{printBill.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed #000', marginTop: '15px', marginBottom: '15px' }}></div>

            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              <p style={{ margin: '0' }}>Thank you for visiting Heka Medical Center.</p>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Get well soon!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdBilling;
