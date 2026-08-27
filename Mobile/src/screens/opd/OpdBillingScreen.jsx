import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';

export default function OpdBillingScreen({ routeParams }) {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testsCatalog, setTestsCatalog] = useState([]);
  const [medicinesCatalog, setMedicinesCatalog] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingBillId, setPayingBillId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [consultationFee, setConsultationFee] = useState('0');
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
    fetchData();
  }, []);

  useEffect(() => {
    if (routeParams?.patientId) {
      setSelectedPatientId(routeParams.patientId);
      if (routeParams.consultationFee) {
        setConsultationFee(String(routeParams.consultationFee));
      }
      setEditingBillId(null);
      setIsModalOpen(true);
    }
  }, [routeParams]);

  const resetFormState = () => {
    setSelectedPatientId('');
    setConsultationFee('0');
    setSelectedTests([]);
    setSelectedMedicines([]);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      try {
        const bRes = await apiClient.get('/api/opd/billing');
        const bData = bRes.data?.bills || bRes.data || [];
        setBills(Array.isArray(bData) ? bData : []);
      } catch (e) {}

      try {
        const pRes = await apiClient.get('/api/opd/patients');
        const pData = pRes.data?.patients || pRes.data || [];
        setPatients(Array.isArray(pData) ? pData : []);
      } catch (e) {}

      try {
        const tRes = await apiClient.get('/api/opd/tests');
        const tData = tRes.data?.tests || tRes.data || [];
        setTestsCatalog(Array.isArray(tData) ? tData : []);
      } catch (e) {}

      try {
        const mRes = await apiClient.get('/api/opd/medicines');
        const mData = mRes.data?.medicines || mRes.data || [];
        setMedicinesCatalog(Array.isArray(mData) ? mData : []);
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patientId) => {
    setSelectedPatientId(patientId);
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
    } catch (e) {}
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
        },
      ]);
    }
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
          stock: availableStock,
        },
      ]);
    }
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

  const subtotalConsultation = parseFloat(consultationFee) || 0;
  const subtotalTests = selectedTests.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0),
    0
  );
  const subtotalMedicines = selectedMedicines.reduce(
    (acc, item) =>
      acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
    0
  );

  const grandTotal = subtotalConsultation + subtotalTests + subtotalMedicines;

  const handleStartEdit = (bill) => {
    setEditingBillId(bill._id || bill.id);
    setSelectedPatientId(bill.patientId?._id || bill.patientId || '');
    setConsultationFee(String(bill.consultationFee || 0));
    setSelectedTests(
      (bill.tests || []).map((t) => ({
        testId: t.testId?._id || t.testId || t._id || t.id,
        name: t.name,
        price: t.price,
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
          stock: catMed?.stock !== undefined ? Number(catMed.stock) : (m.medicineId?.stock ?? 999),
        };
      })
    );
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

      if (subtotalConsultation > 0) {
        items.push({
          itemType: 'Consultation',
          name: 'Doctor Consultation Fee',
          price: subtotalConsultation,
          quantity: 1,
        });
      }

      selectedTests.forEach((t) => {
        items.push({
          itemType: 'Test',
          name: t.name,
          price: parseFloat(t.price) || 0,
          quantity: 1,
        });
      });

      selectedMedicines.forEach((m) => {
        items.push({
          itemType: 'Medicine',
          name: m.name,
          price: parseFloat(m.price) || 0,
          quantity: parseInt(m.quantity) || 1,
        });
      });

      const hasConsult = subtotalConsultation > 0;
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
      }));

      const formattedMedicines = selectedMedicines.map((m) => ({
        medicineId: m.medicineId || m._id || m.id,
        name: m.name,
        price: parseFloat(m.price) || 0,
        quantity: parseInt(m.quantity) || 1,
      }));

      const payload = {
        patientId: selectedPatientId,
        consultationFee: subtotalConsultation,
        tests: formattedTests,
        medicines: formattedMedicines,
        billingType,
        totalAmount: grandTotal,
        status,
        items,
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
      setError(err.response?.data?.message || 'Error saving invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInvoice = async (bill) => {
    const isPaid = bill.status === 'Paid';
    const text =
      `🧾 HEKA MEDICAL CENTER — Official Invoice\n` +
      `----------------------------------------\n` +
      `Bill ID       : ${bill._id || bill.id}\n` +
      `Patient       : ${bill.patientName || bill.patientId?.name || 'Patient'}\n` +
      `Date          : ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}\n` +
      `Status        : ${isPaid ? 'PAID' : 'PENDING'}\n` +
      `Total Amount  : ₹${bill.totalAmount}\n` +
      `----------------------------------------\n` +
      `Thank you for choosing Heka Healthcare! 🏥`;

    try {
      await Share.share({ message: text });
    } catch (e) {}
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title}>OPD Billing & Invoices</Text>
            <Text style={styles.subtitle}>Checkout patients, generate bills & accept payments</Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ New Bill</Text>
          </TouchableOpacity>
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

        {/* Invoices List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading Billing Records...</Text>
          </View>
        ) : filteredBills.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptyText}>Tap "+ New Bill" to generate a consultation or diagnostic invoice.</Text>
          </View>
        ) : (
          filteredBills.map((b, bIdx) => {
            const isPaid = b.status === 'Paid';
            const bId = b._id || b.id;
            const isPaying = payingBillId === bId;

            return (
            <View key={bId || `bill-card-${bIdx}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
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
                    <Text style={styles.itemLabel}>👨‍⚕️ Doctor Consultation</Text>
                    <Text style={styles.itemValue}>₹{b.consultationFee}</Text>
                  </View>
                )}

                {b.tests?.map((t, idx) => (
                  <View key={`b-test-${t.testId?._id || t.testId || t.name || idx}-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>🧪 {t.testId?.name || t.name || 'Diagnostic Test'}</Text>
                    <Text style={styles.itemValue}>₹{t.price}</Text>
                  </View>
                ))}

                {b.medicines?.map((m, idx) => (
                  <View key={`b-med-${m.medicineId?._id || m.medicineId || m.name || idx}-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>💊 {m.medicineId?.name || m.name} (x{m.quantity || 1})</Text>
                    <Text style={styles.itemValue}>₹{(m.price || 0) * (m.quantity || 1)}</Text>
                  </View>
                ))}

                <View style={[styles.itemRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{b.totalAmount}</Text>
                </View>

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
        })
        )}
      </ScrollView>

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
                  parseFloat(consultationFee) > 0) && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>INVOICE BREAKDOWN</Text>

                    {parseFloat(consultationFee) > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryItemLabel}>👨‍⚕️ Doctor Consultation Fee</Text>
                        <Text style={styles.summaryItemValue}>₹{consultationFee}</Text>
                      </View>
                    )}

                    {selectedTests.map((t, idx) => (
                      <View key={`sel-t-${t.testId || t._id || t.id || idx}-${idx}`} style={styles.summaryRow}>
                        <Text style={styles.summaryItemLabel}>🧪 {t.name}</Text>
                        <Text style={styles.summaryItemValue}>₹{t.price}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTest(t.testId)} style={{ marginLeft: 8 }}>
                          <Text style={styles.removeBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

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

                      return (
                        <View key={`sel-m-${m.medicineId || m._id || m.id || idx}-${idx}`} style={styles.summaryRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.summaryItemLabel}>💊 {m.name}</Text>
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
                          <Text style={styles.summaryItemValue}>
                            ₹{(parseFloat(m.price) || 0) * currentQty}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveMedicine(m.medicineId)} style={{ marginLeft: 8 }}>
                            <Text style={styles.removeBtn}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <View style={styles.grandTotalRow}>
                      <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                      <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#ccfbf1', gap: 6 },
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
  itemizedBox: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLabel: { fontSize: 12, color: '#64748b' },
  itemValue: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#0D9488' },
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
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItemLabel: { fontSize: 12, color: '#475569' },
  summaryItemValue: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginLeft: 8 },
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
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ccfbf1', paddingTop: 10, marginTop: 4 },
  grandTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0f766e' },
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
});
