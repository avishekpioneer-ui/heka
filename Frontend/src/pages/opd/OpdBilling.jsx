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
  const [consultationDiscount, setConsultationDiscount] = useState(0);
  const [consultationDiscountType, setConsultationDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
  
  // Follow-up Date and Note (OpdReminder)
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  
  // Custom items to add to the invoice
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  // Discount concession state
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' (₹) or 'percentage' (%)
  const [discountReason, setDiscountReason] = useState('');

  // Dropdown temporary choices
  const [tempTestId, setTempTestId] = useState('');
  const [tempMedicineId, setTempMedicineId] = useState('');
  const [tempMedicineQty, setTempMedicineQty] = useState(1);
  const [tempMedicinePrice, setTempMedicinePrice] = useState('');

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  const setPresetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().substring(0, 10));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };

      // Load bills
      const billsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/billing', { headers });
      setBills(billsRes.data?.bills || (Array.isArray(billsRes.data) ? billsRes.data : []));

      // Load patients
      const patientsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients?all=true', { headers });
      setPatients(patientsRes.data?.patients || (Array.isArray(patientsRes.data) ? patientsRes.data : []));

      // Load tests catalog
      const testsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests?all=true', { headers });
      setTestsCatalog(Array.isArray(testsRes.data) ? testsRes.data : testsRes.data?.tests || []);

      // Load medicines catalog
      const medsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/medicines?all=true', { headers });
      setMedicinesCatalog(Array.isArray(medsRes.data) ? medsRes.data : medsRes.data?.medicines || []);
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
    if (location.state?.followUpDate) {
      try {
        setFollowUpDate(new Date(location.state.followUpDate).toISOString().substring(0, 10));
      } catch (e) {}
    }
  }, [location.state]);

  // Live-refresh the invoice audit log when any bill is generated, edited or deleted
  useOpdSocketEvent('opd:bill', fetchData);
  useOpdSocketEvent('opd:reminder', fetchData);

  // If patient changes, check if they have a pending appointment or consultation fee to autofill
  const handlePatientChange = async (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);
    setConsultationFee(0);
    setConsultationDiscount(0);
    setConsultationDiscountType('fixed');
    setSelectedTests([]);
    setSelectedMedicines([]);
    setDiscount(0);
    setDiscountType('fixed');
    setDiscountReason('');
    setFollowUpDate('');
    setFollowUpNote('');

    if (!patientId) return;

    try {
      const headers = { 'x-user-id': userId };
      const apptsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/appointments', { headers });
      const patientAppts = apptsRes.data.filter(a => a.patientId?._id === patientId && a.status === 'Completed');
      
      if (patientAppts.length > 0) {
        setConsultationFee(patientAppts[0].consultationFee);
      }

      // Check for active follow-up reminder from OpdReminder model
      try {
        const remRes = await axios.get(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/reminders/patient/${patientId}`, { headers });
        const pReminders = Array.isArray(remRes.data) ? remRes.data : [];
        if (pReminders.length > 0 && pReminders[0].followUpDate) {
          const dStr = new Date(pReminders[0].followUpDate).toISOString().substring(0, 10);
          setFollowUpDate(dStr);
          if (pReminders[0].message) setFollowUpNote(pReminders[0].message);
        }
      } catch (e) {}
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
      discount: 0,
      discountType: 'fixed',
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
        quantity: parseInt(tempMedicineQty),
        discount: 0,
        discountType: 'fixed'
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
    setConsultationDiscount(bill.consultationDiscount || 0);
    setConsultationDiscountType(bill.consultationDiscountType || 'fixed');
    setSelectedTests((bill.tests || []).map(t => ({
      testId: t.testId?._id || t.testId || t._id || t.id,
      name: t.name,
      price: t.price,
      discount: t.discount || 0,
      discountType: t.discountType || 'fixed',
      scheduledDate: t.scheduledDate,
      notes: t.notes || ''
    })));
    setSelectedMedicines((bill.medicines || []).map(m => ({
      medicineId: m.medicineId?._id || m.medicineId || m._id || m.id,
      name: m.name,
      price: m.price,
      quantity: m.quantity || 1,
      discount: m.discount || 0,
      discountType: m.discountType || 'fixed'
    })));
    if (bill.followUpDate) {
      setFollowUpDate(new Date(bill.followUpDate).toISOString().substring(0, 10));
    } else if (bill.followUpReminder?.followUpDate) {
      setFollowUpDate(new Date(bill.followUpReminder.followUpDate).toISOString().substring(0, 10));
    } else {
      setFollowUpDate('');
    }
    setFollowUpNote(bill.followUpReminder?.message || '');
    setDiscount(bill.discount !== undefined ? bill.discount : 0);
    setDiscountType(bill.discountType || 'fixed');
    setDiscountReason(bill.discountReason || '');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBillId(null);
    setSelectedPatientId('');
    setConsultationFee(0);
    setConsultationDiscount(0);
    setConsultationDiscountType('fixed');
    setSelectedTests([]);
    setSelectedMedicines([]);
    setDiscount(0);
    setDiscountType('fixed');
    setDiscountReason('');
    setFollowUpDate('');
    setFollowUpNote('');
    setError('');
  };

  // Calculate live item-level and overall summaries
  const grossConsultation = parseFloat(consultationFee || 0);
  const numConsultDiscount = Math.max(0, parseFloat(consultationDiscount || 0));
  const consultDiscountAmt = consultationDiscountType === 'percentage'
    ? (grossConsultation * Math.min(100, numConsultDiscount)) / 100
    : Math.min(grossConsultation, numConsultDiscount);
  const netConsultation = Math.max(0, grossConsultation - consultDiscountAmt);

  const testsGross = selectedTests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
  const testsDiscountAmt = selectedTests.reduce((sum, t) => {
    const p = parseFloat(t.price || 0);
    const d = Math.max(0, parseFloat(t.discount || 0));
    return sum + (t.discountType === 'percentage' ? (p * Math.min(100, d)) / 100 : Math.min(p, d));
  }, 0);
  const netTests = Math.max(0, testsGross - testsDiscountAmt);

  const medicinesGross = selectedMedicines.reduce((sum, m) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);
  const medicinesDiscountAmt = selectedMedicines.reduce((sum, m) => {
    const gross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
    const d = Math.max(0, parseFloat(m.discount || 0));
    return sum + (m.discountType === 'percentage' ? (gross * Math.min(100, d)) / 100 : Math.min(gross, d));
  }, 0);
  const netMedicines = Math.max(0, medicinesGross - medicinesDiscountAmt);

  const subtotal = grossConsultation + testsGross + medicinesGross;
  const itemDiscountsTotal = consultDiscountAmt + testsDiscountAmt + medicinesDiscountAmt;
  const subtotalAfterItemDiscounts = Math.max(0, subtotal - itemDiscountsTotal);

  const numOverallDiscount = Math.max(0, parseFloat(discount) || 0);
  const calculatedOverallDiscount = discountType === 'percentage'
    ? (subtotalAfterItemDiscounts * Math.min(100, numOverallDiscount)) / 100
    : Math.min(subtotalAfterItemDiscounts, numOverallDiscount);
  const totalAllDiscounts = itemDiscountsTotal + calculatedOverallDiscount;
  const grandTotal = Math.max(0, subtotal - totalAllDiscounts);

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

      const hasConsult = grossConsultation > 0;
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
        consultationFee: grossConsultation,
        consultationDiscount: numConsultDiscount,
        consultationDiscountType,
        tests: selectedTests,
        medicines: selectedMedicines,
        subtotal,
        discount: numOverallDiscount,
        discountType,
        discountReason,
        totalAmount: grandTotal,
        billingType,
        status,
        followUpDate: followUpDate || null,
        followUpNote: followUpNote || ''
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
        setConsultationDiscount(0);
        setConsultationDiscountType('fixed');
        setSelectedTests([]);
        setSelectedMedicines([]);
        setDiscount(0);
        setDiscountType('fixed');
        setDiscountReason('');
        setFollowUpDate('');
        setFollowUpNote('');
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

            {/* Follow-up Date & Reminder (OpdReminder) */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  ⏰ Follow-up Date (Optional)
                </label>
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDate('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    ✕ Clear Date
                  </button>
                )}
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[
                  { label: '+3 Days', days: 3 },
                  { label: '+1 Week', days: 7 },
                  { label: '+2 Weeks', days: 14 },
                  { label: '+1 Month', days: 30 }
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPresetDate(p.days)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0D9488] font-medium transition cursor-pointer border border-teal-100"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <input
                type="date"
                value={followUpDate}
                min={new Date().toISOString().substring(0, 10)}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all text-xs font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Synchronizes automatically with OpdReminder model for patient revisit alerts.
              </p>
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
            {(selectedTests.length > 0 || selectedMedicines.length > 0 || grossConsultation > 0) && (
              <div className="border-t border-teal-100 pt-6 mt-6 bg-teal-50/20 rounded-2xl p-5 border border-dashed border-teal-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-teal-950 uppercase tracking-wide">Live Checkout Sheet</h4>
                  <span className="text-[11px] text-gray-500 font-medium">Individual item discounts supported</span>
                </div>
                
                <div className="space-y-3 text-xs text-gray-700">
                  {/* Doctor Consultation Line Item */}
                  {grossConsultation > 0 && (
                    <div className="py-2.5 px-3 bg-white/70 border border-teal-100/60 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                          👨‍⚕️ Doctor Consultation Fee
                        </span>
                        <div className="flex items-center gap-2">
                          {consultDiscountAmt > 0 && (
                            <span className="text-gray-400 line-through text-[11px] font-mono">₹{grossConsultation.toFixed(2)}</span>
                          )}
                          <span className="font-mono font-bold text-teal-950">₹{netConsultation.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                        <span>Discount:</span>
                        <div className="inline-flex rounded border border-gray-200 overflow-hidden bg-white text-[10px]">
                          <button
                            type="button"
                            onClick={() => setConsultationDiscountType('fixed')}
                            className={`px-1.5 py-0.5 font-bold cursor-pointer ${consultationDiscountType === 'fixed' ? 'bg-[#0D9488] text-white' : 'text-gray-600'}`}
                          >
                            ₹
                          </button>
                          <button
                            type="button"
                            onClick={() => setConsultationDiscountType('percentage')}
                            className={`px-1.5 py-0.5 font-bold cursor-pointer ${consultationDiscountType === 'percentage' ? 'bg-[#0D9488] text-white' : 'text-gray-600'}`}
                          >
                            %
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={consultationDiscountType === 'percentage' ? 100 : grossConsultation}
                          value={consultationDiscount === 0 ? '' : consultationDiscount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setConsultationDiscount(isNaN(val) ? 0 : val);
                          }}
                          placeholder={consultationDiscountType === 'percentage' ? '0 %' : '₹ 0'}
                          className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-center text-xs font-mono bg-white"
                        />
                        {consultDiscountAmt > 0 && (
                          <span className="text-emerald-700 font-bold text-[10px] font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                            -₹{consultDiscountAmt.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Tests Line Items */}
                  {selectedTests.map((t, idx) => {
                    const gross = parseFloat(t.price || 0);
                    const disc = Math.max(0, parseFloat(t.discount || 0));
                    const discAmt = t.discountType === 'percentage' ? (gross * Math.min(100, disc)) / 100 : Math.min(gross, disc);
                    const net = Math.max(0, gross - discAmt);

                    return (
                      <div key={`sel-t-${t.testId || t._id || t.id || idx}-${idx}`} className="py-2.5 px-3 bg-white/70 border border-teal-100/60 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <button onClick={() => removeTest(t.testId)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">×</button>
                            🧪 {t.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {discAmt > 0 && (
                              <span className="text-gray-400 line-through text-[11px] font-mono">₹{gross.toFixed(2)}</span>
                            )}
                            <span className="font-mono font-bold text-teal-950">₹{net.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
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
                            className="flex-1 min-w-[120px] border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 bg-white"
                          />
                          <div className="flex items-center gap-1">
                            <span>Disc:</span>
                            <div className="inline-flex rounded border border-gray-200 overflow-hidden bg-white text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedTests];
                                  updated[idx] = { ...updated[idx], discountType: 'fixed' };
                                  setSelectedTests(updated);
                                }}
                                className={`px-1.5 py-0.5 font-bold cursor-pointer ${t.discountType === 'percentage' ? 'text-gray-600' : 'bg-[#0D9488] text-white'}`}
                              >
                                ₹
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedTests];
                                  updated[idx] = { ...updated[idx], discountType: 'percentage' };
                                  setSelectedTests(updated);
                                }}
                                className={`px-1.5 py-0.5 font-bold cursor-pointer ${t.discountType === 'percentage' ? 'bg-[#0D9488] text-white' : 'text-gray-600'}`}
                              >
                                %
                              </button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={t.discountType === 'percentage' ? 100 : gross}
                              value={t.discount === 0 || !t.discount ? '' : t.discount}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                const updated = [...selectedTests];
                                updated[idx] = { ...updated[idx], discount: isNaN(val) ? 0 : val };
                                setSelectedTests(updated);
                              }}
                              placeholder={t.discountType === 'percentage' ? '0 %' : '₹ 0'}
                              className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-center text-xs font-mono bg-white"
                            />
                            {discAmt > 0 && (
                              <span className="text-emerald-700 font-bold text-[10px] font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                                -₹{discAmt.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pharmacy Medicines Line Items */}
                  {selectedMedicines.map((m, idx) => {
                    const gross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                    const disc = Math.max(0, parseFloat(m.discount || 0));
                    const discAmt = m.discountType === 'percentage' ? (gross * Math.min(100, disc)) / 100 : Math.min(gross, disc);
                    const net = Math.max(0, gross - discAmt);

                    return (
                      <div key={`sel-m-${m.medicineId || m._id || m.id || idx}-${idx}`} className="py-2.5 px-3 bg-white/70 border border-teal-100/60 rounded-xl space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <button onClick={() => removeMedicine(m.medicineId)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">×</button>
                            💊 {m.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {discAmt > 0 && (
                              <span className="text-gray-400 line-through text-[11px] font-mono">₹{gross.toFixed(2)}</span>
                            )}
                            <span className="font-mono font-bold text-teal-950 w-24 text-right">
                              ₹{net.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1">
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
                          <div className="flex items-center gap-1">
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
                              className="w-16 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-center text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Disc:</span>
                            <div className="inline-flex rounded border border-gray-200 overflow-hidden bg-white text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedMedicines];
                                  updated[idx] = { ...updated[idx], discountType: 'fixed' };
                                  setSelectedMedicines(updated);
                                }}
                                className={`px-1.5 py-0.5 font-bold cursor-pointer ${m.discountType === 'percentage' ? 'text-gray-600' : 'bg-[#0D9488] text-white'}`}
                              >
                                ₹
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...selectedMedicines];
                                  updated[idx] = { ...updated[idx], discountType: 'percentage' };
                                  setSelectedMedicines(updated);
                                }}
                                className={`px-1.5 py-0.5 font-bold cursor-pointer ${m.discountType === 'percentage' ? 'bg-[#0D9488] text-white' : 'text-gray-600'}`}
                              >
                                %
                              </button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={m.discountType === 'percentage' ? 100 : gross}
                              value={m.discount === 0 || !m.discount ? '' : m.discount}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                const updated = [...selectedMedicines];
                                updated[idx] = { ...updated[idx], discount: isNaN(val) ? 0 : val };
                                setSelectedMedicines(updated);
                              }}
                              placeholder={m.discountType === 'percentage' ? '0 %' : '₹ 0'}
                              className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-center text-xs font-mono bg-white"
                            />
                            {discAmt > 0 && (
                              <span className="text-emerald-700 font-bold text-[10px] font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                                -₹{discAmt.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary Totals */}
                  <div className="flex justify-between items-center py-1.5 border-t border-teal-100/40 text-xs font-semibold text-gray-700">
                    <span>Gross Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {itemDiscountsTotal > 0 && (
                    <div className="flex justify-between items-center py-1 text-xs font-semibold text-emerald-700">
                      <span>Item Discounts Total</span>
                      <span className="font-mono">-₹{itemDiscountsTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Overall Invoice Concession Section */}
                  <div className="bg-white/90 border border-teal-100 rounded-xl p-3 my-2 space-y-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                        🏷️ Additional / Overall Concession
                      </span>
                      {calculatedOverallDiscount > 0 && (
                        <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                          - ₹{calculatedOverallDiscount.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <div className="flex bg-gray-50 border-r border-gray-200">
                          <button
                            type="button"
                            onClick={() => setDiscountType('fixed')}
                            className={`px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                              discountType === 'fixed'
                                ? 'bg-[#0D9488] text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            ₹ Flat
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('percentage')}
                            className={`px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                              discountType === 'percentage'
                                ? 'bg-[#0D9488] text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            %
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'percentage' ? 100 : subtotalAfterItemDiscounts}
                          step={discountType === 'percentage' ? '1' : '0.01'}
                          value={discount === 0 ? '' : discount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setDiscount(isNaN(val) ? 0 : val);
                          }}
                          placeholder={discountType === 'percentage' ? '0 %' : '0.00'}
                          className="w-24 sm:w-28 px-2.5 py-1.5 text-xs text-gray-800 font-mono font-semibold outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Reason (e.g. Senior Citizen, Staff, Special)"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-teal-950 pt-2 border-t border-teal-200/50">
                    <div>
                      <span>Payable Grand Total</span>
                      {totalAllDiscounts > 0 && (
                        <span className="block text-[10px] font-normal text-emerald-600">
                          Total Concessions: -₹{totalAllDiscounts.toFixed(2)}
                        </span>
                      )}
                    </div>
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
              {bills.map((bill) => {
                const consultDiscAmt = (bill.consultationFee > 0 && bill.consultationDiscount > 0)
                  ? (bill.consultationDiscountType === 'percentage'
                      ? (bill.consultationFee * bill.consultationDiscount) / 100
                      : Math.min(bill.consultationFee, bill.consultationDiscount))
                  : 0;

                const testsDiscAmt = (bill.tests || []).reduce((sum, t) => {
                  const p = parseFloat(t.price || 0);
                  const d = (t.discount > 0)
                    ? (t.discountType === 'percentage' ? (p * t.discount) / 100 : Math.min(p, t.discount))
                    : 0;
                  return sum + d;
                }, 0);

                const medsDiscAmt = (bill.medicines || []).reduce((sum, m) => {
                  const gross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                  const d = (m.discount > 0)
                    ? (m.discountType === 'percentage' ? (gross * m.discount) / 100 : Math.min(gross, m.discount))
                    : 0;
                  return sum + d;
                }, 0);

                const totalItemDiscounts = consultDiscAmt + testsDiscAmt + medsDiscAmt;
                const billDiscountAmt = (bill.discount > 0)
                  ? (bill.discountType === 'percentage'
                      ? (((bill.subtotal || ((bill.totalAmount || 0) + (bill.discount || 0))) * bill.discount) / 100)
                      : bill.discount)
                  : 0;
                const grossSubtotal = parseFloat(bill.subtotal || ((bill.totalAmount || 0) + billDiscountAmt + totalItemDiscounts));

                return (
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
                        <span>
                          Consult Fee:
                          {consultDiscAmt > 0 && (
                            <span className="text-emerald-700 ml-1 text-[10px] font-semibold">
                              ({bill.consultationDiscountType === 'percentage' ? `${bill.consultationDiscount}% • ` : ''}-₹{consultDiscAmt.toFixed(2)})
                            </span>
                          )}
                        </span>
                        <span>
                          ₹{(parseFloat(bill.consultationFee) - consultDiscAmt).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {bill.tests && bill.tests.length > 0 && (
                      <div className="flex justify-between">
                        <span>Diagnostics ({bill.tests.length}):</span>
                        <span>
                          ₹{bill.tests.reduce((sum, t) => {
                            const p = parseFloat(t.price || 0);
                            const d = (t.discount > 0)
                              ? (t.discountType === 'percentage' ? (p * t.discount) / 100 : Math.min(p, t.discount))
                              : 0;
                            return sum + Math.max(0, p - d);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {bill.medicines && bill.medicines.length > 0 && (
                      <div className="flex justify-between">
                        <span>Medicines ({bill.medicines.reduce((sum, m) => sum + (parseInt(m.quantity) || 1), 0)}):</span>
                        <span>
                          ₹{bill.medicines.reduce((sum, m) => {
                            const gross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                            const d = (m.discount > 0)
                              ? (m.discountType === 'percentage' ? (gross * m.discount) / 100 : Math.min(gross, m.discount))
                              : 0;
                            return sum + Math.max(0, gross - d);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {(totalItemDiscounts > 0 || bill.discount > 0 || (bill.subtotal && bill.subtotal > bill.totalAmount)) && (
                      <div className="flex justify-between text-gray-500">
                        <span>Gross Subtotal:</span>
                        <span>₹{grossSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {totalItemDiscounts > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1">
                          🏷️ Total Item Discounts:
                        </span>
                        <span>-₹{totalItemDiscounts.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1">
                          🏷️ Bill Discount ({bill.discountType === 'percentage' ? `${bill.discount}%` : `₹${bill.discount}`}):
                        </span>
                        <span>
                          -₹{billDiscountAmt.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-teal-950 pt-1.5 border-t border-slate-200/50">
                      <span>Total Amount:</span>
                      <span>₹{parseFloat(bill.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    {bill.followUpDate && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-lg text-[10px] font-medium mt-1">
                        <span className="flex items-center gap-1 font-semibold text-amber-800">
                          ⏰ Follow-up Revisit:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{new Date(bill.followUpDate).toLocaleDateString()}</span>
                          {bill.followUpReminder?.status && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-200/60 text-amber-900 rounded font-semibold">
                              {bill.followUpReminder.status}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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
              );
              })}
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

              {printBill.followUpDate && (
                <div className="flex justify-between bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg text-xs">
                  <span className="text-amber-800 font-semibold">⏰ Follow-up Date:</span>
                  <span className="font-mono font-bold text-amber-950">
                    {new Date(printBill.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                <p className="font-bold text-gray-500 uppercase tracking-wide text-[10px] mb-2">Itemized Breakdown</p>
                <div className="space-y-1.5">
                  {printBill.consultationFee > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <span>Doctor Consultation Fee</span>
                        {printBill.consultationDiscount > 0 && (
                          <span className="text-[10px] text-emerald-600 ml-1.5 font-medium">
                            (Disc: {printBill.consultationDiscountType === 'percentage' ? `${printBill.consultationDiscount}%` : `₹${printBill.consultationDiscount}`})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {printBill.consultationDiscount > 0 && (
                          <span className="text-[10px] text-gray-400 line-through mr-1 font-mono">₹{parseFloat(printBill.consultationFee).toFixed(2)}</span>
                        )}
                        <span className="font-mono font-semibold">
                          ₹{(printBill.consultationDiscount > 0
                            ? Math.max(0, printBill.consultationDiscountType === 'percentage'
                                ? printBill.consultationFee - (printBill.consultationFee * printBill.consultationDiscount) / 100
                                : printBill.consultationFee - printBill.consultationDiscount)
                            : parseFloat(printBill.consultationFee)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  {printBill.tests && printBill.tests.map(t => {
                    const tPrice = parseFloat(t.price || 0);
                    const tDiscAmt = (t.discount > 0)
                      ? (t.discountType === 'percentage' ? (tPrice * t.discount) / 100 : Math.min(tPrice, t.discount))
                      : 0;
                    const tNet = Math.max(0, tPrice - tDiscAmt);
                    return (
                      <div key={t.testId || t._id} className="flex justify-between items-center">
                        <div>
                          <span>Diagnostic: {t.name}</span>
                          {t.discount > 0 && (
                            <span className="text-[10px] text-emerald-600 ml-1.5 font-medium">
                              (Disc: {t.discountType === 'percentage' ? `${t.discount}%` : `₹${t.discount}`})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {t.discount > 0 && (
                            <span className="text-[10px] text-gray-400 line-through mr-1 font-mono">₹{tPrice.toFixed(2)}</span>
                          )}
                          <span className="font-mono font-semibold">₹{tNet.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {printBill.medicines && printBill.medicines.map(m => {
                    const mGross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                    const mDiscAmt = (m.discount > 0)
                      ? (m.discountType === 'percentage' ? (mGross * m.discount) / 100 : Math.min(mGross, m.discount))
                      : 0;
                    const mNet = Math.max(0, mGross - mDiscAmt);
                    return (
                      <div key={m.medicineId || m._id} className="flex justify-between items-center">
                        <div>
                          <span>Pharmacy: {m.name} × {m.quantity || 1}</span>
                          {m.discount > 0 && (
                            <span className="text-[10px] text-emerald-600 ml-1.5 font-medium">
                              (Disc: {m.discountType === 'percentage' ? `${m.discount}%` : `₹${m.discount}`})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {m.discount > 0 && (
                            <span className="text-[10px] text-gray-400 line-through mr-1 font-mono">₹{mGross.toFixed(2)}</span>
                          )}
                          <span className="font-mono font-semibold">₹{mNet.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mt-3 space-y-1.5">
                {(printBill.discount > 0 || (printBill.subtotal && printBill.subtotal > printBill.totalAmount)) && (
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-mono">
                      ₹{parseFloat(printBill.subtotal || ((printBill.totalAmount || 0) + (printBill.discount || 0))).toFixed(2)}
                    </span>
                  </div>
                )}
                {printBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>
                      Discount ({printBill.discountType === 'percentage' ? `${printBill.discount}%` : `₹${printBill.discount}`}
                      {printBill.discountReason ? ` • ${printBill.discountReason}` : ''}):
                    </span>
                    <span className="font-mono">
                      -₹{(printBill.discountType === 'percentage'
                        ? (((printBill.subtotal || ((printBill.totalAmount || 0) + (printBill.discount || 0))) * printBill.discount) / 100)
                        : printBill.discount
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold text-teal-950 pt-1.5 border-t border-gray-100">
                  <span>Payable Grand Total:</span>
                  <span className="text-base text-teal-800">₹{parseFloat(printBill.totalAmount || 0).toFixed(2)}</span>
                </div>
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
