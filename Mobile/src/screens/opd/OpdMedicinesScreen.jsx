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

export default function OpdMedicinesScreen() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  // Restock Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ name: '', stock: '', price: '' });
  const [editFormData, setEditFormData] = useState({ name: '', stock: '', price: '' });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/opd/medicines');
      const data = res.data?.medicines || res.data || [];
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!formData.name || !formData.stock || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/medicines', {
        name: formData.name,
        stock: Number(formData.stock),
        price: Number(formData.price),
      });

      setSuccess('Medicine added to inventory!');
      setFormData({ name: '', stock: '', price: '' });
      fetchMedicines();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (med) => {
    setEditTarget(med);
    setEditFormData({
      name: med.name,
      stock: String(med.stock || 0),
      price: String(med.price || 0),
    });
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditMedicine = async () => {
    if (!editFormData.name || !editFormData.stock || !editFormData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.put(`/api/opd/medicines/${editTarget._id || editTarget.id}`, {
        name: editFormData.name,
        stock: Number(editFormData.stock),
        price: Number(editFormData.price),
      });

      setSuccess('Medicine updated successfully!');
      fetchMedicines();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRestock = (med) => {
    setRestockTarget(med);
    setRestockQty('');
    setError('');
    setSuccess('');
    setIsRestockModalOpen(true);
  };

  const handleRestock = async () => {
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid stock quantity');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.put(`/api/opd/medicines/${restockTarget._id || restockTarget.id}/restock`, {
        quantity: qty,
      });

      setSuccess(`Added ${qty} units to ${restockTarget.name}!`);
      fetchMedicines();
      setTimeout(() => {
        setIsRestockModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error restocking medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (med) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to remove "${med.name}" from the inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/medicines/${med._id || med.id}`);
              fetchMedicines();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete medicine');
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
          <View>
            <Text style={styles.title}>Pharmacy Catalogue</Text>
            <Text style={styles.subtitle}>Medicine inventory & stock management</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Medicines List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading Pharmacy Stock...</Text>
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Medicines Found</Text>
            <Text style={styles.emptyText}>Add medicines to your catalogue to manage stock and billing.</Text>
          </View>
        ) : (
          medicines.map((med) => {
            const isLowStock = (med.stock || 0) < 10;
            const isOutOfStock = (med.stock || 0) === 0;

            return (
              <View key={med._id || med.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{med.name}</Text>
                    <Text style={styles.category}>{med.category || 'General Medicine'}</Text>
                  </View>
                  <Text style={styles.price}>₹{med.price}</Text>
                </View>

                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Available Stock:</Text>
                  <Text
                    style={[
                      styles.stockValue,
                      isOutOfStock ? styles.textRed : isLowStock ? styles.textOrange : styles.textGreen,
                    ]}
                  >
                    {med.stock || 0} units {isOutOfStock ? '(Out of Stock)' : isLowStock ? '(Low Stock)' : ''}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenRestock(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnText}>+ Restock</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEdit(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Add Medicine Modal ──────────────────────────────────────────── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsAddModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Pharmacy Stock</Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MEDICINE NAME *</Text>
                  <TextInput style={styles.fieldInput} placeholder="e.g. Paracetamol 650mg"
                    value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>STOCK QTY *</Text>
                    <TextInput style={styles.fieldInput} placeholder="100" keyboardType="number-pad"
                      value={formData.stock} onChangeText={(text) => setFormData({ ...formData, stock: text })} />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PRICE (₹) *</Text>
                    <TextInput style={styles.fieldInput} placeholder="30" keyboardType="number-pad"
                      value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleAddMedicine} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Add Stock to Pharmacy</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Medicine Modal ──────────────────────────────────────────── */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsEditModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Medicine</Text>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MEDICINE NAME *</Text>
                  <TextInput style={styles.fieldInput} placeholder="Medicine Name"
                    value={editFormData.name} onChangeText={(text) => setEditFormData({ ...editFormData, name: text })} />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>STOCK QTY</Text>
                    <TextInput style={styles.fieldInput} keyboardType="number-pad"
                      value={editFormData.stock} onChangeText={(text) => setEditFormData({ ...editFormData, stock: text })} />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PRICE (₹)</Text>
                    <TextInput style={styles.fieldInput} keyboardType="decimal-pad"
                      value={editFormData.price} onChangeText={(text) => setEditFormData({ ...editFormData, price: text })} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleEditMedicine} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Restock Modal ────────────────────────────────────────────────── */}
      <Modal visible={isRestockModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsRestockModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Restock Medicine</Text>
                  <TouchableOpacity onPress={() => setIsRestockModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                {restockTarget && (
                  <View style={styles.restockInfo}>
                    <Text style={styles.restockName}>{restockTarget.name}</Text>
                    <Text style={styles.restockCurrent}>Current Stock: {restockTarget.stock || 0} units</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>UNITS TO ADD *</Text>
                  <TextInput style={styles.fieldInput} placeholder="e.g. 50" keyboardType="number-pad"
                    value={restockQty} onChangeText={setRestockQty} />
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRestock} disabled={submitting} activeOpacity={0.8}>
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm Restock</Text>}
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
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1', gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#f0fdf4' },
  badgeOrange: { backgroundColor: '#fff7ed' },
  badgeRed: { backgroundColor: '#fef2f2' },
  stockBadgeText: { fontSize: 10, fontWeight: '700', color: '#0f172a' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detail: { fontSize: 13, color: '#64748b' },
  bold: { fontWeight: '700' },
  textGreen: { color: '#16a34a' },
  textOrange: { color: '#ea580c' },
  textRed: { color: '#dc2626' },
  price: { fontSize: 15, fontWeight: '800', color: '#0f766e' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  deleteBtnText: { color: '#991b1b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 20, gap: 12, paddingBottom: 100 },
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
  restockInfo: { backgroundColor: '#f0fdfa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#99f6e4', gap: 4 },
  restockName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  restockCurrent: { fontSize: 13, color: '#0f766e', fontWeight: '600' },
});
