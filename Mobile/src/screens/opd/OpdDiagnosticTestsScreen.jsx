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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';

export default function OpdDiagnosticTestsScreen() {
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testOrders, setTestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active tab: 'catalog' | 'orders'
  const [activeTab, setActiveTab] = useState('catalog');

  // Add Test Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', category: 'General' });

  // Edit Test Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: '', category: '' });

  // Schedule Test Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    testId: '',
    notes: '',
    scheduledDate: new Date().toISOString().substring(0, 10),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/opd/tests');
      const data = res.data?.tests || res.data || [];
      setTests(Array.isArray(data) ? data : []);

      try {
        const pRes = await apiClient.get('/api/opd/patients');
        const pData = pRes.data?.patients || pRes.data || [];
        setPatients(Array.isArray(pData) ? pData : []);
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching diagnostic tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderData = async () => {
    try {
      const oRes = await apiClient.get('/api/opd/test-orders');
      const oData = oRes.data?.orders || oRes.data || [];
      setTestOrders(Array.isArray(oData) ? oData : []);
    } catch (e) {}
  };

  const handleAddTest = async () => {
    if (!formData.name || !formData.price) {
      setError('Test name and price are required');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/tests', {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category || 'General',
      });

      setSuccess('Diagnostic test added to catalog!');
      setFormData({ name: '', price: '', category: 'General' });
      fetchData();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating test entry');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (t) => {
    setEditingTestId(t._id || t.id);
    setEditFormData({
      name: t.name,
      price: String(t.price),
      category: t.category || 'General',
    });
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditTest = async () => {
    if (!editFormData.name || !editFormData.price) {
      setError('Test name and price are required');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.put(`/api/opd/tests/${editingTestId}`, {
        name: editFormData.name,
        price: Number(editFormData.price),
        category: editFormData.category || 'General',
      });

      setSuccess('Test updated successfully!');
      fetchData();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = (tId, tName) => {
    Alert.alert(
      'Delete Diagnostic Test',
      `Are you sure you want to remove "${tName}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/tests/${tId}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete test entry');
            }
          },
        },
      ]
    );
  };

  const handleScheduleOrder = async () => {
    if (!orderForm.patientId || !orderForm.testId) {
      setError('Please select both a patient and a test');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/test-orders', {
        patientId: orderForm.patientId,
        testId: orderForm.testId,
        notes: orderForm.notes,
        scheduledDate: orderForm.scheduledDate,
      });

      setSuccess('Diagnostic test scheduled successfully!');
      setOrderForm({
        patientId: '',
        testId: '',
        notes: '',
        scheduledDate: new Date().toISOString().substring(0, 10),
      });
      fetchOrderData();
      setTimeout(() => {
        setIsOrderModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error scheduling test order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/api/opd/test-orders/${orderId}/status`, {
        status: newStatus,
      });
      fetchOrderData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Diagnostics & Pathology</Text>
            <Text style={styles.subtitle}>Test catalog rates & lab investigation orders</Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setError('');
              setSuccess('');
              if (activeTab === 'catalog') setIsAddModalOpen(true);
              else setIsOrderModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>
              {activeTab === 'catalog' ? '+ Add Test' : '+ Schedule Test'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Toggle Bar */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'catalog' && styles.tabActive]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
              🧪 Test Catalog
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => {
              setActiveTab('orders');
              fetchOrderData();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              📋 Test Orders {testOrders.length > 0 ? `(${testOrders.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'catalog' ? (
          // ── Catalog Tab ──────────────────────────────────────────────────────
          tests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Diagnostic Tests Found</Text>
              <Text style={styles.emptyText}>Tap "+ Add Test" to add lab tests to catalog.</Text>
            </View>
          ) : (
            tests.map((t) => (
              <View key={t._id || t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testName}>{t.name}</Text>
                    <Text style={styles.categoryText}>Category: {t.category || 'General'}</Text>
                  </View>
                  <Text style={styles.priceTag}>₹{t.price}</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(t)}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteTest(t._id || t.id, t.name)}
                  >
                    <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          // ── Orders Tab ───────────────────────────────────────────────────────
          testOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Pending Lab Test Orders</Text>
              <Text style={styles.emptyText}>
                Tap "+ Schedule Test" to order lab investigations for a patient.
              </Text>
            </View>
          ) : (
            testOrders.map((ord) => (
              <View key={ord._id || ord.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testName}>{ord.testName || ord.testId?.name || 'Lab Test'}</Text>
                    <Text style={styles.categoryText}>
                      Patient: {ord.patientName || ord.patientId?.name || 'Patient'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      ord.status === 'Completed' && styles.badgeSuccess,
                      ord.status === 'Cancelled' && styles.badgeDanger,
                      ord.status === 'Pending' && styles.badgeWarning,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{ord.status?.toUpperCase() || 'PENDING'}</Text>
                  </View>
                </View>

                {ord.notes ? <Text style={styles.notesText}>Notes: {ord.notes}</Text> : null}
                <Text style={styles.dateText}>
                  📅 Scheduled: {ord.scheduledDate || 'Today'}
                </Text>

                {ord.status === 'Pending' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.completeOrderBtn}
                      onPress={() => handleUpdateOrderStatus(ord._id || ord.id, 'Completed')}
                    >
                      <Text style={styles.completeOrderBtnText}>✓ Mark Sample Collected & Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* ── Add Test Modal ──────────────────────────────────────────────────── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsAddModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Diagnostic Test</Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TEST NAME *</Text>
                  <TextInput style={styles.fieldInput} placeholder="e.g. Complete Blood Count (CBC)"
                    value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CATEGORY</Text>
                  <TextInput style={styles.fieldInput} placeholder="e.g. Hematology"
                    value={formData.category} onChangeText={(text) => setFormData({ ...formData, category: text })} />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PRICE (₹) *</Text>
                  <TextInput style={styles.fieldInput} placeholder="350" keyboardType="number-pad"
                    value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} />
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleAddTest} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Add Diagnostic Test</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Test Modal ─────────────────────────────────────────────────── */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsEditModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Diagnostic Test</Text>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TEST NAME *</Text>
                  <TextInput style={styles.fieldInput}
                    value={editFormData.name} onChangeText={(text) => setEditFormData({ ...editFormData, name: text })} />
                </View>
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PRICE (₹) *</Text>
                    <TextInput style={styles.fieldInput} keyboardType="decimal-pad"
                      value={editFormData.price} onChangeText={(text) => setEditFormData({ ...editFormData, price: text })} />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>CATEGORY</Text>
                    <TextInput style={styles.fieldInput}
                      value={editFormData.category} onChangeText={(text) => setEditFormData({ ...editFormData, category: text })} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleEditTest} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Schedule Test Order Modal ───────────────────────────────────────── */}
      <Modal visible={isOrderModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsOrderModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Diagnostic Test</Text>
                  <TouchableOpacity onPress={() => setIsOrderModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                {/* Patient Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SELECT PATIENT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {patients.map((p) => {
                      const isSel = orderForm.patientId === (p._id || p.id);
                      return (
                        <TouchableOpacity
                          key={p._id || p.id}
                          style={[styles.chip, isSel && styles.chipActive]}
                          onPress={() => setOrderForm({ ...orderForm, patientId: p._id || p.id })}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{p.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Test Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SELECT TEST *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {tests.map((t) => {
                      const isSel = orderForm.testId === (t._id || t.id);
                      return (
                        <TouchableOpacity
                          key={t._id || t.id}
                          style={[styles.chip, isSel && styles.chipActive]}
                          onPress={() => setOrderForm({ ...orderForm, testId: t._id || t.id })}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                            {t.name} (₹{t.price})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SCHEDULED DATE (YYYY-MM-DD)</Text>
                  <TextInput style={styles.fieldInput} placeholder="2026-08-10"
                    value={orderForm.scheduledDate} onChangeText={(text) => setOrderForm({ ...orderForm, scheduledDate: text })} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CLINICAL NOTES</Text>
                  <TextInput style={[styles.fieldInput, { height: 60 }]} placeholder="e.g. Fasting required"
                    multiline value={orderForm.notes} onChangeText={(text) => setOrderForm({ ...orderForm, notes: text })} />
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleScheduleOrder} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Schedule Diagnostic Test</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  tabRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: '#ffffff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#0f766e', fontWeight: '800' },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1', gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  testName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  testCategory: { fontSize: 12, color: '#64748b', marginTop: 2 },
  testPrice: { fontSize: 17, fontWeight: '800', color: '#0f766e' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  deleteBtnText: { color: '#991b1b' },
  orderCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e0f2fe', gap: 6 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPatient: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusGreen: { backgroundColor: '#f0fdf4' },
  statusBlue: { backgroundColor: '#eff6ff' },
  statusOrange: { backgroundColor: '#fff7ed' },
  orderStatusText: { fontSize: 10, fontWeight: '700', color: '#0f172a' },
  orderTest: { fontSize: 13, color: '#475569', fontWeight: '600' },
  orderDate: { fontSize: 12, color: '#0f766e' },
  orderNotes: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  orderActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  collectBtn: { flex: 1, backgroundColor: '#eff6ff', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  collectBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  reportBtn: { flex: 1, backgroundColor: '#f0fdf4', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  reportBtnText: { color: '#15803d', fontWeight: '700', fontSize: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', marginRight: 6 },
  chipActive: { backgroundColor: '#0D9488' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 20, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 20, color: '#64748b', fontWeight: '700' },
  successBox: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, padding: 10, borderRadius: 10 },
  successText: { color: '#047857', fontWeight: '700', fontSize: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 10, borderRadius: 10 },
  errorText: { color: '#b91c1c', fontSize: 13 },
  fieldGroup: { gap: 6 },
  rowFields: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  submitBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
