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

export default function OpdPatientsScreen({ onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for New Patient Registration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [duplicatePatient, setDuplicatePatient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    address: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/opd/patients?search=${encodeURIComponent(query)}` : '/api/opd/patients';
      const res = await apiClient.get(url);
      const data = res.data?.patients || res.data || [];
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.age || !formData.gender) {
      setFormError('Please fill out all required fields (*)');
      return;
    }

    setFormError('');
    setFormSuccess('');
    setDuplicatePatient(null);
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/patients', formData);

      setFormSuccess('Patient registered successfully!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'Male',
        age: '',
        address: '',
      });
      fetchPatients(searchTerm);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.patient) {
        setDuplicatePatient(err.response.data.patient);
        setFormError(err.response.data.message || 'Patient already registered with this phone number.');
      } else {
        setFormError(err.response?.data?.message || 'Error registering patient. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

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
            <Text style={styles.title}>Patients Registry</Text>
            <Text style={styles.subtitle}>Register new patients or look up clinical profiles</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Register Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or patient ID..."
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              fetchPatients(text);
            }}
          />
        </View>

        {/* Patient Database List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Fetching Records...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptyText}>Tap "+ Register Patient" above to add the first OPD patient record.</Text>
          </View>
        ) : (
          filtered.map((p, idx) => (
            <View key={p._id || p.id || `patient-row-${idx}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientSub}>
                    UHID: {p.uhid || p.patientId || 'N/A'} • {p.age ? `${p.age} yrs` : ''} • {p.gender || 'N/A'}
                  </Text>
                </View>

                <View style={styles.phoneBadge}>
                  <Text style={styles.phoneText}>📞 {p.phone || 'No phone'}</Text>
                </View>
              </View>

              {p.address ? <Text style={styles.addressText}>🏠 {p.address}</Text> : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.bookConsultBtn}
                  onPress={() => {
                    if (onNavigate) onNavigate('appointments', { patient: p });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookConsultBtnText}>📅 Book Appointment</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Register Patient Modal */}
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
                  <Text style={styles.modalTitle}>New Patient Registration</Text>
                  <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {formSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{formSuccess}</Text>
                  </View>
                ) : null}

                {formError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{formError}</Text>
                    {duplicatePatient ? (
                      <TouchableOpacity
                        style={styles.duplicateBtn}
                        onPress={() => {
                          setIsModalOpen(false);
                          if (onNavigate) onNavigate('appointments', { patient: duplicatePatient });
                        }}
                      >
                        <Text style={styles.duplicateBtnText}>Use Existing Patient ({duplicatePatient.name})</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                {/* Form Input Fields */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>AGE *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="35"
                      keyboardType="number-pad"
                      value={formData.age}
                      onChangeText={(text) => setFormData({ ...formData, age: text })}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>GENDER *</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderChip, formData.gender === g && styles.genderChipActive]}
                          onPress={() => setFormData({ ...formData, gender: g })}
                        >
                          <Text style={[styles.genderChipText, formData.gender === g && styles.genderChipTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="john@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS</Text>
                  <TextInput
                    style={[styles.fieldInput, { height: 70 }]}
                    placeholder="Street address, City"
                    multiline
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRegisterSubmit}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Register Patient</Text>
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
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  searchBox: {
    marginBottom: 4,
  },
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
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0f766e',
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  patientEmail: {
    fontSize: 11,
    color: '#94a3b8',
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  bookConsultBtn: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  bookConsultBtnText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  successText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  duplicateBtn: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  duplicateBtnText: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#0D9488',
  },
  genderChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  genderChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
