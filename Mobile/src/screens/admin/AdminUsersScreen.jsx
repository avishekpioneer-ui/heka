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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/users');
      const data = res.data?.users || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/admin/users', formData);
      setSuccess('User created successfully!');
      setFormData({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Users Management</Text>
            <Text style={styles.subtitle}>System user accounts & access control</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add User</Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#1b4332" />
            <Text style={styles.loadingText}>Loading Users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>Create user accounts to grant portal access.</Text>
          </View>
        ) : (
          users.map((u) => (
            <View key={u._id || u.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{u.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{u.role || 'User'}</Text>
                </View>
              </View>
              <Text style={styles.detail}>Email: {u.email}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create New Account</Text>
                  <TouchableOpacity onPress={() => setIsModalOpen(false)}>
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

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Alex Rivera"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="alex@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleCreateUser}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Account</Text>
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
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#1b4332', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#1b4332', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  detail: { fontSize: 13, color: '#64748b' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#1b4332' },
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
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  submitBtn: { backgroundColor: '#1b4332', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
