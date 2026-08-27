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

export default function OpdRemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      try {
        const rRes = await apiClient.get('/api/opd/reminders');
        const rData = rRes.data?.reminders || rRes.data || [];
        setReminders(Array.isArray(rData) ? rData : []);
      } catch (e) {}

      try {
        const pRes = await apiClient.get('/api/opd/patients');
        const pData = pRes.data?.patients || pRes.data || [];
        setPatients(Array.isArray(pData) ? pData : []);
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching reminders data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!selectedPatientId || !note) {
      setError('Please select a patient and enter a reminder note');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/reminders', {
        patientId: selectedPatientId,
        message: note,
        followUpDate: scheduledDate,
        scheduledDate,
      });

      setSuccess('Follow-up reminder scheduled!');
      setSelectedPatientId('');
      setNote('');
      fetchData();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error scheduling reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    setScanResult('');
    try {
      const res = await apiClient.post('/api/opd/reminders/scan', {});
      const count = res.data?.remindersSent ?? res.data?.count ?? 0;
      setScanResult(`Scan complete! ${count} follow-up notification(s) dispatched.`);
      fetchData();
    } catch (err) {
      setScanResult('Scan engine error. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Patient Reminders Feed</Text>
            <Text style={styles.subtitle}>Scheduled follow-ups and automated notifications</Text>
          </View>

          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.scanBtn, scanning && styles.btnDisabled]}
              onPress={handleTriggerScan}
              disabled={scanning}
              activeOpacity={0.8}
            >
              <Text style={styles.scanBtnText}>{scanning ? '⏳ Scanning...' : '🔄 Run Scan'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Result Banner */}
        {scanResult ? (
          <View style={styles.scanResultBox}>
            <Text style={styles.scanResultText}>{scanResult}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading Reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Pending Follow-up Reminders</Text>
            <Text style={styles.emptyText}>
              Tap "🔄 Run Scan" to auto-detect patients due for follow-up, or tap "+ Schedule" to manually create a reminder.
            </Text>
          </View>
        ) : (
          reminders.map((rem) => (
            <View key={rem._id || rem.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.patient}>{rem.patientName || rem.patientId?.name || 'Patient'}</Text>
                <View style={styles.dispatchBadge}>
                  <Text style={styles.dispatchText}>📡 DISPATCHED</Text>
                </View>
              </View>

              <Text style={styles.note}>{rem.message || rem.note}</Text>

              {rem.followUpDate && (
                <Text style={styles.followUp}>
                  📅 Due: {new Date(rem.followUpDate).toLocaleDateString()}
                </Text>
              )}
              {rem.sentAt && (
                <Text style={styles.sentAt}>
                  🕐 Sent: {new Date(rem.sentAt).toLocaleString()}
                </Text>
              )}
              {!rem.sentAt && rem.scheduledDate && (
                <Text style={styles.date}>
                  ⏰ Scheduled: {rem.scheduledDate || 'Today'}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Patient Follow-up</Text>
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

                {/* Patient Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SELECT PATIENT *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {patients.map((p) => {
                      const isSelected = selectedPatientId === (p._id || p.id);
                      return (
                        <TouchableOpacity
                          key={p._id || p.id}
                          style={[styles.patientChip, isSelected && styles.patientChipActive]}
                          onPress={() => setSelectedPatientId(p._id || p.id)}
                        >
                          <Text style={[styles.patientChipText, isSelected && styles.patientChipTextActive]}>
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>REMINDER NOTE / INSTRUCTIONS *</Text>
                  <TextInput
                    style={[styles.fieldInput, { height: 60 }]}
                    placeholder="e.g. 1-Week Post Consult Checkup"
                    multiline
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SCHEDULED DATE (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="2026-08-16"
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleAddReminder}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Schedule Reminder</Text>
                  )}
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
  headerBtns: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  scanBtn: { backgroundColor: '#f0fdfa', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#99f6e4' },
  scanBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  addBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  scanResultBox: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 12, borderRadius: 12 },
  scanResultText: { color: '#047857', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#ccfbf1', gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patient: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  dispatchBadge: { backgroundColor: '#f0fdfa', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#99f6e4' },
  dispatchText: { fontSize: 10, fontWeight: '700', color: '#0f766e' },
  note: { fontSize: 13, color: '#334155' },
  followUp: { fontSize: 12, color: '#0f766e', fontWeight: '700' },
  sentAt: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  date: { fontSize: 12, color: '#0f766e', fontWeight: '600', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalContent: { padding: 20, gap: 12 },
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
  patientChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', marginRight: 6 },
  patientChipActive: { backgroundColor: '#0D9488' },
  patientChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  patientChipTextActive: { color: '#ffffff', fontWeight: '700' },
  submitBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
