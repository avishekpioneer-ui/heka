import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import apiClient from '../../config/api';
import CalendarPickerModal from '../../components/CalendarPickerModal';

export default function OpdBillingScreen({ routeParams, onNavigate, refreshKey }) {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [medicinesCatalog, setMedicinesCatalog] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingBillId, setPayingBillId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calendar Picker State for Tests
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTargetTestIdx, setCalendarTargetTestIdx] = useState(null);

  // Follow-up Date (OpdReminder Model)
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [isFollowUpCalendarOpen, setIsFollowUpCalendarOpen] = useState(false);

  const setPresetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().substring(0, 10));
  };

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [consultationFee, setConsultationFee] = useState('0');
  const [consultationDiscount, setConsultationDiscount] = useState('0');
  const [consultationDiscountType, setConsultationDiscountType] = useState('fixed'); // 'fixed' (₹) or 'percentage' (%)
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  // Test dropdown states
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);

  // Medicine dropdown states
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [isMedicineDropdownOpen, setIsMedicineDropdownOpen] = useState(false);

  // Selected line items
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  // Overall Discount state
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' (₹) or 'percentage' (%)
  const [discountReason, setDiscountReason] = useState('');

  const formatItemName = (name) => {
    if (!name) return '';
    return String(name)
      .replace(/([a-zA-Z0-9])\(/g, '$1 (')
      .replace(/\)([a-zA-Z0-9])/g, ') $1')
      .replace(/([a-zA-Z0-9])\/([a-zA-Z0-9])/g, '$1 / $2');
  };

  const filteredBills = bills.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const pName = (b.patientName || b.patientId?.name || '').toLowerCase();
    const invNum = String(b.invoiceNumber || b._id || b.id || '').toLowerCase();
    return pName.includes(q) || invNum.includes(q);
  });

  const filteredTests = testsCatalog.filter((t) => {
    const q = testSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  });

  const filteredMedicines = medicinesCatalog.filter((m) => {
    const q = medicineSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.strength || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchData(1, false);
  }, [refreshKey]);

  useEffect(() => {
    if (routeParams?.patientId) {
      setSelectedPatientId(routeParams.patientId);
      if (routeParams.consultationFee) {
        setConsultationFee(String(routeParams.consultationFee));
      }
      if (routeParams.followUpDate) {
        try {
          setFollowUpDate(new Date(routeParams.followUpDate).toISOString().substring(0, 10));
        } catch (e) { }
      }
      setEditingBillId(null);
      setIsModalOpen(true);
    }
  }, [routeParams]);

  const resetFormState = () => {
    setSelectedPatientId('');
    setConsultationFee('0');
    setConsultationDiscount('0');
    setConsultationDiscountType('fixed');
    setSelectedTests([]);
    setSelectedMedicines([]);
    setDiscount('0');
    setDiscountType('fixed');
    setDiscountReason('');
    setFollowUpDate('');
    setFollowUpNote('');
    setEditingBillId(null);
    setPatientSearchQuery('');
    setIsPatientDropdownOpen(false);
    setTestSearchQuery('');
    setIsTestDropdownOpen(false);
    setMedicineSearchQuery('');
    setIsMedicineDropdownOpen(false);
    setError('');
    setSuccess('');
  };

  const fetchData = async (pageNum = 1, isAppend = false) => {
    try {
      if (pageNum === 1) {
        if (!isAppend) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const promises = [
        apiClient.get(`/api/opd/billing?page=${pageNum}&limit=50`).catch(() => ({ data: [] })),
      ];

      if (pageNum === 1) {
        promises.push(apiClient.get('/api/opd/patients?all=true').catch(() => ({ data: [] })));
        promises.push(apiClient.get('/api/opd/tests?all=true').catch(() => ({ data: [] })));
        promises.push(apiClient.get('/api/opd/medicines?all=true').catch(() => ({ data: [] })));
      }

      const [bRes, pRes, tRes, mRes] = await Promise.all(promises);

      const bData = bRes.data?.bills || bRes.data?.data || (Array.isArray(bRes.data) ? bRes.data : []);
      const newHasMore = typeof bRes.data?.hasMore === 'boolean' ? bRes.data.hasMore : bData.length === 50;

      if (isAppend) {
        setBills((prev) => [...prev, ...bData]);
      } else {
        setBills(bData);
      }
      setHasMore(newHasMore);
      setPage(pageNum);

      if (pRes) {
        const pData = pRes.data?.patients || pRes.data?.data || (Array.isArray(pRes.data) ? pRes.data : []);
        setPatients(Array.isArray(pData) ? pData : []);
      }
      if (tRes) {
        const tData = tRes.data?.tests || tRes.data?.data || (Array.isArray(tRes.data) ? tRes.data : []);
        setTestsCatalog(Array.isArray(tData) ? tData : []);
      }
      if (mRes) {
        const mData = mRes.data?.medicines || mRes.data?.data || (Array.isArray(mRes.data) ? mRes.data : []);
        setMedicinesCatalog(Array.isArray(mData) ? mData : []);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && !searchQuery.trim()) {
      fetchData(page + 1, true);
    }
  };

  const handlePatientSelect = async (patientId) => {
    setSelectedPatientId(patientId);
    setDiscount('0');
    setDiscountType('fixed');
    setDiscountReason('');
    setConsultationDiscount('0');
    setConsultationDiscountType('fixed');
    setFollowUpDate('');
    setFollowUpNote('');
    try {
      const res = await apiClient.get('/api/opd/appointments');
      const appts = res.data?.appointments || res.data || [];
      const match = appts.find(
        (a) =>
          (a.patientId?._id === patientId || a.patientId === patientId) &&
          a.status === 'Completed'
      );
      if (match && match.consultationFee) {
        setConsultationFee(String(match.consultationFee));
      }
    } catch (e) { }

    // Check for active follow-up reminder from OpdReminder model
    try {
      const remRes = await apiClient.get(`/api/opd/reminders/patient/${patientId}`).catch(() => ({ data: [] }));
      const pReminders = Array.isArray(remRes.data) ? remRes.data : remRes.data?.reminders || [];
      if (pReminders.length > 0 && pReminders[0].followUpDate) {
        const dStr = new Date(pReminders[0].followUpDate).toISOString().substring(0, 10);
        setFollowUpDate(dStr);
        if (pReminders[0].message) setFollowUpNote(pReminders[0].message);
      }
    } catch (e) { }
  };

  const handleAddTest = (test) => {
    const targetId = test._id || test.id;
    const exists = selectedTests.find((t) => t.testId === targetId);
    if (exists) {
      // Toggle or remove if selected again
      setSelectedTests(selectedTests.filter((t) => t.testId !== targetId));
    } else {
      setSelectedTests([
        ...selectedTests,
        {
          testId: targetId,
          name: test.name,
          price: test.price,
          discount: 0,
          discountType: 'fixed',
          scheduledDate: new Date().toISOString().substring(0, 10),
          notes: '',
        },
      ]);
    }
  };

  const handleTestDiscountChange = (idx, val) => {
    const updated = [...selectedTests];
    updated[idx] = { ...updated[idx], discount: val };
    setSelectedTests(updated);
  };

  const handleTestDiscountTypeToggle = (idx) => {
    const updated = [...selectedTests];
    const curr = updated[idx]?.discountType || 'fixed';
    updated[idx] = { ...updated[idx], discountType: curr === 'fixed' ? 'percentage' : 'fixed' };
    setSelectedTests(updated);
  };

  const handleTestScheduleDateChange = (idx, val) => {
    const updated = [...selectedTests];
    updated[idx] = { ...updated[idx], scheduledDate: val };
    setSelectedTests(updated);
  };

  const handleTestNotesChange = (idx, val) => {
    const updated = [...selectedTests];
    updated[idx] = { ...updated[idx], notes: val };
    setSelectedTests(updated);
  };

  const handleAddMedicine = (med) => {
    const targetId = med._id || med.id;
    const availableStock = med.stock !== undefined ? Number(med.stock) : 999;

    if (availableStock <= 0) {
      Alert.alert('Out of Stock', `${med.name} is currently out of stock.`);
      return;
    }

    const existsIndex = selectedMedicines.findIndex((m) => m.medicineId === targetId);
    if (existsIndex > -1) {
      const currentQty = parseInt(selectedMedicines[existsIndex].quantity, 10) || 1;
      if (currentQty >= availableStock) {
        Alert.alert(
          'Stock Limit Reached',
          `Cannot order more than ${availableStock} unit(s) for ${med.name}. Available stock: ${availableStock}.`
        );
        return;
      }
      const updated = [...selectedMedicines];
      updated[existsIndex] = {
        ...updated[existsIndex],
        quantity: currentQty + 1,
        stock: availableStock,
      };
      setSelectedMedicines(updated);
    } else {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          medicineId: targetId,
          name: med.name,
          quantity: 1,
          price: med.price,
          discount: 0,
          discountType: 'fixed',
          stock: availableStock,
        },
      ]);
    }
  };

  const handleMedicineDiscountChange = (idx, val) => {
    const updated = [...selectedMedicines];
    updated[idx] = { ...updated[idx], discount: val };
    setSelectedMedicines(updated);
  };

  const handleMedicineDiscountTypeToggle = (idx) => {
    const updated = [...selectedMedicines];
    const curr = updated[idx]?.discountType || 'fixed';
    updated[idx] = { ...updated[idx], discountType: curr === 'fixed' ? 'percentage' : 'fixed' };
    setSelectedMedicines(updated);
  };

  const handleRemoveTest = (testId) => {
    setSelectedTests(selectedTests.filter((t) => t.testId !== testId));
  };

  const handleRemoveMedicine = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.medicineId !== medicineId));
  };

  const handleMedicineQtyChange = (idx, val) => {
    const updated = [...selectedMedicines];
    const med = updated[idx];
    const catMed = medicinesCatalog.find((c) => (c._id || c.id) === med.medicineId);
    const availableStock =
      med.stock !== undefined
        ? Number(med.stock)
        : catMed?.stock !== undefined
          ? Number(catMed.stock)
          : 999;

    let qty = parseInt(val, 10);
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }
    if (qty > availableStock) {
      qty = availableStock;
      Alert.alert(
        'Stock Limit Reached',
        `Cannot order more than ${availableStock} unit(s) for ${med.name}.`
      );
    }
    updated[idx] = { ...med, quantity: qty, stock: availableStock };
    setSelectedMedicines(updated);
  };

  const handleMedicineQtyIncrement = (idx, delta) => {
    const updated = [...selectedMedicines];
    const med = updated[idx];
    const catMed = medicinesCatalog.find((c) => (c._id || c.id) === med.medicineId);
    const availableStock =
      med.stock !== undefined
        ? Number(med.stock)
        : catMed?.stock !== undefined
          ? Number(catMed.stock)
          : 999;

    const currentQty = parseInt(med.quantity, 10) || 1;
    let newQty = currentQty + delta;

    if (delta > 0 && newQty > availableStock) {
      Alert.alert(
        'Stock Limit Reached',
        `Cannot order more than ${availableStock} unit(s) for ${med.name}. Available stock: ${availableStock}.`
      );
      return;
    }

    newQty = Math.max(1, Math.min(newQty, availableStock));
    updated[idx] = { ...med, quantity: newQty, stock: availableStock };
    setSelectedMedicines(updated);
  };

  // Calculations with Line-Item and Overall Discounts
  const grossConsultation = parseFloat(consultationFee) || 0;
  const rawConsultDisc = Math.max(0, parseFloat(consultationDiscount) || 0);
  const consultDiscountAmt =
    consultationDiscountType === 'percentage'
      ? (grossConsultation * Math.min(100, rawConsultDisc)) / 100
      : Math.min(grossConsultation, rawConsultDisc);
  const netConsultation = Math.max(0, grossConsultation - consultDiscountAmt);

  const testsGross = selectedTests.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
  const testsDiscountAmt = selectedTests.reduce((acc, item) => {
    const p = parseFloat(item.price) || 0;
    const d = Math.max(0, parseFloat(item.discount) || 0);
    const amt = item.discountType === 'percentage' ? (p * Math.min(100, d)) / 100 : Math.min(p, d);
    return acc + amt;
  }, 0);
  const netTests = Math.max(0, testsGross - testsDiscountAmt);

  const medsGross = selectedMedicines.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
    0
  );
  const medsDiscountAmt = selectedMedicines.reduce((acc, item) => {
    const gross = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
    const d = Math.max(0, parseFloat(item.discount) || 0);
    const amt = item.discountType === 'percentage' ? (gross * Math.min(100, d)) / 100 : Math.min(gross, d);
    return acc + amt;
  }, 0);
  const netMeds = Math.max(0, medsGross - medsDiscountAmt);

  const grossSubtotal = grossConsultation + testsGross + medsGross;
  const itemDiscountsTotal = consultDiscountAmt + testsDiscountAmt + medsDiscountAmt;
  const netSubtotal = Math.max(0, grossSubtotal - itemDiscountsTotal);

  const rawInvoiceDiscount = Math.max(0, parseFloat(discount) || 0);
  const calculatedInvoiceDiscount =
    discountType === 'percentage'
      ? (netSubtotal * Math.min(100, rawInvoiceDiscount)) / 100
      : Math.min(netSubtotal, rawInvoiceDiscount);

  const totalAllDiscounts = itemDiscountsTotal + calculatedInvoiceDiscount;
  const grandTotal = Math.max(0, netSubtotal - calculatedInvoiceDiscount);

  const handleStartEdit = (bill) => {
    setEditingBillId(bill._id || bill.id);
    setSelectedPatientId(bill.patientId?._id || bill.patientId || '');
    setConsultationFee(String(bill.consultationFee || 0));
    setConsultationDiscount(String(bill.consultationDiscount || 0));
    setConsultationDiscountType(bill.consultationDiscountType || 'fixed');
    setSelectedTests(
      (bill.tests || []).map((t) => ({
        testId: t.testId?._id || t.testId || t._id || t.id,
        name: t.name,
        price: t.price,
        discount: t.discount !== undefined ? t.discount : 0,
        discountType: t.discountType || 'fixed',
        scheduledDate: t.scheduledDate
          ? new Date(t.scheduledDate).toISOString().substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        notes: t.notes || '',
      }))
    );
    setSelectedMedicines(
      (bill.medicines || []).map((m) => {
        const medId = m.medicineId?._id || m.medicineId || m._id || m.id;
        const catMed = medicinesCatalog.find((c) => (c._id || c.id) === medId);
        return {
          medicineId: medId,
          name: m.name,
          price: m.price,
          quantity: m.quantity || 1,
          discount: m.discount !== undefined ? m.discount : 0,
          discountType: m.discountType || 'fixed',
          stock: catMed?.stock !== undefined ? Number(catMed.stock) : (m.medicineId?.stock ?? 999),
        };
      })
    );
    if (bill.followUpDate) {
      setFollowUpDate(new Date(bill.followUpDate).toISOString().substring(0, 10));
    } else if (bill.followUpReminder?.followUpDate) {
      setFollowUpDate(new Date(bill.followUpReminder.followUpDate).toISOString().substring(0, 10));
    } else {
      setFollowUpDate('');
    }
    setFollowUpNote(bill.followUpReminder?.message || '');
    setDiscount(String(bill.discount !== undefined ? bill.discount : '0'));
    setDiscountType(bill.discountType || 'fixed');
    setDiscountReason(bill.discountReason || '');
    setPatientSearchQuery('');
    setIsPatientDropdownOpen(false);
    setTestSearchQuery('');
    setIsTestDropdownOpen(false);
    setMedicineSearchQuery('');
    setIsMedicineDropdownOpen(false);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleDeleteBill = (bill) => {
    const billId = bill._id || bill.id;
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice #${String(bill.invoiceNumber || billId).slice(-6).toUpperCase()}? Any reserved medicine stock will be refunded.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/billing/${billId}`);
              fetchData();
              Alert.alert('Success', 'Invoice deleted successfully.');
            } catch (err) {
              console.error('Error deleting bill:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete invoice.');
            }
          },
        },
      ]
    );
  };

  const handleCreateBill = async (status = 'Pending') => {
    if (!selectedPatientId) {
      setError('Please select a patient to generate an invoice.');
      return;
    }

    if (grandTotal <= 0) {
      setError('Total bill amount must be greater than zero.');
      return;
    }

    // Verify stock availability
    for (const m of selectedMedicines) {
      const catMed = medicinesCatalog.find((c) => (c._id || c.id) === m.medicineId);
      const availableStock =
        m.stock !== undefined
          ? Number(m.stock)
          : catMed?.stock !== undefined
            ? Number(catMed.stock)
            : 999;
      const requestedQty = parseInt(m.quantity, 10) || 1;
      if (requestedQty > availableStock) {
        setError(
          `Quantity for ${m.name} (${requestedQty}) exceeds available stock (${availableStock}).`
        );
        return;
      }
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const items = [];

      if (grossConsultation > 0) {
        items.push({
          itemType: 'Consultation',
          name: 'Doctor Consultation Fee',
          price: grossConsultation,
          discount: rawConsultDisc,
          discountType: consultationDiscountType,
          quantity: 1,
        });
      }

      selectedTests.forEach((t) => {
        items.push({
          itemType: 'Test',
          testId: t.testId || t._id || t.id,
          name: t.name,
          price: parseFloat(t.price) || 0,
          discount: Math.max(0, parseFloat(t.discount) || 0),
          discountType: t.discountType || 'fixed',
          quantity: 1,
          scheduledDate: t.scheduledDate || new Date().toISOString().substring(0, 10),
          notes: t.notes || '',
        });
      });

      selectedMedicines.forEach((m) => {
        items.push({
          itemType: 'Medicine',
          name: m.name,
          price: parseFloat(m.price) || 0,
          quantity: parseInt(m.quantity) || 1,
          discount: Math.max(0, parseFloat(m.discount) || 0),
          discountType: m.discountType || 'fixed',
        });
      });

      const hasConsult = grossConsultation > 0;
      const hasTests = selectedTests.length > 0;
      const hasMeds = selectedMedicines.length > 0;
      const componentCount = [hasConsult, hasTests, hasMeds].filter(Boolean).length;

      let billingType = 'Combined';
      if (componentCount <= 1) {
        if (hasTests) billingType = 'Diagnostic';
        else if (hasMeds) billingType = 'Pharmacy';
        else if (hasConsult) billingType = 'Consultation';
      }

      const formattedTests = selectedTests.map((t) => ({
        testId: t.testId || t._id || t.id,
        name: t.name,
        price: parseFloat(t.price) || 0,
        discount: Math.max(0, parseFloat(t.discount) || 0),
        discountType: t.discountType || 'fixed',
        scheduledDate: t.scheduledDate || new Date().toISOString().substring(0, 10),
        notes: t.notes || '',
      }));

      const formattedMedicines = selectedMedicines.map((m) => ({
        medicineId: m.medicineId || m._id || m.id,
        name: m.name,
        price: parseFloat(m.price) || 0,
        quantity: parseInt(m.quantity) || 1,
        discount: Math.max(0, parseFloat(m.discount) || 0),
        discountType: m.discountType || 'fixed',
      }));

      const payload = {
        patientId: selectedPatientId,
        consultationFee: grossConsultation,
        consultationDiscount: rawConsultDisc,
        consultationDiscountType,
        tests: formattedTests,
        medicines: formattedMedicines,
        billingType,
        subtotal: grossSubtotal,
        discount: rawInvoiceDiscount,
        discountType,
        discountReason,
        totalAmount: grandTotal,
        status,
        items,
        followUpDate: followUpDate || null,
        followUpNote: followUpNote || '',
      };

      if (editingBillId) {
        await apiClient.put(`/api/opd/billing/${editingBillId}`, payload);
        setSuccess(`Invoice updated successfully!`);
      } else {
        await apiClient.post('/api/opd/billing', payload);
        setSuccess(
          `Invoice created successfully (${status.toUpperCase()})!`
        );
      }

      resetFormState();
      fetchData();

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving bill:', err);
      setError(err.response?.data?.message || err.message || 'Error saving invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInvoice = async (bill) => {
    const isPaid = bill.status === 'Paid';
    const sub = bill.subtotal || ((bill.totalAmount || 0) + (bill.discount || 0));
    const disc = bill.discount || 0;

    let itemsBreakdown = '';
    if (bill.consultationFee > 0) {
      const cDisc = bill.consultationDiscount > 0
        ? ` (Disc: ${bill.consultationDiscountType === 'percentage' ? `${bill.consultationDiscount}%` : `₹${bill.consultationDiscount}`})`
        : '';
      itemsBreakdown += `• Consultation: ₹${bill.consultationFee}${cDisc}\n`;
    }
    (bill.tests || []).forEach((t) => {
      const tDisc = t.discount > 0 ? ` (Disc: ${t.discountType === 'percentage' ? `${t.discount}%` : `₹${t.discount}`})` : '';
      itemsBreakdown += `• Diagnostic: ${t.name} ₹${t.price}${tDisc}\n`;
    });
    (bill.medicines || []).forEach((m) => {
      const mDisc = m.discount > 0 ? ` (Disc: ${m.discountType === 'percentage' ? `${m.discount}%` : `₹${m.discount}`})` : '';
      itemsBreakdown += `• Medicine: ${m.name} x${m.quantity || 1} ₹${((m.price || 0) * (m.quantity || 1)).toFixed(2)}${mDisc}\n`;
    });

    const text =
      `🧾 Rudraksh Foundation Invoice\n` +
      `----------------------------------------\n` +
      `Bill ID       : ${bill._id || bill.id}\n` +
      `Patient       : ${bill.patientName || bill.patientId?.name || 'Patient'}\n` +
      `Date          : ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}\n` +
      `Status        : ${isPaid ? 'PAID' : 'PENDING'}\n` +
      (itemsBreakdown ? `----------------------------------------\n${itemsBreakdown}` : '') +
      `----------------------------------------\n` +
      (disc > 0 || (bill.subtotal && bill.subtotal > bill.totalAmount) ? `Subtotal      : ₹${sub}\n` : '') +
      (disc > 0 ? `Bill Discount : -₹${bill.discountType === 'percentage' ? (((sub * disc) / 100).toFixed(2)) : disc} (${bill.discountType === 'percentage' ? `${disc}%` : 'Flat'}${bill.discountReason ? ` - ${bill.discountReason}` : ''})\n` : '') +
      `Total Amount  : ₹${bill.totalAmount}\n` +
      (bill.followUpDate ? `Follow-up     : ${new Date(bill.followUpDate).toLocaleDateString()}\n` : '') +
      `----------------------------------------\n` +
      `Powered by HEKA`;

    try {
      await Share.share({ message: text });
    } catch (e) { }
  };

  const handlePayBill = (billId) => {
    if (!billId) return;
    Alert.alert(
      'Record Payment',
      'Mark this invoice as Paid? This will update the invoice status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setPayingBillId(billId);
              await apiClient.put(`/api/opd/billing/${billId}/pay`, {});
              await fetchData();
              Alert.alert('Payment Recorded', 'Invoice has been marked as Paid successfully.');
            } catch (err) {
              console.error('Error processing payment:', err);
              Alert.alert('Payment Error', err.response?.data?.message || 'Failed to record payment.');
            } finally {
              setPayingBillId(null);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.title}>OPD Billing & Invoices</Text>
          <Text style={styles.subtitle}>Checkout patients, generate bills & accept payments</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {onNavigate && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: '#134e4a' }]}
              onPress={() => onNavigate('billing-summary')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>📊 Dues</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search invoices by patient, number, or test..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Loading Billing Records...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>No Invoices Found</Text>
        <Text style={styles.emptyText}>Tap "+ New Bill" to generate a consultation or diagnostic invoice.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="#0f766e" />
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Loading more bills...</Text>
      </View>
    );
  };

  const renderBillItem = ({ item: b, index: bIdx }) => {
    const isPaid = b.status === 'Paid';
    const bId = b._id || b.id;
    const isPaying = payingBillId === bId;

    const consultDiscAmt = (b.consultationFee > 0 && b.consultationDiscount > 0)
      ? (b.consultationDiscountType === 'percentage'
          ? (b.consultationFee * b.consultationDiscount) / 100
          : Math.min(b.consultationFee, b.consultationDiscount))
      : 0;

    const testsDiscAmt = (b.tests || []).reduce((sum, t) => {
      const p = parseFloat(t.price || 0);
      const d = (t.discount > 0)
        ? (t.discountType === 'percentage' ? (p * t.discount) / 100 : Math.min(p, t.discount))
        : 0;
      return sum + d;
    }, 0);

    const medsDiscAmt = (b.medicines || []).reduce((sum, m) => {
      const gross = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
      const d = (m.discount > 0)
        ? (m.discountType === 'percentage' ? (gross * m.discount) / 100 : Math.min(gross, m.discount))
        : 0;
      return sum + d;
    }, 0);

    const totalItemDiscounts = consultDiscAmt + testsDiscAmt + medsDiscAmt;
    const billDiscountAmt = (b.discount > 0)
      ? (b.discountType === 'percentage'
          ? (((b.subtotal || ((b.totalAmount || 0) + (b.discount || 0))) * b.discount) / 100)
          : b.discount)
      : 0;
    const grossSubtotal = parseFloat(b.subtotal || ((b.totalAmount || 0) + billDiscountAmt + totalItemDiscounts));

    return (
      <View key={bId || `bill-card-${bIdx}`} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.invoiceNo}>🧾 #{String(b.invoiceNumber || bId || '').slice(-8).toUpperCase()}</Text>
            <Text style={styles.patientName}>{b.patientName || b.patientId?.name || 'Walk-in Patient'}</Text>
          </View>

          <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
            <Text style={[styles.statusBadgeText, isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextPending]}>
              {isPaid ? '✓ PAID' : '⏳ PENDING'}
            </Text>
          </View>
        </View>

        {/* Items breakdown */}
        <View style={styles.itemizedBox}>
          {b.consultationFee > 0 && (
            <View style={styles.itemRow}>
              <View style={styles.itemColLeft}>
                <Text style={styles.itemLabel}>👨‍⚕️ Doctor Consultation</Text>
                {consultDiscAmt > 0 && (
                  <Text style={styles.itemDiscountSubtext}>
                    🏷️ Discount: {b.consultationDiscountType === 'percentage' ? `${b.consultationDiscount}% ` : ''}(-₹{consultDiscAmt.toFixed(2)})
                  </Text>
                )}
              </View>
              <View style={styles.itemColRight}>
                {consultDiscAmt > 0 && (
                  <Text style={styles.itemCrossedPrice}>₹{parseFloat(b.consultationFee).toFixed(2)}</Text>
                )}
                <Text style={styles.itemValue}>
                  ₹{(parseFloat(b.consultationFee) - consultDiscAmt).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {b.tests?.map((t, idx) => {
            const p = parseFloat(t.price || 0);
            const d = (t.discount > 0)
              ? (t.discountType === 'percentage' ? (p * t.discount) / 100 : Math.min(p, t.discount))
              : 0;
            const net = Math.max(0, p - d);
            return (
              <View key={`b-test-${t.testId?._id || t.testId || t.name || idx}-${idx}`} style={styles.itemRow}>
                <View style={styles.itemColLeft}>
                  <Text style={styles.itemLabel}>
                    🧪 {formatItemName(t.testId?.name || t.name || 'Diagnostic Test')}
                  </Text>
                  {d > 0 && (
                    <Text style={styles.itemDiscountSubtext}>
                      🏷️ Discount: {t.discountType === 'percentage' ? `${t.discount}% ` : ''}(-₹{d.toFixed(2)})
                    </Text>
                  )}
                </View>
                <View style={styles.itemColRight}>
                  {d > 0 && (
                    <Text style={styles.itemCrossedPrice}>₹{p.toFixed(2)}</Text>
                  )}
                  <Text style={styles.itemValue}>₹{net.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}

          {b.medicines?.map((m, idx) => {
            const qty = parseInt(m.quantity) || 1;
            const gross = (parseFloat(m.price) || 0) * qty;
            const d = (m.discount > 0)
              ? (m.discountType === 'percentage' ? (gross * m.discount) / 100 : Math.min(gross, m.discount))
              : 0;
            const net = Math.max(0, gross - d);
            return (
              <View key={`b-med-${m.medicineId?._id || m.medicineId || m.name || idx}-${idx}`} style={styles.itemRow}>
                <View style={styles.itemColLeft}>
                  <Text style={styles.itemLabel}>
                    💊 {formatItemName(m.medicineId?.name || m.name)} (x{qty})
                  </Text>
                  {d > 0 && (
                    <Text style={styles.itemDiscountSubtext}>
                      🏷️ Discount: {m.discountType === 'percentage' ? `${m.discount}% ` : ''}(-₹{d.toFixed(2)})
                    </Text>
                  )}
                </View>
                <View style={styles.itemColRight}>
                  {d > 0 && (
                    <Text style={styles.itemCrossedPrice}>₹{gross.toFixed(2)}</Text>
                  )}
                  <Text style={styles.itemValue}>₹{net.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}

          {(totalItemDiscounts > 0 || b.discount > 0 || (b.subtotal && b.subtotal > b.totalAmount)) && (
            <View style={styles.itemRow}>
              <View style={styles.itemColLeft}>
                <Text style={styles.itemLabel}>Gross Subtotal</Text>
              </View>
              <View style={styles.itemColRight}>
                <Text style={styles.itemValue}>₹{grossSubtotal.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {totalItemDiscounts > 0 && (
            <View style={styles.itemRow}>
              <View style={styles.itemColLeft}>
                <Text style={[styles.itemLabel, { color: '#047857', fontWeight: '700' }]}>
                  🏷️ Total Item Discounts
                </Text>
              </View>
              <View style={styles.itemColRight}>
                <Text style={[styles.itemValue, { color: '#047857', fontWeight: '800' }]}>
                  -₹{totalItemDiscounts.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {b.discount > 0 && (
            <View style={styles.itemRow}>
              <View style={styles.itemColLeft}>
                <Text style={[styles.itemLabel, { color: '#047857', fontWeight: '700' }]}>
                  🏷️ Bill Discount ({b.discountType === 'percentage' ? `${b.discount}%` : `₹${b.discount}`}{b.discountReason ? ` • ${b.discountReason}` : ''})
                </Text>
              </View>
              <View style={styles.itemColRight}>
                <Text style={[styles.itemValue, { color: '#047857', fontWeight: '800' }]}>
                  -₹{billDiscountAmt.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.itemRow, styles.totalRow]}>
            <View style={styles.itemColLeft}>
              <Text style={styles.totalLabel}>Total Amount</Text>
            </View>
            <View style={styles.itemColRight}>
              <Text style={styles.totalValue}>₹{parseFloat(b.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>

          {b.followUpDate ? (
            <View style={styles.followUpCardRow}>
              <Text style={styles.followUpCardLabel}>⏰ Follow-up Revisit:</Text>
              <View style={styles.followUpBadgeBox}>
                <Text style={styles.followUpBadgeDate}>
                  {new Date(b.followUpDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                {b.followUpReminder?.status ? (
                  <View style={styles.followUpStatusPill}>
                    <Text style={styles.followUpStatusPillText}>{b.followUpReminder.status}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.billActions}>
            {!isPaid && (
              <TouchableOpacity
                style={[styles.payBtn, isPaying && styles.btnDisabled]}
                onPress={() => handlePayBill(bId)}
                disabled={isPaying}
              >
                {isPaying ? (
                  <ActivityIndicator size="small" color="#0f766e" />
                ) : (
                  <Text style={styles.payBtnText}>💳 Record Payment (Mark Paid)</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.cardBtnRow}>
              <TouchableOpacity
                style={styles.editCardBtn}
                onPress={() => handleStartEdit(b)}
              >
                <Text style={styles.editCardBtnText}>✏️ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteCardBtn}
                onPress={() => handleDeleteBill(b)}
              >
                <Text style={styles.deleteCardBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareCardBtn}
                onPress={() => handleShareInvoice(b)}
              >
                <Text style={styles.shareCardBtnText}>📤 Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1, width: '100%' }}
        data={filteredBills}
        keyExtractor={(item, index) => item._id || item.id || `bill-${index}`}
        renderItem={renderBillItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0f766e']}
            tintColor="#0f766e"
          />
        }
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* ── New / Edit Invoice Modal ─────────────────────────────────────────────── */}
      <Modal visible={isModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => { setIsModalOpen(false); resetFormState(); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {editingBillId ? 'Edit Patient Invoice' : 'Generate Patient Invoice'}
                    </Text>
                    {editingBillId && (
                      <Text style={styles.editingBadge}>
                        Modifying Invoice #{String(editingBillId).slice(-6).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => { setIsModalOpen(false); resetFormState(); }}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                ) : null}

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Patient Selection Searchable Dropdown */}
                <View style={[styles.fieldGroup, { zIndex: 10 }]}>
                  <Text style={styles.fieldLabel}>SELECT PATIENT *</Text>

                  {selectedPatientId ? (
                    <View style={styles.selectedPatientBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectedPatientName}>
                          👤 {patients.find((p) => (p._id || p.id) === selectedPatientId)?.name || 'Selected Patient'}
                        </Text>
                        {patients.find((p) => (p._id || p.id) === selectedPatientId)?.phone ? (
                          <Text style={styles.selectedPatientSub}>
                            📞 {patients.find((p) => (p._id || p.id) === selectedPatientId)?.phone}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={styles.changePatientBtn}
                        onPress={() => {
                          setSelectedPatientId('');
                          setPatientSearchQuery('');
                          setIsPatientDropdownOpen(true);
                        }}
                      >
                        <Text style={styles.changePatientBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="🔍 Type patient name or phone..."
                        placeholderTextColor="#94a3b8"
                        value={patientSearchQuery}
                        onChangeText={(txt) => {
                          setPatientSearchQuery(txt);
                          setIsPatientDropdownOpen(true);
                          setIsTestDropdownOpen(false);
                          setIsMedicineDropdownOpen(false);
                        }}
                        onFocus={() => {
                          setIsPatientDropdownOpen(true);
                          setIsTestDropdownOpen(false);
                          setIsMedicineDropdownOpen(false);
                        }}
                      />
                      {patientSearchQuery ? (
                        <TouchableOpacity
                          style={styles.clearSearchBtn}
                          onPress={() => setPatientSearchQuery('')}
                        >
                          <Text style={styles.clearSearchText}>✕</Text>
                        </TouchableOpacity>
                      ) : null}

                      {isPatientDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {patients
                            .filter(
                              (p) =>
                                (p.name || '')
                                  .toLowerCase()
                                  .includes(patientSearchQuery.toLowerCase()) ||
                                (p.phone || '').includes(patientSearchQuery)
                            )
                            .slice(0, 5).length === 0 ? (
                            <View style={styles.dropdownEmpty}>
                              <Text style={styles.dropdownEmptyText}>
                                No registered patients matched.
                              </Text>
                            </View>
                          ) : (
                            <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                              {patients
                                .filter(
                                  (p) =>
                                    (p.name || '')
                                      .toLowerCase()
                                      .includes(patientSearchQuery.toLowerCase()) ||
                                    (p.phone || '').includes(patientSearchQuery)
                                )
                                .slice(0, 8)
                                .map((p, pIdx) => (
                                  <TouchableOpacity
                                    key={p._id || p.id || `p-opt-${pIdx}`}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                      handlePatientSelect(p._id || p.id);
                                      setIsPatientDropdownOpen(false);
                                      setPatientSearchQuery('');
                                    }}
                                  >
                                    <Text style={styles.dropdownItemName}>
                                      👤 {p.name} ({p.gender || 'Gen'}, {p.age || '—'}y)
                                    </Text>
                                    {p.phone ? <Text style={styles.dropdownItemSub}>📞 {p.phone}</Text> : null}
                                  </TouchableOpacity>
                                ))}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Consult Fee */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CONSULTATION FEE (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="0"
                    keyboardType="number-pad"
                    value={consultationFee}
                    onChangeText={setConsultationFee}
                  />
                  {parseFloat(consultationFee) > 0 && (
                    <Text style={styles.feeHint}>💡 Auto-filled from last completed appointment</Text>
                  )}
                </View>

                {/* Follow-Up Date & Reminder */}
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>⏰ FOLLOW-UP DATE (OPTIONAL)</Text>
                    {followUpDate ? (
                      <TouchableOpacity onPress={() => setFollowUpDate('')}>
                        <Text style={styles.clearDateText}>✕ Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Date Quick Presets */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                    {[
                      { label: '3 Days', days: 3 },
                      { label: '5 Days', days: 5 },
                      { label: '1 Week', days: 7 },
                      { label: '2 Weeks', days: 14 },
                      { label: '1 Month', days: 30 },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.label}
                        style={styles.presetChip}
                        onPress={() => setPresetDate(p.days)}
                      >
                        <Text style={styles.presetChipText}>+{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                    {followUpDate ? (
                      <TouchableOpacity
                        style={[styles.presetChip, styles.presetChipClear]}
                        onPress={() => setFollowUpDate('')}
                      >
                        <Text style={styles.presetChipClearText}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </ScrollView>

                  {/* Pick Date Button */}
                  <TouchableOpacity
                    style={[styles.datePickerBtn, followUpDate ? styles.datePickerBtnActive : null]}
                    onPress={() => setIsFollowUpCalendarOpen(true)}
                  >
                    <Text style={styles.datePickerBtnIcon}>📅</Text>
                    <Text style={[styles.datePickerBtnText, followUpDate ? styles.datePickerBtnTextActive : null]}>
                      {followUpDate
                        ? `Follow-up on: ${new Date(followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : 'Select Follow-up Revisit Date...'}
                    </Text>
                    <Text style={styles.datePickerBtnArrow}>→</Text>
                  </TouchableOpacity>

                  <Text style={styles.followUpHint}>
                    💡 Creates an OpdReminder alert for patient revisit in Reminders feed.
                  </Text>
                </View>

                {/* Add Diagnostic Tests Dropdown */}
                <View style={[styles.fieldGroup, { zIndex: 9 }]}>
                  <Text style={styles.fieldLabel}>ADD DIAGNOSTIC TEST</Text>
                  <View style={{ position: 'relative' }}>
                    <View style={styles.dropdownInputWrapper}>
                      <TextInput
                        style={styles.dropdownInputField}
                        placeholder="🔍 Search & select diagnostic test..."
                        placeholderTextColor="#94a3b8"
                        value={testSearchQuery}
                        onChangeText={(txt) => {
                          setTestSearchQuery(txt);
                          setIsTestDropdownOpen(true);
                          setIsPatientDropdownOpen(false);
                          setIsMedicineDropdownOpen(false);
                        }}
                        onFocus={() => {
                          setIsTestDropdownOpen(true);
                          setIsPatientDropdownOpen(false);
                          setIsMedicineDropdownOpen(false);
                        }}
                      />
                      {testSearchQuery ? (
                        <TouchableOpacity
                          style={styles.dropdownActionBtn}
                          onPress={() => setTestSearchQuery('')}
                        >
                          <Text style={styles.clearSearchText}>✕</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.dropdownActionBtn}
                          onPress={() => {
                            setIsTestDropdownOpen(!isTestDropdownOpen);
                            setIsPatientDropdownOpen(false);
                            setIsMedicineDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownArrowText}>{isTestDropdownOpen ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {isTestDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {testsCatalog.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>No diagnostic tests available in catalog.</Text>
                          </View>
                        ) : filteredTests.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>No tests match "{testSearchQuery}"</Text>
                          </View>
                        ) : (
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                            {filteredTests.map((t, tIdx) => {
                              const isAdded = selectedTests.some((s) => s.testId === (t._id || t.id));
                              return (
                                <TouchableOpacity
                                  key={t._id || t.id || `t-cat-${tIdx}`}
                                  style={[styles.dropdownItem, isAdded && styles.dropdownItemSelected]}
                                  onPress={() => {
                                    handleAddTest(t);
                                    setTestSearchQuery('');
                                    setIsTestDropdownOpen(false);
                                  }}
                                >
                                  <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={[styles.dropdownItemName, isAdded && styles.dropdownItemNameActive]}>
                                      🧪 {t.name}
                                    </Text>
                                    {t.category ? (
                                      <Text style={styles.dropdownItemSub}>{t.category}</Text>
                                    ) : null}
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.dropdownItemPrice}>₹{t.price}</Text>
                                    {isAdded ? (
                                      <View style={styles.addedBadge}>
                                        <Text style={styles.addedBadgeText}>✓ Added</Text>
                                      </View>
                                    ) : (
                                      <View style={styles.addBadge}>
                                        <Text style={styles.addBadgeText}>+ Add</Text>
                                      </View>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Add Pharmacy Medicine Dropdown */}
                <View style={[styles.fieldGroup, { zIndex: 8 }]}>
                  <Text style={styles.fieldLabel}>ADD PHARMACY MEDICINE</Text>
                  <View style={{ position: 'relative' }}>
                    <View style={styles.dropdownInputWrapper}>
                      <TextInput
                        style={styles.dropdownInputField}
                        placeholder="🔍 Search & select pharmacy medicine..."
                        placeholderTextColor="#94a3b8"
                        value={medicineSearchQuery}
                        onChangeText={(txt) => {
                          setMedicineSearchQuery(txt);
                          setIsMedicineDropdownOpen(true);
                          setIsPatientDropdownOpen(false);
                          setIsTestDropdownOpen(false);
                        }}
                        onFocus={() => {
                          setIsMedicineDropdownOpen(true);
                          setIsPatientDropdownOpen(false);
                          setIsTestDropdownOpen(false);
                        }}
                      />
                      {medicineSearchQuery ? (
                        <TouchableOpacity
                          style={styles.dropdownActionBtn}
                          onPress={() => setMedicineSearchQuery('')}
                        >
                          <Text style={styles.clearSearchText}>✕</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.dropdownActionBtn}
                          onPress={() => {
                            setIsMedicineDropdownOpen(!isMedicineDropdownOpen);
                            setIsPatientDropdownOpen(false);
                            setIsTestDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownArrowText}>{isMedicineDropdownOpen ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {isMedicineDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {medicinesCatalog.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>No medicines available in catalog.</Text>
                          </View>
                        ) : filteredMedicines.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>No medicines match "{medicineSearchQuery}"</Text>
                          </View>
                        ) : (
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                            {filteredMedicines.map((m, mIdx) => {
                              const isAdded = selectedMedicines.some((s) => s.medicineId === (m._id || m.id));
                              const outOfStock = (m.stock ?? 0) <= 0;
                              return (
                                <TouchableOpacity
                                  key={m._id || m.id || `m-cat-${mIdx}`}
                                  style={[
                                    styles.dropdownItem,
                                    isAdded && styles.dropdownItemSelected,
                                    outOfStock && styles.dropdownItemDisabled,
                                  ]}
                                  onPress={() => {
                                    if (!outOfStock) {
                                      handleAddMedicine(m);
                                      setMedicineSearchQuery('');
                                      setIsMedicineDropdownOpen(false);
                                    }
                                  }}
                                  disabled={outOfStock}
                                >
                                  <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text
                                      style={[
                                        styles.dropdownItemName,
                                        isAdded && styles.dropdownItemNameActive,
                                        outOfStock && styles.dropdownItemTextDisabled,
                                      ]}
                                    >
                                      💊 {m.name} {m.strength ? `(${m.strength})` : ''}
                                    </Text>
                                    <Text style={styles.dropdownItemSub}>
                                      {outOfStock ? '⚠️ Out of Stock' : `Stock: ${m.stock ?? 'N/A'}`}
                                    </Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.dropdownItemPrice, outOfStock && styles.dropdownItemTextDisabled]}>
                                      ₹{m.price}
                                    </Text>
                                    {outOfStock ? (
                                      <View style={styles.outStockBadge}>
                                        <Text style={styles.outStockBadgeText}>No Stock</Text>
                                      </View>
                                    ) : isAdded ? (
                                      <View style={styles.addedBadge}>
                                        <Text style={styles.addedBadgeText}>✓ Added</Text>
                                      </View>
                                    ) : (
                                      <View style={styles.addBadge}>
                                        <Text style={styles.addBadgeText}>+ Add</Text>
                                      </View>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Selected Items Line-Items Preview */}
                {(selectedTests.length > 0 ||
                  selectedMedicines.length > 0 ||
                  grossConsultation > 0) && (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryTitle}>INVOICE BREAKDOWN</Text>

                      {grossConsultation > 0 && (
                        <View style={styles.summaryTestCard}>
                          <View style={styles.summaryRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.summaryItemLabel}>👨‍⚕️ Doctor Consultation Fee</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {consultDiscountAmt > 0 && (
                                <Text style={styles.itemOriginalPrice}>₹{grossConsultation.toFixed(2)}</Text>
                              )}
                              <Text style={styles.summaryItemValue}>₹{netConsultation.toFixed(2)}</Text>
                            </View>
                          </View>

                          <View style={styles.itemDiscountInlineRow}>
                            <Text style={styles.itemDiscountLabel}>Item Discount:</Text>
                            <TouchableOpacity
                              style={styles.itemDiscountToggleBtn}
                              onPress={() => setConsultationDiscountType(consultationDiscountType === 'fixed' ? 'percentage' : 'fixed')}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.itemDiscountToggleText}>
                                {consultationDiscountType === 'percentage' ? '%' : '₹ Flat'}
                              </Text>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.itemDiscountInput}
                              keyboardType="numeric"
                              placeholder={consultationDiscountType === 'percentage' ? '0 %' : '₹ 0'}
                              placeholderTextColor="#94a3b8"
                              value={consultationDiscount === '0' || consultationDiscount === 0 ? '' : String(consultationDiscount)}
                              onChangeText={(val) => setConsultationDiscount(val)}
                            />
                            {consultDiscountAmt > 0 && (
                              <Text style={styles.itemDiscountDeductionText}>-₹{consultDiscountAmt.toFixed(2)}</Text>
                            )}
                          </View>
                        </View>
                      )}

                      {selectedTests.map((t, idx) => {
                        const p = parseFloat(t.price) || 0;
                        const d = Math.max(0, parseFloat(t.discount) || 0);
                        const discAmt = t.discountType === 'percentage' ? (p * Math.min(100, d)) / 100 : Math.min(p, d);
                        const netP = Math.max(0, p - discAmt);
                        return (
                          <View key={`sel-t-${t.testId || t._id || t.id || idx}-${idx}`} style={styles.summaryTestCard}>
                            <View style={styles.summaryRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.summaryItemLabel}>🧪 {formatItemName(t.name)}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {discAmt > 0 && (
                                  <Text style={styles.itemOriginalPrice}>₹{p.toFixed(2)}</Text>
                                )}
                                <Text style={styles.summaryItemValue}>₹{netP.toFixed(2)}</Text>
                              </View>
                              <TouchableOpacity onPress={() => handleRemoveTest(t.testId)} style={{ marginLeft: 8 }}>
                                <Text style={styles.removeBtn}>✕</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Test Discount Inline Row */}
                            <View style={styles.itemDiscountInlineRow}>
                              <Text style={styles.itemDiscountLabel}>Item Discount:</Text>
                              <TouchableOpacity
                                style={styles.itemDiscountToggleBtn}
                                onPress={() => handleTestDiscountTypeToggle(idx)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.itemDiscountToggleText}>
                                  {t.discountType === 'percentage' ? '%' : '₹ Flat'}
                                </Text>
                              </TouchableOpacity>
                              <TextInput
                                style={styles.itemDiscountInput}
                                keyboardType="numeric"
                                placeholder={t.discountType === 'percentage' ? '0 %' : '₹ 0'}
                                placeholderTextColor="#94a3b8"
                                value={t.discount === 0 || t.discount === '0' ? '' : String(t.discount)}
                                onChangeText={(val) => handleTestDiscountChange(idx, val)}
                              />
                              {discAmt > 0 && (
                                <Text style={styles.itemDiscountDeductionText}>-₹{discAmt.toFixed(2)}</Text>
                              )}
                            </View>

                            {/* Test Scheduling Row */}
                            <View style={styles.testScheduleRow}>
                              <View style={styles.testScheduleCol}>
                                <Text style={styles.testScheduleLabel}>📅 Schedule Date:</Text>
                                <TouchableOpacity
                                  style={styles.testDateBtn}
                                  onPress={() => {
                                    setCalendarTargetTestIdx(idx);
                                    setIsCalendarOpen(true);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.testDateBtnText}>
                                    {t.scheduledDate || 'Pick Date'}
                                  </Text>
                                  <Text style={styles.testDateEditIcon}>📅</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.testScheduleCol}>
                                <Text style={styles.testScheduleLabel}>📝 Lab Note:</Text>
                                <TextInput
                                  style={styles.testScheduleInput}
                                  value={t.notes || ''}
                                  placeholder="e.g. Fasting, Urgent"
                                  placeholderTextColor="#94a3b8"
                                  onChangeText={(val) => handleTestNotesChange(idx, val)}
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}

                      {selectedMedicines.map((m, idx) => {
                        const catMed = medicinesCatalog.find((c) => (c._id || c.id) === m.medicineId);
                        const availableStock =
                          m.stock !== undefined
                            ? Number(m.stock)
                            : catMed?.stock !== undefined
                              ? Number(catMed.stock)
                              : 999;
                        const currentQty = parseInt(m.quantity, 10) || 1;
                        const isMaxStock = currentQty >= availableStock;
                        const isMinQty = currentQty <= 1;

                        const grossM = (parseFloat(m.price) || 0) * currentQty;
                        const d = Math.max(0, parseFloat(m.discount) || 0);
                        const discAmt = m.discountType === 'percentage' ? (grossM * Math.min(100, d)) / 100 : Math.min(grossM, d);
                        const netM = Math.max(0, grossM - discAmt);

                        return (
                          <View key={`sel-m-${m.medicineId || m._id || m.id || idx}-${idx}`} style={styles.summaryTestCard}>
                            <View style={styles.summaryRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.summaryItemLabel}>💊 {formatItemName(m.name)}</Text>
                                <View style={styles.qtyPriceRow}>
                                  <Text style={styles.qtyLabel}>Qty:</Text>
                                  <View style={styles.stepperContainer}>
                                    <TouchableOpacity
                                      style={[styles.stepperBtn, isMinQty && styles.stepperBtnDisabled]}
                                      onPress={() => handleMedicineQtyIncrement(idx, -1)}
                                      disabled={isMinQty}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[styles.stepperBtnText, isMinQty && styles.stepperBtnTextDisabled]}>−</Text>
                                    </TouchableOpacity>
                                    <TextInput
                                      style={styles.qtyInput}
                                      keyboardType="number-pad"
                                      value={String(m.quantity || 1)}
                                      onChangeText={(val) => handleMedicineQtyChange(idx, val)}
                                    />
                                    <TouchableOpacity
                                      style={[styles.stepperBtn, isMaxStock && styles.stepperBtnDisabled]}
                                      onPress={() => handleMedicineQtyIncrement(idx, 1)}
                                      disabled={isMaxStock}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[styles.stepperBtnText, isMaxStock && styles.stepperBtnTextDisabled]}>+</Text>
                                    </TouchableOpacity>
                                  </View>
                                  <Text style={styles.qtyLabel}>@ ₹{m.price}</Text>
                                  {availableStock < 999 && (
                                    <Text style={styles.stockCapHint}>Max: {availableStock}</Text>
                                  )}
                                </View>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {discAmt > 0 && (
                                  <Text style={styles.itemOriginalPrice}>₹{grossM.toFixed(2)}</Text>
                                )}
                                <Text style={styles.summaryItemValue}>₹{netM.toFixed(2)}</Text>
                              </View>
                              <TouchableOpacity onPress={() => handleRemoveMedicine(m.medicineId)} style={{ marginLeft: 8 }}>
                                <Text style={styles.removeBtn}>✕</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Medicine Discount Inline Row */}
                            <View style={styles.itemDiscountInlineRow}>
                              <Text style={styles.itemDiscountLabel}>Item Discount:</Text>
                              <TouchableOpacity
                                style={styles.itemDiscountToggleBtn}
                                onPress={() => handleMedicineDiscountTypeToggle(idx)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.itemDiscountToggleText}>
                                  {m.discountType === 'percentage' ? '%' : '₹ Flat'}
                                </Text>
                              </TouchableOpacity>
                              <TextInput
                                style={styles.itemDiscountInput}
                                keyboardType="numeric"
                                placeholder={m.discountType === 'percentage' ? '0 %' : '₹ 0'}
                                placeholderTextColor="#94a3b8"
                                value={m.discount === 0 || m.discount === '0' ? '' : String(m.discount)}
                                onChangeText={(val) => handleMedicineDiscountChange(idx, val)}
                              />
                              {discAmt > 0 && (
                                <Text style={styles.itemDiscountDeductionText}>-₹{discAmt.toFixed(2)}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}

                      <View style={styles.subtotalRow}>
                        <Text style={styles.subtotalLabel}>Gross Subtotal</Text>
                        <Text style={styles.subtotalValue}>₹{grossSubtotal.toFixed(2)}</Text>
                      </View>

                      {itemDiscountsTotal > 0 && (
                        <View style={styles.subtotalRow}>
                          <Text style={[styles.subtotalLabel, { color: '#047857' }]}>Item Discounts</Text>
                          <Text style={[styles.subtotalValue, { color: '#047857' }]}>-₹{itemDiscountsTotal.toFixed(2)}</Text>
                        </View>
                      )}

                      {itemDiscountsTotal > 0 && (
                        <View style={styles.subtotalRow}>
                          <Text style={styles.subtotalLabel}>Net Subtotal</Text>
                          <Text style={styles.subtotalValue}>₹{netSubtotal.toFixed(2)}</Text>
                        </View>
                      )}

                      {/* Overall Invoice Discount Control Box */}
                      <View style={styles.discountContainer}>
                        <View style={styles.discountHeaderRow}>
                          <Text style={styles.discountHeaderTitle}>🏷️ Overall Invoice Discount</Text>
                          {calculatedInvoiceDiscount > 0 && (
                            <Text style={styles.discountBadgeText}>-₹{calculatedInvoiceDiscount.toFixed(2)}</Text>
                          )}
                        </View>

                        <View style={styles.discountInputRow}>
                          <View style={styles.discountTypeToggle}>
                            <TouchableOpacity
                              style={[
                                styles.discountTypeBtn,
                                discountType === 'fixed' && styles.discountTypeBtnActive,
                              ]}
                              onPress={() => setDiscountType('fixed')}
                            >
                              <Text
                                style={[
                                  styles.discountTypeBtnText,
                                  discountType === 'fixed' && styles.discountTypeBtnTextActive,
                                ]}
                              >
                                ₹ Flat
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.discountTypeBtn,
                                discountType === 'percentage' && styles.discountTypeBtnActive,
                              ]}
                              onPress={() => setDiscountType('percentage')}
                            >
                              <Text
                                style={[
                                  styles.discountTypeBtnText,
                                  discountType === 'percentage' && styles.discountTypeBtnTextActive,
                                ]}
                              >
                                %
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <TextInput
                            style={styles.discountInput}
                            keyboardType="numeric"
                            placeholder={discountType === 'percentage' ? '0 %' : '₹ 0.00'}
                            placeholderTextColor="#9ca3af"
                            value={discount === '0' || discount === 0 ? '' : String(discount)}
                            onChangeText={(val) => setDiscount(val)}
                          />
                        </View>

                        <TextInput
                          style={styles.discountReasonInput}
                          placeholder="Discount note / reason (optional)"
                          placeholderTextColor="#9ca3af"
                          value={discountReason}
                          onChangeText={(val) => setDiscountReason(val)}
                        />
                      </View>

                      <View style={styles.grandTotalRow}>
                        <View>
                          <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                          {totalAllDiscounts > 0 && (
                            <Text style={styles.grandTotalSubhint}>
                              Includes -₹{totalAllDiscounts.toFixed(2)} total discounts
                            </Text>
                          )}
                        </View>
                        <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
                      </View>
                    </View>
                  )}

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={() => handleCreateBill('Pending')}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingBillId ? 'Save Changes' : 'Generate & Issue Invoice'}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Interactive Calendar Date Picker Modal for Tests */}
      <CalendarPickerModal
        visible={isCalendarOpen}
        currentDate={
          calendarTargetTestIdx !== null
            ? selectedTests[calendarTargetTestIdx]?.scheduledDate
            : undefined
        }
        title="Schedule Diagnostic Test Date"
        onClose={() => {
          setIsCalendarOpen(false);
          setCalendarTargetTestIdx(null);
        }}
        onSelectDate={(newDate) => {
          if (calendarTargetTestIdx !== null) {
            handleTestScheduleDateChange(calendarTargetTestIdx, newDate);
          }
        }}
      />

      {/* Follow-up Interactive Calendar Date Picker Modal */}
      <CalendarPickerModal
        visible={isFollowUpCalendarOpen}
        currentDate={followUpDate || undefined}
        title="Select Patient Follow-up Date"
        minDate={new Date().toISOString().substring(0, 10)}
        onClose={() => setIsFollowUpCalendarOpen(false)}
        onSelectDate={(newDate) => {
          setFollowUpDate(newDate);
          setIsFollowUpCalendarOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc', paddingBottom: 110 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  searchBox: { marginBottom: 4 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#ccfbf1', gap: 6, width: '100%', alignSelf: 'stretch', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNo: { fontSize: 13, fontWeight: '700', color: '#0f766e' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPaid: { backgroundColor: '#f0fdf4' },
  statusPending: { backgroundColor: '#fff7ed' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadgeTextPaid: { color: '#16a34a' },
  statusBadgeTextPending: { color: '#d97706' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  billType: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  itemizedBox: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', alignSelf: 'stretch' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3, width: '100%' },
  itemColLeft: { flex: 1, minWidth: 0, flexShrink: 1, marginRight: 8 },
  itemColRight: { alignItems: 'flex-end', flexShrink: 0, paddingRight: 4 },
  itemLabel: { fontSize: 12, color: '#334155', fontWeight: '500', flexWrap: 'wrap' },
  itemDiscountSubtext: { fontSize: 10, color: '#047857', fontWeight: '700', marginTop: 1.5, flexWrap: 'wrap' },
  itemCrossedPrice: { fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through', paddingRight: 2 },
  itemValue: { fontSize: 12, fontWeight: '700', color: '#0f172a', paddingRight: 2 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6, marginTop: 4, width: '100%' },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#0D9488', paddingRight: 2 },
  billActions: { gap: 8, marginTop: 4 },
  payBtn: { backgroundColor: '#ccfbf1', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  cardBtnRow: { flexDirection: 'row', gap: 8 },
  editCardBtn: { flex: 1, backgroundColor: '#fef3c7', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a' },
  editCardBtnText: { color: '#b45309', fontWeight: '700', fontSize: 12 },
  deleteCardBtn: { flex: 1, backgroundColor: '#ffe4e6', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' },
  deleteCardBtnText: { color: '#e11d48', fontWeight: '700', fontSize: 12 },
  shareCardBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  shareCardBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 20, gap: 14, paddingBottom: 100 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  editingBadge: { fontSize: 11, fontWeight: '700', color: '#d97706', marginTop: 2 },
  modalClose: { fontSize: 20, color: '#64748b', fontWeight: '700' },
  successBox: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, padding: 10, borderRadius: 10 },
  successText: { color: '#047857', fontWeight: '700', fontSize: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 10, borderRadius: 10 },
  errorText: { color: '#b91c1c', fontSize: 13 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  feeHint: { fontSize: 11, color: '#0f766e', fontWeight: '600' },
  summaryBox: { backgroundColor: '#f0fdfa', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#99f6e4', gap: 8 },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: '#0f766e', marginBottom: 4 },
  summaryTestCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    gap: 6,
  },
  testScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  testScheduleCol: {
    flex: 1,
    gap: 2,
  },
  testScheduleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f766e',
  },
  testScheduleInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: '#0f172a',
  },
  testDateBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testDateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  testDateEditIcon: {
    fontSize: 10,
    color: '#0D9488',
    marginLeft: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItemLabel: { fontSize: 12, color: '#475569' },
  summaryItemValue: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginLeft: 8 },
  itemOriginalPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  itemDiscountInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemDiscountLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  itemDiscountToggleBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  itemDiscountToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f766e',
  },
  itemDiscountInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  },
  itemDiscountDeductionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 'auto',
  },
  removeBtn: { fontSize: 14, color: '#ef4444', fontWeight: '700' },
  qtyPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  qtyLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 26,
    height: 26,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#f8fafc',
    opacity: 0.35,
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f766e',
    lineHeight: 16,
  },
  stepperBtnTextDisabled: {
    color: '#94a3b8',
  },
  stockCapHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 2,
  },
  qtyInput: {
    width: 34,
    paddingVertical: 2,
    paddingHorizontal: 2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 4 },
  subtotalLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  subtotalValue: { fontSize: 14, fontWeight: '700', color: '#334155' },
  discountContainer: { backgroundColor: '#ffffff', borderRadius: 10, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  discountHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  discountHeaderTitle: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  discountBadgeText: { fontSize: 12, fontWeight: '800', color: '#047857', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  discountInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  discountTypeToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  discountTypeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  discountTypeBtnActive: { backgroundColor: '#0D9488' },
  discountTypeBtnText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  discountTypeBtnTextActive: { color: '#ffffff' },
  discountInput: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, fontWeight: '700', color: '#0f172a', backgroundColor: '#f8fafc' },
  discountReasonInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#334155', backgroundColor: '#f8fafc', marginTop: 8 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ccfbf1', paddingTop: 10, marginTop: 4 },
  grandTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0f766e' },
  grandTotalSubhint: { fontSize: 10, color: '#047857', fontWeight: '600', marginTop: 2 },
  grandTotalValue: { fontSize: 24, fontWeight: '800', color: '#0f766e' },
  submitBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  selectedPatientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedPatientName: { fontSize: 14, fontWeight: '700', color: '#0f766e' },
  selectedPatientSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  changePatientBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changePatientBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  clearSearchBtn: { position: 'absolute', right: 12, top: 14 },
  clearSearchText: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  dropdownInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  dropdownInputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  dropdownActionBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dropdownArrowText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fdfa',
  },
  dropdownItemName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  dropdownItemNameActive: { color: '#0D9488', fontWeight: '700' },
  dropdownItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  dropdownItemPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  dropdownEmpty: { padding: 14, alignItems: 'center' },
  dropdownEmptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  addBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  addedBadge: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  outStockBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  dropdownItemDisabled: {
    opacity: 0.55,
    backgroundColor: '#f8fafc',
  },
  dropdownItemTextDisabled: {
    color: '#94a3b8',
  },
  followUpCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  followUpCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  followUpBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followUpBadgeDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
  },
  followUpStatusPill: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followUpStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clearDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  presetScroll: {
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  presetChipClear: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
  presetChipClearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerBtnActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0D9488',
  },
  datePickerBtnIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  datePickerBtnText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  datePickerBtnTextActive: {
    color: '#0f766e',
    fontWeight: '700',
  },
  datePickerBtnArrow: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  followUpHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});
