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
  RefreshControl,
  Share,
} from 'react-native';
import apiClient from '../../config/api';
import storage from '../../utils/storage';
import { printPrescription, sharePrescriptionPdf } from '../../utils/prescriptionPdf';

const QUICK_SYMPTOMS = [
  'Mild Fever',
  'Cold & Cough',
  'Throat Pain',
  'Headache',
  'Stomach Ache',
  'Body Ache',
  'Nausea',
  'Fatigue',
  'Dizziness',
];

const QUICK_DIAGNOSES = [
  'Viral Infection',
  'Acute Bronchitis',
  'Upper Resp. Infection',
  'Gastritis / Acidity',
  'Migraine',
  'Seasonal Flu',
  'Hypertension',
  'General Weakness',
];

const DOSAGE_OPTIONS = [
  '1-0-1 (Morning & Night)',
  '1-1-1 (Thrice Daily)',
  '1-0-0 (Morning only)',
  '0-0-1 (Night only)',
  'SOS (As Needed)',
  'Before Meals (AC)',
  'After Meals (PC)',
];

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '2 months',
];

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
  'Ultrasound Whole Abdomen',
];

export default function OpdConsultationsScreen({ onNavigate, routeParams }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [appointments, setAppointments] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Selected appointment details
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Dropdown States
  const [isApptDropdownOpen, setIsApptDropdownOpen] = useState(false);
  const [openMedDropdownIdx, setOpenMedDropdownIdx] = useState(null);
  const [openDosageDropdownIdx, setOpenDosageDropdownIdx] = useState(null);
  const [openDurationDropdownIdx, setOpenDurationDropdownIdx] = useState(null);

  // Form State
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState([
    { medicineName: '', dosage: '1-0-1 (Morning & Night)', duration: '5 days' },
  ]);
  const [testsList, setTestsList] = useState([]);
  const [tests, setTests] = useState([{ testName: '', notes: '' }]);
  const [openTestDropdownIdx, setOpenTestDropdownIdx] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [issuedPrescription, setIssuedPrescription] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill appointment if navigated from Appointments queue
  useEffect(() => {
    if (routeParams?.appt) {
      setSelectedAppt(routeParams.appt);
      setIsApptDropdownOpen(false);
      setActiveTab('active');
    }
  }, [routeParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const role = await storage.getItem('userRoleName');
      const name = await storage.getItem('userName');
      const uid = await storage.getItem('userId');

      // Fetch appointments, medicines, consultations, and registered diagnostic tests
      const [aRes, mRes, cRes, tRes] = await Promise.all([
        apiClient.get('/api/opd/appointments').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/medicines').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/consultations').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/tests').catch(() => ({ data: [] })),
      ]);

      const aData = aRes.data?.appointments || aRes.data || [];
      let aList = Array.isArray(aData) ? aData : [];

      // Filter to Scheduled appointments for dropdown
      const scheduledAppts = aList.filter((a) => a.status === 'Scheduled');
      setAppointments(scheduledAppts);

      const mData = mRes.data?.medicines || mRes.data || [];
      setMedicinesList(Array.isArray(mData) ? mData : []);

      const cData = cRes.data?.consultations || cRes.data || [];
      setConsultations(Array.isArray(cData) ? cData : []);

      const tData = tRes.data?.tests || tRes.data || [];
      setTestsList(Array.isArray(tData) ? tData : []);
    } catch (err) {
      console.error('Error fetching consultation data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Appointment Selection ───────────────────────────────────────────────
  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    setIsApptDropdownOpen(false);
  };

  // ── Quick Tag Handlers ───────────────────────────────────────────────────
  const handleAddSymptomTag = (tag) => {
    if (!symptoms) {
      setSymptoms(tag);
    } else if (!symptoms.toLowerCase().includes(tag.toLowerCase())) {
      setSymptoms(`${symptoms}, ${tag}`);
    }
  };

  const handleSelectDiagnosisTag = (tag) => {
    setDiagnosis(tag);
  };

  // ── Quick Follow-up Day Calculator ───────────────────────────────────────
  const handleSetQuickFollowUp = (days) => {
    if (days === 0) {
      setFollowUpDate('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateString = d.toISOString().split('T')[0];
    setFollowUpDate(dateString);
  };

  // ── Prescription Row Helpers ─────────────────────────────────────────────
  const addPrescriptionRow = () => {
    setPrescription((prev) => [
      ...prev,
      { medicineName: '', dosage: '1-0-1 (Morning & Night)', duration: '5 days' },
    ]);
  };

  const removePrescriptionRow = (index) => {
    if (prescription.length === 1) {
      setPrescription([{ medicineName: '', dosage: '1-0-1 (Morning & Night)', duration: '5 days' }]);
      return;
    }
    setPrescription((prev) => prev.filter((_, idx) => idx !== index));
    if (openMedDropdownIdx === index) setOpenMedDropdownIdx(null);
    if (openDosageDropdownIdx === index) setOpenDosageDropdownIdx(null);
    if (openDurationDropdownIdx === index) setOpenDurationDropdownIdx(null);
  };

  const updatePrescriptionRow = (index, field, value) => {
    setPrescription((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectMedicineFromDropdown = (index, medName) => {
    updatePrescriptionRow(index, 'medicineName', medName);
    setOpenMedDropdownIdx(null);
  };

  const handleSelectDosageFromDropdown = (index, dosage) => {
    updatePrescriptionRow(index, 'dosage', dosage);
    setOpenDosageDropdownIdx(null);
  };

  const handleSelectDurationFromDropdown = (index, duration) => {
    updatePrescriptionRow(index, 'duration', duration);
    setOpenDurationDropdownIdx(null);
  };

  // ── Recommended Tests Row Helpers ─────────────────────────────────────────
  const addTestRow = () => {
    setTests((prev) => [...prev, { testName: '', notes: '' }]);
  };

  const removeTestRow = (index) => {
    if (tests.length === 1) {
      setTests([{ testName: '', notes: '' }]);
      return;
    }
    setTests((prev) => prev.filter((_, idx) => idx !== index));
    if (openTestDropdownIdx === index) setOpenTestDropdownIdx(null);
  };

  const updateTestRow = (index, field, value) => {
    setTests((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectTestFromDropdown = (index, testName) => {
    updateTestRow(index, 'testName', testName);
    setOpenTestDropdownIdx(null);
  };

  const handleAddQuickTest = (testName) => {
    setTests((prev) => {
      const exists = prev.some((t) => (t.testName || '').toLowerCase() === testName.toLowerCase());
      if (exists) return prev;
      return [...prev, { testName, notes: '' }];
    });
  };

  // ── Submit Consultation ──────────────────────────────────────────────────
  const handleSubmitConsultation = async () => {
    if (!selectedAppt) {
      setError('Please select an active scheduled appointment from the dropdown.');
      return;
    }

    if (!symptoms.trim() && !diagnosis.trim()) {
      setError('Please enter symptoms / chief complaint or diagnosis notes.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const validPrescription = prescription.filter((p) => p.medicineName.trim());
      const validTests = tests.filter((t) => t.testName && t.testName.trim());

      const payload = {
        appointmentId: selectedAppt._id || selectedAppt.id,
        patientId: selectedAppt.patientId?._id || selectedAppt.patientId,
        patientName: selectedAppt.patientName || selectedAppt.patientId?.name,
        doctorId: selectedAppt.doctorId || undefined,
        doctorName: selectedAppt.doctorName,
        symptoms: symptoms.trim(),
        diagnosis: diagnosis.trim(),
        prescription: validPrescription,
        tests: validTests,
        followUpDate: followUpDate || undefined,
      };

      const res = await apiClient.post('/api/opd/consultations', payload);
      const savedCons = res.data?.consultation || {
        ...payload,
        patientId: selectedAppt.patientId,
        createdAt: new Date().toISOString(),
      };

      // Auto-update appointment status to Completed
      try {
        await apiClient.put(`/api/opd/appointments/${selectedAppt._id || selectedAppt.id}/status`, {
          status: 'Completed',
        });
      } catch (e) { }

      setSuccess('Prescription & clinical case sheet saved successfully!');
      setIssuedPrescription(savedCons);

      // Clean up inputs
      setSelectedAppt(null);
      setSymptoms('');
      setDiagnosis('');
      setPrescription([{ medicineName: '', dosage: '1-0-1 (Morning & Night)', duration: '5 days' }]);
      setTests([{ testName: '', notes: '' }]);
      setFollowUpDate('');

      fetchData();

      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving consultation details.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Share Prescription Slip ──────────────────────────────────────────────
  const handleShareConsultation = async (cons) => {
    try {
      const rxText = cons.prescription?.length
        ? cons.prescription.map((rx) => `  • ${rx.medicineName} (${rx.dosage} - ${rx.duration})`).join('\n')
        : '  No medicines prescribed';

      const msg =
        `🏥 HEKA CLINICAL CONSULTATION SLIP\n` +
        `----------------------------------------\n` +
        `Patient: ${cons.patientName || cons.patientId?.name || 'Patient'}\n` +
        `Doctor: Dr. ${cons.doctorName}\n` +
        `Date: ${new Date(cons.createdAt || Date.now()).toLocaleDateString()}\n` +
        `Symptoms: ${cons.symptoms || 'N/A'}\n` +
        `Diagnosis: ${cons.diagnosis || 'N/A'}\n\n` +
        `💊 Prescribed Medicines:\n${rxText}\n\n` +
        (cons.followUpDate ? `⏰ Follow-up: ${new Date(cons.followUpDate).toLocaleDateString()}\n` : '') +
        `----------------------------------------\n` +
        `Take prescribed medicines as directed.`;

      await Share.share({ message: msg });
    } catch (e) { }
  };

  const filteredHistory = consultations.filter((c) => {
    const q = historySearch.toLowerCase();
    const pName = (c.patientName || c.patientId?.name || '').toLowerCase();
    const dName = (c.doctorName || '').toLowerCase();
    const diag = (c.diagnosis || '').toLowerCase();
    return pName.includes(q) || dName.includes(q) || diag.includes(q);
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title}>Doctor EMR Workspace</Text>
            <Text style={styles.subtitle}>
              Clinical examination, prescription builder & patient case history
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              🩺 Active Consult {selectedAppt ? '(1 Loaded)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              📋 Case History ({consultations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'active' ? (
          // ── TAB 1: ACTIVE CONSULTATION WORKSPACE ─────────────────────────────
          <View style={{ gap: 14 }}>
            {/* Feedback Banners */}
            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✅ {success}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* 1. Scheduled Appointment Dropdown */}
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>1. SELECT SCHEDULED APPOINTMENT *</Text>

              {/* Dropdown Trigger */}
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  isApptDropdownOpen && styles.dropdownTriggerActive,
                  selectedAppt && styles.dropdownTriggerSelected,
                ]}
                onPress={() => setIsApptDropdownOpen(!isApptDropdownOpen)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      selectedAppt && styles.dropdownTriggerTextSelected,
                    ]}
                  >
                    {selectedAppt
                      ? `👤 ${selectedAppt.patientName || selectedAppt.patientId?.name} — Dr. ${selectedAppt.doctorName}`
                      : '-- Choose Active Scheduled Appointment --'}
                  </Text>
                  {selectedAppt && (
                    <Text style={styles.dropdownSubtext}>
                      Fee: ₹{selectedAppt.consultationFee || 50} • 📅{' '}
                      {new Date(selectedAppt.appointmentDate).toLocaleString()}
                    </Text>
                  )}
                </View>
                <Text style={styles.dropdownArrow}>{isApptDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Dropdown Menu Items */}
              {isApptDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {appointments.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        No scheduled appointments waiting in queue.
                      </Text>
                    </View>
                  ) : (
                    appointments.map((a) => {
                      const isSelected = (selectedAppt?._id || selectedAppt?.id) === (a._id || a.id);
                      return (
                        <TouchableOpacity
                          key={a._id || a.id}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => handleSelectAppointment(a)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                isSelected && styles.dropdownItemTitleActive,
                              ]}
                            >
                              {a.patientName || a.patientId?.name || 'Patient'}
                            </Text>
                            <Text style={styles.dropdownItemSub}>
                              Dr. {a.doctorName} • Fee: ₹{a.consultationFee || 50} •{' '}
                              {new Date(a.appointmentDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {/* Selected Patient Mini Summary */}
              {selectedAppt && (
                <View style={styles.patientSummaryBox}>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Patient Name</Text>
                      <Text style={styles.summaryValue}>
                        {selectedAppt.patientName || selectedAppt.patientId?.name}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Doctor In-Charge</Text>
                      <Text style={styles.summaryValue}>Dr. {selectedAppt.doctorName}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Age / Gender</Text>
                      <Text style={styles.summaryValue}>
                        {selectedAppt.patientId?.age ? `${selectedAppt.patientId.age} yrs` : 'N/A'} /{' '}
                        {selectedAppt.patientId?.gender || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Consultation Fee</Text>
                      <Text style={styles.summaryValueFee}>
                        ₹{selectedAppt.consultationFee || 50}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 2. Symptoms & Chief Complaints */}
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>2. CHIEF COMPLAINTS & SYMPTOMS</Text>
              <Text style={styles.helperText}>
                Tap quick tags to add, or type specific symptoms below:
              </Text>

              {/* Quick Tags Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickTagsScroll}
                keyboardShouldPersistTaps="handled"
              >
                {QUICK_SYMPTOMS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.quickTagPill}
                    onPress={() => handleAddSymptomTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickTagPillText}>+ {tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={[styles.fieldInput, styles.textAreaInput]}
                placeholder="e.g. Patient reports mild fever, cough, and throat irritation for 3 days."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={symptoms}
                onChangeText={setSymptoms}
              />
            </View>

            {/* 3. Clinical Diagnosis */}
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>3. CLINICAL DIAGNOSIS</Text>
              <Text style={styles.helperText}>Tap to auto-fill common clinical impressions:</Text>

              {/* Quick Diagnoses Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickTagsScroll}
                keyboardShouldPersistTaps="handled"
              >
                {QUICK_DIAGNOSES.map((diag) => (
                  <TouchableOpacity
                    key={diag}
                    style={[
                      styles.quickTagPill,
                      diagnosis === diag && styles.quickTagPillActive,
                    ]}
                    onPress={() => handleSelectDiagnosisTag(diag)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickTagPillText,
                        diagnosis === diag && styles.quickTagPillTextActive,
                      ]}
                    >
                      {diag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={[styles.fieldInput, styles.textAreaInput]}
                placeholder="e.g. Acute Bronchitis, suspected viral infection with pharyngitis."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                value={diagnosis}
                onChangeText={setDiagnosis}
              />
            </View>

            {/* 4. Digital Prescription (Rx) Builder with Dropdowns */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionHeading}>4. DIGITAL PRESCRIPTION (Rx)</Text>
                <TouchableOpacity
                  style={styles.addMedBtn}
                  onPress={addPrescriptionRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addMedBtnText}>+ Add Medicine</Text>
                </TouchableOpacity>
              </View>

              {prescription.map((rx, idx) => (
                <View key={idx} style={styles.rxCard}>
                  <View style={styles.rxCardHeader}>
                    <Text style={styles.rxCardIndex}>Rx #{idx + 1}</Text>
                    {prescription.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removePrescriptionRow(idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removeRxText}>✕ Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Medicine Dropdown Selector */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>MEDICINE NAME * (SELECT OR TYPE)</Text>

                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        openMedDropdownIdx === idx && styles.dropdownTriggerActive,
                      ]}
                      onPress={() =>
                        setOpenMedDropdownIdx(openMedDropdownIdx === idx ? null : idx)
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          rx.medicineName && styles.dropdownTriggerTextSelected,
                        ]}
                      >
                        {rx.medicineName ? `💊 ${rx.medicineName}` : '-- Select from Pharmacy Stock ▾ --'}
                      </Text>
                      <Text style={styles.dropdownArrow}>
                        {openMedDropdownIdx === idx ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* Expandable Medicine Dropdown List */}
                    {openMedDropdownIdx === idx && (
                      <View style={styles.dropdownMenu}>
                        <ScrollView
                          style={{ maxHeight: 180 }}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {medicinesList.length === 0 ? (
                            <View style={styles.dropdownEmpty}>
                              <Text style={styles.dropdownEmptyText}>
                                No medicines registered in catalog.
                              </Text>
                            </View>
                          ) : (
                            medicinesList.map((m) => (
                              <TouchableOpacity
                                key={m._id || m.id}
                                style={styles.dropdownMenuItem}
                                onPress={() => handleSelectMedicineFromDropdown(idx, m.name)}
                                activeOpacity={0.7}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.dropdownItemTitle}>💊 {m.name}</Text>
                                  <Text style={styles.dropdownItemSub}>
                                    Price: ₹{m.price || 0} • Stock: {m.stock ?? 'N/A'}
                                  </Text>
                                </View>
                                {rx.medicineName === m.name && (
                                  <Text style={styles.checkIcon}>✓</Text>
                                )}
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {/* Direct typing input if custom medicine */}
                    <TextInput
                      style={[styles.fieldInput, { marginTop: 4 }]}
                      placeholder="Or type custom medicine name..."
                      placeholderTextColor="#94a3b8"
                      value={rx.medicineName}
                      onChangeText={(val) => updatePrescriptionRow(idx, 'medicineName', val)}
                    />
                  </View>

                  {/* Dosage Dropdown */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>DOSAGE *</Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        openDosageDropdownIdx === idx && styles.dropdownTriggerActive,
                      ]}
                      onPress={() =>
                        setOpenDosageDropdownIdx(openDosageDropdownIdx === idx ? null : idx)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownTriggerTextSelected}>
                        ⏰ {rx.dosage || '-- Select Dosage ▾ --'}
                      </Text>
                      <Text style={styles.dropdownArrow}>
                        {openDosageDropdownIdx === idx ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {openDosageDropdownIdx === idx && (
                      <View style={styles.dropdownMenu}>
                        {DOSAGE_OPTIONS.map((d) => (
                          <TouchableOpacity
                            key={d}
                            style={styles.dropdownMenuItem}
                            onPress={() => handleSelectDosageFromDropdown(idx, d)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemTitle}>{d}</Text>
                            {rx.dosage === d && <Text style={styles.checkIcon}>✓</Text>}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Direct typing input if custom dosage */}
                    <TextInput
                      style={[styles.fieldInput, { marginTop: 4 }]}
                      placeholder="Or type custom dosage (e.g. 1-0-1, SOS, 2 tabs)..."
                      placeholderTextColor="#94a3b8"
                      value={rx.dosage}
                      onChangeText={(val) => updatePrescriptionRow(idx, 'dosage', val)}
                    />
                  </View>

                  {/* Duration Dropdown */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>DURATION *</Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        openDurationDropdownIdx === idx && styles.dropdownTriggerActive,
                      ]}
                      onPress={() =>
                        setOpenDurationDropdownIdx(openDurationDropdownIdx === idx ? null : idx)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownTriggerTextSelected}>
                        📅 {rx.duration || '-- Select Duration ▾ --'}
                      </Text>
                      <Text style={styles.dropdownArrow}>
                        {openDurationDropdownIdx === idx ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {openDurationDropdownIdx === idx && (
                      <View style={styles.dropdownMenu}>
                        {DURATION_OPTIONS.map((dur) => (
                          <TouchableOpacity
                            key={dur}
                            style={styles.dropdownMenuItem}
                            onPress={() => handleSelectDurationFromDropdown(idx, dur)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemTitle}>{dur}</Text>
                            {rx.duration === dur && <Text style={styles.checkIcon}>✓</Text>}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Direct typing input if custom duration */}
                    <TextInput
                      style={[styles.fieldInput, { marginTop: 4 }]}
                      placeholder="Or type custom duration (e.g. 5 days, 2 weeks)..."
                      placeholderTextColor="#94a3b8"
                      value={rx.duration}
                      onChangeText={(val) => updatePrescriptionRow(idx, 'duration', val)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* 5. Recommended Diagnostic Tests (Lab & Radiology) */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionHeading}>5. DIAGNOSTIC TESTS</Text>
                <TouchableOpacity
                  style={styles.addMedBtn}
                  onPress={addTestRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addMedBtnText}>+ Add Test</Text>
                </TouchableOpacity>
              </View>

              {tests.map((tItem, idx) => (
                <View key={idx} style={styles.rxCard}>
                  <View style={styles.rxCardHeader}>
                    <Text style={styles.rxCardIndex}>Test #{idx + 1}</Text>
                    {tests.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeTestRow(idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removeRxText}>✕ Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Test Dropdown Selector */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>TEST NAME * (SELECT OR TYPE)</Text>

                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        openTestDropdownIdx === idx && styles.dropdownTriggerActive,
                      ]}
                      onPress={() =>
                        setOpenTestDropdownIdx(openTestDropdownIdx === idx ? null : idx)
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          tItem.testName && styles.dropdownTriggerTextSelected,
                        ]}
                      >
                        {tItem.testName ? `🔬 ${tItem.testName}` : '-- Select from Tests Catalog ▾ --'}
                      </Text>
                      <Text style={styles.dropdownArrow}>
                        {openTestDropdownIdx === idx ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* Expandable Test Dropdown List */}
                    {openTestDropdownIdx === idx && (
                      <View style={styles.dropdownMenu}>
                        <ScrollView
                          style={{ maxHeight: 180 }}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {testsList.length === 0 ? (
                            <View style={styles.dropdownEmpty}>
                              <Text style={styles.dropdownEmptyText}>
                                No registered tests in catalog.
                              </Text>
                            </View>
                          ) : (
                            testsList.map((t) => (
                              <TouchableOpacity
                                key={t._id || t.id}
                                style={styles.dropdownMenuItem}
                                onPress={() => handleSelectTestFromDropdown(idx, t.name)}
                                activeOpacity={0.7}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.dropdownItemTitle}>🔬 {t.name}</Text>
                                  <Text style={styles.dropdownItemSub}>
                                    Price: ₹{t.price || 0}
                                  </Text>
                                </View>
                                {tItem.testName === t.name && (
                                  <Text style={styles.checkIcon}>✓</Text>
                                )}
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {/* Direct typing input for custom test */}
                    <TextInput
                      style={[styles.fieldInput, { marginTop: 4 }]}
                      placeholder="Or type custom test name..."
                      placeholderTextColor="#94a3b8"
                      value={tItem.testName}
                      onChangeText={(val) => updateTestRow(idx, 'testName', val)}
                    />
                  </View>

                  {/* Special Instructions / Notes */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>SPECIAL INSTRUCTIONS / CLINICAL NOTES (OPTIONAL)</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g. Fasting 10-12 hrs / Stat / Before next visit"
                      placeholderTextColor="#94a3b8"
                      value={tItem.notes}
                      onChangeText={(val) => updateTestRow(idx, 'notes', val)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* 6. Follow-up Advisory */}
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>6. FOLLOW-UP ADVISORY</Text>
              <Text style={styles.helperText}>Select recommended follow-up interval:</Text>

              <View style={styles.followUpPresetsRow}>
                {[
                  { label: 'In 3 Days', days: 3 },
                  { label: 'In 5 Days', days: 5 },
                  { label: 'In 1 Week', days: 7 },
                  { label: 'In 2 Weeks', days: 14 },
                  { label: 'None', days: 0 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.followUpPill}
                    onPress={() => handleSetQuickFollowUp(item.days)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.followUpPillText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.fieldInput}
                placeholder="YYYY-MM-DD (e.g. 2026-09-02)"
                placeholderTextColor="#94a3b8"
                value={followUpDate}
                onChangeText={setFollowUpDate}
              />
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!selectedAppt || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitConsultation}
              disabled={submitting || !selectedAppt}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  💾 Finalize & Issue Digital Prescription
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // ── TAB 2: CONSULTATION CASE SHEET HISTORY ──────────────────────────
          <View style={{ gap: 12 }}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search case sheets by patient, doctor, or diagnosis..."
                placeholderTextColor="#94a3b8"
                value={historySearch}
                onChangeText={setHistorySearch}
              />
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0D9488" />
                <Text style={styles.loadingText}>Loading Case History...</Text>
              </View>
            ) : filteredHistory.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Consultation History Found</Text>
                <Text style={styles.emptyText}>
                  Completed patient prescriptions and diagnostic notes appear here.
                </Text>
              </View>
            ) : (
              filteredHistory.map((cons) => (
                <View key={cons._id || cons.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyPatientName}>
                        {cons.patientName || cons.patientId?.name || 'Walk-in Patient'}
                      </Text>
                      <Text style={styles.historyDoctorName}>
                        👨‍⚕️ Dr. {cons.doctorName || 'Consultant In-Charge'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.printSlipBtn}
                        onPress={() => printPrescription(cons)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.printSlipBtnText}>📄 PDF</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shareSlipBtn}
                        onPress={() => sharePrescriptionPdf(cons)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.shareSlipBtnText}>📤 Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.historyDate}>
                    📅 {new Date(cons.createdAt || Date.now()).toLocaleString()}
                  </Text>

                  {cons.symptoms ? (
                    <View style={styles.historyDetailRow}>
                      <Text style={styles.historyDetailLabel}>Symptoms:</Text>
                      <Text style={styles.historyDetailVal}>{cons.symptoms}</Text>
                    </View>
                  ) : null}

                  {cons.diagnosis ? (
                    <View style={styles.diagnosisTagBox}>
                      <Text style={styles.diagnosisTagLabel}>Dx:</Text>
                      <Text style={styles.diagnosisTagText}>{cons.diagnosis}</Text>
                    </View>
                  ) : null}

                  {cons.prescription && cons.prescription.length > 0 && (
                    <View style={styles.historyRxBox}>
                      <Text style={styles.historyRxTitle}>💊 PRESCRIBED MEDICINES:</Text>
                      {cons.prescription.map((rx, rIdx) => (
                        <Text key={rIdx} style={styles.historyRxItem}>
                          • {rx.medicineName}{' '}
                          <Text style={styles.historyRxDosage}>
                            ({rx.dosage} • {rx.duration})
                          </Text>
                        </Text>
                      ))}
                    </View>
                  )}

                  {cons.tests && cons.tests.length > 0 && (
                    <View style={styles.historyTestsBox}>
                      <Text style={styles.historyTestsTitle}>🔬 RECOMMENDED TESTS:</Text>
                      {cons.tests.map((t, tIdx) => (
                        <Text key={tIdx} style={styles.historyTestItem}>
                          • {typeof t === 'string' ? t : (t.testName || t.name)}{' '}
                          {t.notes ? (
                            <Text style={styles.historyTestNotes}>({t.notes})</Text>
                          ) : null}
                        </Text>
                      ))}
                    </View>
                  )}

                  {cons.followUpDate ? (
                    <View style={styles.historyFollowUpBox}>
                      <Text style={styles.historyFollowUpText}>
                        ⏰ Follow-up Scheduled: {new Date(cons.followUpDate).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Issued Prescription PDF Actions Modal */}
      {issuedPrescription && (
        <Modal
          visible={!!issuedPrescription}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIssuedPrescription(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.issuedModalCard}>
              <View style={styles.issuedModalHeader}>
                <Text style={styles.issuedModalIcon}>🩺</Text>
                <Text style={styles.issuedModalTitle}>Prescription Issued Successfully!</Text>
                <Text style={styles.issuedModalSubtitle}>
                  Rudraksh Foundation Letterhead PDF is ready for{' '}
                  <Text style={{ fontWeight: '800', color: '#0b4d3c' }}>
                    {issuedPrescription.patientName || issuedPrescription.patientId?.name || 'Patient'}
                  </Text>
                </Text>
              </View>

              <View style={styles.issuedModalDetails}>
                <Text style={styles.issuedDetailRow}>
                  👨‍⚕️ <Text style={{ fontWeight: '700' }}>Doctor:</Text> Dr. {issuedPrescription.doctorName}
                </Text>
                {issuedPrescription.diagnosis ? (
                  <Text style={styles.issuedDetailRow}>
                    📋 <Text style={{ fontWeight: '700' }}>Diagnosis:</Text> {issuedPrescription.diagnosis}
                  </Text>
                ) : null}
                <Text style={styles.issuedDetailRow}>
                  💊 <Text style={{ fontWeight: '700' }}>Medicines:</Text>{' '}
                  {issuedPrescription.prescription?.length || 0} items prescribed
                </Text>
              </View>

              <View style={styles.issuedModalBtnGroup}>
                <TouchableOpacity
                  style={styles.primaryPdfBtn}
                  onPress={() => {
                    printPrescription(issuedPrescription);
                  }}
                >
                  <Text style={styles.primaryPdfBtnText}>📄 View / Print PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryPdfBtn}
                  onPress={() => {
                    sharePrescriptionPdf(issuedPrescription);
                  }}
                >
                  <Text style={styles.secondaryPdfBtnText}>📤 Share PDF (WhatsApp / Drive)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closePdfModalBtn}
                  onPress={() => setIssuedPrescription(null)}
                >
                  <Text style={styles.closePdfModalBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  headerRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 3,
    marginTop: 4,
    marginBottom: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f766e',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
  },
  // ── Dropdowns ──
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#0D9488',
    backgroundColor: '#f0fdfa',
  },
  dropdownTriggerSelected: {
    borderColor: '#99f6e4',
    backgroundColor: '#f0fdfa',
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  dropdownTriggerTextSelected: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  dropdownSubtext: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '600',
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '800',
    marginLeft: 8,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#f0fdfa',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownItemTitleActive: {
    color: '#0f766e',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  checkIcon: {
    color: '#0D9488',
    fontWeight: '900',
    fontSize: 14,
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  // ── Patient Mini Summary ──
  patientSummaryBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '46%',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 1,
  },
  summaryValueFee: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '800',
    marginTop: 1,
  },
  // ── Form Inputs & Tags ──
  quickTagsScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  quickTagPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickTagPillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  quickTagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickTagPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  textAreaInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  addMedBtn: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  addMedBtnText: {
    color: '#0D9488',
    fontWeight: '700',
    fontSize: 11,
  },
  rxCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginTop: 4,
  },
  rxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxCardIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
  },
  removeRxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  followUpPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  followUpPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followUpPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
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
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
  // ── History Tab ──
  searchBox: {
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyPatientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyDoctorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    marginTop: 1,
  },
  printSlipBtn: {
    backgroundColor: '#0b4d3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  printSlipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  shareSlipBtn: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  shareSlipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  issuedModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  issuedModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  issuedModalIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  issuedModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0b4d3c',
    textAlign: 'center',
  },
  issuedModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  issuedModalDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
    marginBottom: 18,
  },
  issuedDetailRow: {
    fontSize: 12,
    color: '#334155',
  },
  issuedModalBtnGroup: {
    gap: 10,
  },
  primaryPdfBtn: {
    backgroundColor: '#0b4d3c',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0b4d3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryPdfBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryPdfBtn: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  secondaryPdfBtnText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 13,
  },
  closePdfModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closePdfModalBtnText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  historyDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  historyDetailRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  historyDetailVal: {
    fontSize: 12,
    color: '#334155',
    marginTop: 1,
  },
  diagnosisTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  diagnosisTagLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d9488',
  },
  diagnosisTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  historyRxBox: {
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f3e8ff',
    gap: 4,
  },
  historyRxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7e22ce',
    letterSpacing: 0.3,
  },
  historyRxItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4c1d95',
  },
  historyRxDosage: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b21a8',
  },
  historyFollowUpBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  historyFollowUpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  addTestBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  addTestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  testCardIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0b4d3c',
  },
  emptyTestsPrompt: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyTestsPromptText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  historyTestsBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    gap: 4,
  },
  historyTestsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.3,
  },
  historyTestItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14532d',
  },
  historyTestNotes: {
    fontSize: 11,
    fontWeight: '500',
    color: '#15803d',
    fontStyle: 'italic',
  },
});
