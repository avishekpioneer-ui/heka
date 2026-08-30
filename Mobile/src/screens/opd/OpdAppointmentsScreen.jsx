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
  Share,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';
import storage from '../../utils/storage';
import CalendarPickerModal from '../../components/CalendarPickerModal';

const TIME_SLOTS = [
  { label: '09:00 AM', value: '09:00', period: 'Morning' },
  { label: '09:30 AM', value: '09:30', period: 'Morning' },
  { label: '10:00 AM', value: '10:00', period: 'Morning' },
  { label: '10:30 AM', value: '10:30', period: 'Morning' },
  { label: '11:00 AM', value: '11:00', period: 'Morning' },
  { label: '11:30 AM', value: '11:30', period: 'Morning' },
  { label: '12:00 PM', value: '12:00', period: 'Afternoon' },
  { label: '12:30 PM', value: '12:30', period: 'Afternoon' },
  { label: '02:00 PM', value: '14:00', period: 'Afternoon' },
  { label: '02:30 PM', value: '14:30', period: 'Afternoon' },
  { label: '03:00 PM', value: '15:00', period: 'Afternoon' },
  { label: '03:30 PM', value: '15:30', period: 'Afternoon' },
  { label: '04:00 PM', value: '16:00', period: 'Afternoon' },
  { label: '04:30 PM', value: '16:30', period: 'Afternoon' },
  { label: '05:00 PM', value: '17:00', period: 'Evening' },
  { label: '05:30 PM', value: '17:30', period: 'Evening' },
  { label: '06:00 PM', value: '18:00', period: 'Evening' },
  { label: '06:30 PM', value: '18:30', period: 'Evening' },
  { label: '07:00 PM', value: '19:00', period: 'Evening' },
  { label: '07:30 PM', value: '19:30', period: 'Evening' },
  { label: '08:00 PM', value: '20:00', period: 'Evening' },
];

const convertTo24Hour = (hourStr, minStr, ampm) => {
  let h = parseInt(hourStr, 10);
  if (isNaN(h)) h = 12;
  let m = parseInt(minStr, 10);
  if (isNaN(m)) m = 0;
  h = Math.max(1, Math.min(12, h));
  m = Math.max(0, Math.min(59, m));

  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const parseFrom24Hour = (time24) => {
  if (!time24 || !time24.includes(':')) {
    return { hour: '04', minute: '22', ampm: 'PM' };
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 10;
  const m = String(parseInt(mStr, 10) || 0).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { hour: String(h).padStart(2, '0'), minute: m, ampm };
};

const formatTimeDisplay = (timeVal) => {
  if (!timeVal) return 'Anytime (No specific time)';
  const parsed = parseFrom24Hour(timeVal);
  return `${parsed.hour}:${parsed.minute} ${parsed.ampm}`;
};

export default function OpdAppointmentsScreen({ onNavigate, routeParams }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [userRoleName, setUserRoleName] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);

  // Modal State for Booking Appointment
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Custom Time Builder State (supports exact minute selection like 4:22 PM)
  const [customHour, setCustomHour] = useState('04');
  const [customMinute, setCustomMinute] = useState('22');
  const [customAmPm, setCustomAmPm] = useState('PM');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Receipt Modal (after successful booking)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [recentBooking, setRecentBooking] = useState(null);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: new Date().toISOString().substring(0, 10),
    appointmentTime: '10:00',
    consultationFee: '50',
  });

  // Dropdown states for Schedule Consultant Visit modal
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  const hasPermission = (perm) =>
    userPermissions.includes('*') || userPermissions.includes(perm);

  useEffect(() => {
    fetchData();
    fetchUserRoleInfo();
  }, []);

  const fetchUserRoleInfo = async () => {
    try {
      const role = await storage.getItem('userRoleName');
      const name = await storage.getItem('userName');
      const uid = await storage.getItem('userId');
      const permStr = await storage.getItem('userPermissions');
      if (role) setUserRoleName(role);
      if (name) setCurrentUserName(name);
      if (uid) setCurrentUserId(uid);
      if (permStr) setUserPermissions(JSON.parse(permStr));
    } catch (e) {}
  };

  // Pre-select patient if navigated from Patients Registry
  useEffect(() => {
    if (routeParams?.patient) {
      setFormData((prev) => ({
        ...prev,
        patientId: routeParams.patient._id || routeParams.patient.id,
      }));
      setIsBookingOpen(true);
    }
  }, [routeParams]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [apptRes, patRes, docRes] = await Promise.all([
        apiClient.get('/api/opd/appointments').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/patients').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/staff/doctors').catch(() => ({ data: [] })),
      ]);

      const apptData = apptRes.data?.appointments || apptRes.data || [];
      setAppointments(Array.isArray(apptData) ? apptData : []);

      const patData = patRes.data?.patients || patRes.data || [];
      setPatients(Array.isArray(patData) ? patData : []);

      const docData = docRes.data?.doctors || docRes.data || [];
      setDoctors(Array.isArray(docData) ? docData : []);
    } catch (err) {
      console.error('Error fetching appointments data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Doctor chip selection — auto-fill consultation fee ──────────────────────
  const handleDoctorSelect = (doctor) => {
    setFormData((prev) => ({
      ...prev,
      doctorId: doctor._id || doctor.id,
      doctorName: doctor.name,
      consultationFee: doctor.fees ? String(doctor.fees) : prev.consultationFee,
    }));
  };

  const handleOpenTimePicker = () => {
    if (formData.appointmentTime) {
      const parsed = parseFrom24Hour(formData.appointmentTime);
      setCustomHour(parsed.hour);
      setCustomMinute(parsed.minute);
      setCustomAmPm(parsed.ampm);
    } else {
      setCustomHour('04');
      setCustomMinute('22');
      setCustomAmPm('PM');
    }
    setIsTimePickerOpen(true);
  };

  // ── Book Appointment ────────────────────────────────────────────────────────
  const handleBookingSubmit = async () => {
    if (!formData.patientId || (!formData.doctorId && !formData.doctorName)) {
      setError('Please select a patient and assign a doctor');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const rawTime = (formData.appointmentTime || '').trim();
      const timePart = rawTime
        ? (rawTime.includes(':') ? rawTime : `${rawTime}:00`)
        : '09:00';
      const fullDate = `${formData.appointmentDate}T${timePart}:00`;

      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId || undefined,
        doctorName: formData.doctorName || undefined,
        appointmentDate: fullDate,
        consultationFee: Number(formData.consultationFee) || 50,
      };

      const res = await apiClient.post('/api/opd/appointments', payload);
      const bookedAppt = res.data?.appointment || res.data;

      setSuccess('Appointment Booked Successfully!');
      setRecentBooking({
        id: bookedAppt._id || bookedAppt.id || Date.now(),
        patientName:
          patients.find((p) => (p._id || p.id) === formData.patientId)?.name ||
          'Patient',
        patientPhone:
          patients.find((p) => (p._id || p.id) === formData.patientId)?.phone ||
          'N/A',
        doctorName:
          formData.doctorName ||
          doctors.find((d) => (d._id || d.id) === formData.doctorId)?.name ||
          'Doctor',
        appointmentDate: fullDate,
        consultationFee: formData.consultationFee,
      });

      fetchData();

      setTimeout(() => {
        handleCloseBooking();
        setSuccess('');
        setShowReceiptModal(true);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error booking appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setIsPatientDropdownOpen(false);
    setIsDoctorDropdownOpen(false);
    setPatientSearchQuery('');
  };

  // ── Share Appointment Token ─────────────────────────────────────────────────
  const handleShareToken = async () => {
    if (!recentBooking) return;
    try {
      const msg = `🏥 HEKA OPD APPOINTMENT TOKEN\n----------------------------\nToken ID: ${String(
        recentBooking.id
      ).slice(-12)}\nPatient: ${recentBooking.patientName}\nDoctor: Dr. ${
        recentBooking.doctorName
      }\nDate & Time: ${new Date(
        recentBooking.appointmentDate
      ).toLocaleString()}\nConsultation Fee: ₹${
        recentBooking.consultationFee
      }\nStatus: Scheduled\n----------------------------\nPlease present this token at the OPD desk.`;
      await Share.share({ message: msg });
    } catch (e) {}
  };

  // ── Change appointment status ───────────────────────────────────────────────
  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await apiClient.put(`/api/opd/appointments/${apptId}/status`, {
        status: newStatus,
      });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const handleStartConsult = (appt) => {
    if (onNavigate) {
      onNavigate('consultations', { appt });
    }
  };

  // ── Complete & Invoice — mark Completed then navigate to Billing with prefill
  const handleCompleteAndBill = async (appt) => {
    try {
      await apiClient.put(`/api/opd/appointments/${appt._id || appt.id}/status`, {
        status: 'Completed',
      });
      fetchData();
      if (onNavigate) {
        onNavigate('billing', {
          patientId: appt.patientId?._id || appt.patientId,
          consultationFee: appt.consultationFee || 0,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to complete appointment and navigate to billing.');
    }
  };

  const selectedPatient = patients.find(
    (p) => (p._id || p.id) === formData.patientId
  );
  const selectedDoctor = doctors.find(
    (d) => (d._id || d.id) === formData.doctorId
  );

  const filteredPatients = patients.filter((p) => {
    const q = patientSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = p.name?.toLowerCase().includes(q);
    const phoneMatch = p.phone?.toLowerCase().includes(q);
    const uhidMatch = (p.uhid || p.patientId || '')?.toLowerCase().includes(q);
    return nameMatch || phoneMatch || uhidMatch;
  });

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
            <Text style={styles.title}>
              Appointments Queue {userRoleName ? `(${userRoleName})` : ''}
            </Text>
            <Text style={styles.subtitle}>
              Manage consultations, queue statuses, and billing handoffs
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsBookingOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Book Visit</Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading Queue...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Appointments Scheduled</Text>
            <Text style={styles.emptyText}>
              Tap "+ Book Visit" to register a patient for doctor consultation.
            </Text>
          </View>
        ) : (
          appointments.map((appt) => (
            <View key={appt._id || appt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>
                    {appt.patientName || appt.patientId?.name || 'Patient'}
                  </Text>
                  <Text style={styles.doctorName}>
                    👨‍⚕️ Dr. {appt.doctorName || 'Assigned Consultant'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    appt.status === 'Completed' && styles.badgeSuccess,
                    appt.status === 'Cancelled' && styles.badgeDanger,
                    (appt.status === 'Scheduled' || appt.status === 'In-Progress') &&
                      styles.badgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      appt.status === 'Completed' && styles.textSuccess,
                      appt.status === 'Cancelled' && styles.textDanger,
                      (appt.status === 'Scheduled' ||
                        appt.status === 'In-Progress') &&
                        styles.textWarning,
                    ]}
                  >
                    {appt.status?.toUpperCase() || 'SCHEDULED'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetailsRow}>
                <Text style={styles.detailText}>
                  📅 {new Date(appt.appointmentDate).toLocaleString()}
                </Text>
                <Text style={styles.detailText}>
                  💰 Fee: ₹{appt.consultationFee || 50}
                </Text>
              </View>

              {/* Action Buttons based on status */}
              {appt.status !== 'Completed' && appt.status !== 'Cancelled' ? (
                <View style={styles.actionsRow}>
                  {appt.status === 'Scheduled' && (
                    <TouchableOpacity
                      style={styles.inProgressBtn}
                      onPress={() => handleStartConsult(appt)}
                    >
                      <Text style={styles.inProgressBtnText}>▶ Start Consult</Text>
                    </TouchableOpacity>
                  )}

                  {appt.status === 'In-Progress' && (
                    <TouchableOpacity
                      style={styles.consultBtn}
                      onPress={() => handleStartConsult(appt)}
                    >
                      <Text style={styles.consultBtnText}>💬 Write Consult Notes</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteAndBill(appt)}
                  >
                    <Text style={styles.completeBtnText}>✓ Finish & Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() =>
                      handleStatusChange(appt._id || appt.id, 'Cancelled')
                    }
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Book Appointment Modal ────────────────────────────────────────── */}
      <Modal visible={isBookingOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={handleCloseBooking}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Consultant Visit</Text>
                  <TouchableOpacity onPress={handleCloseBooking}>
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

                {/* Patient Selection Dropdown */}
                <View style={[styles.fieldGroup, { zIndex: 30 }]}>
                  <Text style={styles.fieldLabel}>SELECT PATIENT *</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      isPatientDropdownOpen && styles.dropdownTriggerActive,
                      formData.patientId ? styles.dropdownTriggerSelected : null,
                    ]}
                    onPress={() => {
                      setIsPatientDropdownOpen(!isPatientDropdownOpen);
                      setIsDoctorDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          formData.patientId ? styles.dropdownTriggerTextSelected : null,
                        ]}
                      >
                        {selectedPatient
                          ? `👤 ${selectedPatient.name}${
                              selectedPatient.phone ? ` (${selectedPatient.phone})` : ''
                            }`
                          : '-- Choose Patient --'}
                      </Text>
                    </View>
                    <Text style={styles.dropdownArrow}>
                      {isPatientDropdownOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {isPatientDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="🔍 Search patient by name, phone..."
                        placeholderTextColor="#94a3b8"
                        value={patientSearchQuery}
                        onChangeText={setPatientSearchQuery}
                      />
                      <ScrollView
                        style={{ maxHeight: 180 }}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredPatients.length === 0 ? (
                          <View style={styles.dropdownEmpty}>
                            <Text style={styles.dropdownEmptyText}>
                              No matching patients found
                            </Text>
                          </View>
                        ) : (
                          filteredPatients.map((p) => {
                            const isSelected =
                              formData.patientId === (p._id || p.id);
                            return (
                              <TouchableOpacity
                                key={p._id || p.id}
                                style={[
                                  styles.dropdownItem,
                                  isSelected && styles.dropdownItemSelected,
                                ]}
                                onPress={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    patientId: p._id || p.id,
                                  }));
                                  setIsPatientDropdownOpen(false);
                                  setPatientSearchQuery('');
                                }}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemName,
                                    isSelected && styles.dropdownItemNameSelected,
                                  ]}
                                >
                                  👤 {p.name}
                                </Text>
                                {p.phone ? (
                                  <Text style={styles.dropdownItemSub}>
                                    📞 {p.phone}
                                  </Text>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Doctor Selection Dropdown */}
                <View style={[styles.fieldGroup, { zIndex: 20 }]}>
                  <Text style={styles.fieldLabel}>ASSIGN DOCTOR *</Text>
                  {doctors.length > 0 ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.dropdownTrigger,
                          isDoctorDropdownOpen && styles.dropdownTriggerActive,
                          formData.doctorId ? styles.dropdownTriggerSelected : null,
                        ]}
                        onPress={() => {
                          setIsDoctorDropdownOpen(!isDoctorDropdownOpen);
                          setIsPatientDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dropdownTriggerText,
                              formData.doctorId ? styles.dropdownTriggerTextSelected : null,
                            ]}
                          >
                            {selectedDoctor
                              ? `🩺 Dr. ${selectedDoctor.name} (₹${
                                  selectedDoctor.fees || 50
                                })`
                              : '-- Choose Doctor --'}
                          </Text>
                        </View>
                        <Text style={styles.dropdownArrow}>
                          {isDoctorDropdownOpen ? '▲' : '▼'}
                        </Text>
                      </TouchableOpacity>

                      {isDoctorDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          <ScrollView
                            style={{ maxHeight: 180 }}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {doctors.map((d) => {
                              const isSelected =
                                formData.doctorId === (d._id || d.id);
                              return (
                                <TouchableOpacity
                                  key={d._id || d.id}
                                  style={[
                                    styles.dropdownItem,
                                    isSelected && styles.dropdownItemSelected,
                                  ]}
                                  onPress={() => {
                                    handleDoctorSelect(d);
                                    setIsDoctorDropdownOpen(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownItemName,
                                      isSelected &&
                                        styles.dropdownItemNameSelected,
                                    ]}
                                  >
                                    🩺 Dr. {d.name}
                                  </Text>
                                  <Text style={styles.dropdownItemSub}>
                                    Consultation Fee: ₹{d.fees || 50}
                                    {d.specialization
                                      ? ` • ${d.specialization}`
                                      : ''}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  ) : (
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g. Dr. Watson"
                      value={formData.doctorName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, doctorName: text })
                      }
                    />
                  )}
                </View>

                {/* Date + Time row */}
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>DATE *</Text>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setIsCalendarOpen(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.datePickerBtnText}>
                        📅 {formData.appointmentDate || 'Select Date'}
                      </Text>
                      <Text style={styles.datePickerBtnIcon}>✎</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>TIME (OPTIONAL)</Text>
                    <TouchableOpacity
                      style={styles.timePickerBtn}
                      onPress={handleOpenTimePicker}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timePickerBtnText} numberOfLines={1}>
                        🕒 {formData.appointmentTime ? formatTimeDisplay(formData.appointmentTime) : 'Anytime'}
                      </Text>
                      <Text style={styles.timePickerBtnIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Consultation Fee */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CONSULT FEE (₹) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="50"
                    keyboardType="number-pad"
                    value={formData.consultationFee}
                    onChangeText={(text) =>
                      setFormData({ ...formData, consultationFee: text })
                    }
                  />
                  {formData.doctorId && doctors.find(d => (d._id || d.id) === formData.doctorId)?.fees && (
                    <Text style={styles.feeHint}>
                      💡 Auto-filled from Dr. {formData.doctorName}'s rate
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleBookingSubmit}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Book Appointment</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Booking Receipt Modal ─────────────────────────────────────────── */}
      <Modal visible={showReceiptModal} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowReceiptModal(false)}>
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptCard}>
            {/* Success Icon */}
            <View style={styles.receiptIconBox}>
              <Text style={styles.receiptIcon}>✅</Text>
            </View>
            <Text style={styles.receiptTitle}>Appointment Booked!</Text>
            <Text style={styles.receiptSub}>
              Pending consultation bill has been registered.
            </Text>

            {recentBooking && (
              <View style={styles.receiptDetails}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Token ID</Text>
                  <Text style={styles.receiptValue} numberOfLines={1}>
                    {String(recentBooking.id).slice(-12)}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Patient</Text>
                  <Text style={styles.receiptValue}>{recentBooking.patientName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Phone</Text>
                  <Text style={styles.receiptValue}>{recentBooking.patientPhone}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Doctor</Text>
                  <Text style={styles.receiptValue}>Dr. {recentBooking.doctorName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time</Text>
                  <Text style={styles.receiptValue}>
                    {new Date(recentBooking.appointmentDate).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                  <Text style={styles.receiptTotalLabel}>Consultation Fee</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₹{recentBooking.consultationFee}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareToken}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>📤 Share Token</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeReceiptBtn}
                onPress={() => setShowReceiptModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeReceiptBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Calendar Date Picker Modal */}
      <CalendarPickerModal
        visible={isCalendarOpen}
        currentDate={formData.appointmentDate}
        title="Select Appointment Date"
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={(newDate) => {
          setFormData((prev) => ({ ...prev, appointmentDate: newDate }));
        }}
      />

      {/* Interactive Time Slot Picker Modal */}
      <Modal
        visible={isTimePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.timePickerBackdrop}
          activeOpacity={1}
          onPress={() => setIsTimePickerOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.timePickerCard}>
            <View style={styles.timePickerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timePickerTitle}>Select Time Slot</Text>
                <Text style={styles.timePickerSubtitle}>Optional appointment consultation hour</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTimePickerOpen(false)}
                style={styles.timePickerCloseBtn}
              >
                <Text style={styles.timePickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Anytime / Flexible Option */}
            <TouchableOpacity
              style={[
                styles.anytimeBtn,
                !formData.appointmentTime && styles.anytimeBtnActive,
              ]}
              onPress={() => {
                setFormData((prev) => ({ ...prev, appointmentTime: '' }));
                setIsTimePickerOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.anytimeBtnText,
                  !formData.appointmentTime && styles.anytimeBtnTextActive,
                ]}
              >
                ✨ Anytime (No specific time slot)
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Custom Exact Time Picker (Allows exact times like 4:22 PM) */}
              <View style={styles.customTimeSection}>
                <Text style={styles.customTimeSectionTitle}>⏰ Custom Exact Time</Text>
                <View style={styles.timeInputsRow}>
                  {/* Hour */}
                  <View style={styles.timeInputCol}>
                    <Text style={styles.timeInputColLabel}>HOUR</Text>
                    <View style={styles.timeStepperBox}>
                      <TouchableOpacity
                        style={styles.timeStepperBtn}
                        onPress={() => {
                          let h = (parseInt(customHour, 10) || 12) + 1;
                          if (h > 12) h = 1;
                          setCustomHour(String(h).padStart(2, '0'));
                        }}
                      >
                        <Text style={styles.timeStepperBtnText}>▲</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.timeInputBox}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={customHour}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10);
                          if (isNaN(num)) setCustomHour(val);
                          else if (num >= 1 && num <= 12) setCustomHour(String(num).padStart(2, '0'));
                          else setCustomHour(val);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.timeStepperBtn}
                        onPress={() => {
                          let h = (parseInt(customHour, 10) || 12) - 1;
                          if (h < 1) h = 12;
                          setCustomHour(String(h).padStart(2, '0'));
                        }}
                      >
                        <Text style={styles.timeStepperBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.timeColonText}>:</Text>

                  {/* Minute (e.g. 22) */}
                  <View style={styles.timeInputCol}>
                    <Text style={styles.timeInputColLabel}>MINUTE</Text>
                    <View style={styles.timeStepperBox}>
                      <TouchableOpacity
                        style={styles.timeStepperBtn}
                        onPress={() => {
                          let m = (parseInt(customMinute, 10) || 0) + 1;
                          if (m > 59) m = 0;
                          setCustomMinute(String(m).padStart(2, '0'));
                        }}
                      >
                        <Text style={styles.timeStepperBtnText}>▲</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.timeInputBox}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={customMinute}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10);
                          if (isNaN(num)) setCustomMinute(val);
                          else if (num >= 0 && num <= 59) setCustomMinute(String(num).padStart(2, '0'));
                          else setCustomMinute(val);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.timeStepperBtn}
                        onPress={() => {
                          let m = (parseInt(customMinute, 10) || 0) - 1;
                          if (m < 0) m = 59;
                          setCustomMinute(String(m).padStart(2, '0'));
                        }}
                      >
                        <Text style={styles.timeStepperBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* AM / PM Toggle */}
                  <View style={styles.ampmToggleCol}>
                    <Text style={styles.timeInputColLabel}>PERIOD</Text>
                    <View style={styles.ampmToggleBox}>
                      <TouchableOpacity
                        style={[styles.ampmBtn, customAmPm === 'AM' && styles.ampmBtnActive]}
                        onPress={() => setCustomAmPm('AM')}
                      >
                        <Text style={[styles.ampmBtnText, customAmPm === 'AM' && styles.ampmBtnTextActive]}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.ampmBtn, customAmPm === 'PM' && styles.ampmBtnActive]}
                        onPress={() => setCustomAmPm('PM')}
                      >
                        <Text style={[styles.ampmBtnText, customAmPm === 'PM' && styles.ampmBtnTextActive]}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Apply Custom Time Button */}
                <TouchableOpacity
                  style={styles.applyTimeBtn}
                  onPress={() => {
                    const time24 = convertTo24Hour(customHour, customMinute, customAmPm);
                    setFormData((prev) => ({ ...prev, appointmentTime: time24 }));
                    setIsTimePickerOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyTimeBtnText}>
                    ✓ Set Exact Time: {customHour || '04'}:{String(customMinute || '00').padStart(2, '0')} {customAmPm}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Slots */}
              {['Morning', 'Afternoon', 'Evening'].map((period) => {
                const slots = TIME_SLOTS.filter((s) => s.period === period);
                return (
                  <View key={period} style={styles.timePeriodGroup}>
                    <Text style={styles.timePeriodLabel}>
                      {period === 'Morning'
                        ? '🌅 MORNING SLOTS'
                        : period === 'Afternoon'
                        ? '☀️ AFTERNOON SLOTS'
                        : '🌙 EVENING SLOTS'}
                    </Text>
                    <View style={styles.slotsGrid}>
                      {slots.map((slot) => {
                        const isSelected = formData.appointmentTime === slot.value;
                        return (
                          <TouchableOpacity
                            key={slot.value}
                            style={[
                              styles.slotChip,
                              isSelected && styles.slotChipSelected,
                            ]}
                            onPress={() => {
                              setFormData((prev) => ({
                                ...prev,
                                appointmentTime: slot.value,
                              }));
                              const parsed = parseFrom24Hour(slot.value);
                              setCustomHour(parsed.hour);
                              setCustomMinute(parsed.minute);
                              setCustomAmPm(parsed.ampm);
                              setIsTimePickerOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.slotChipText,
                                isSelected && styles.slotChipTextSelected,
                              ]}
                            >
                              {slot.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f8fafc',
    paddingBottom: 110,
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
  bookBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusGreen: { backgroundColor: '#f0fdf4' },
  statusOrange: { backgroundColor: '#fff7ed' },
  statusRed: { backgroundColor: '#fef2f2' },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  doctorInfo: {
    fontSize: 13,
    color: '#475569',
  },
  doctorBold: {
    fontWeight: '700',
    color: '#0f766e',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  inProgressBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inProgressBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  completeBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  completeBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  consultBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  consultBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  invoiceBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  invoiceBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelBtnText: {
    color: '#991b1b',
    fontWeight: '600',
    fontSize: 12,
  },
  // ── Booking Modal ──
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
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
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
  feeHint: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '600',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#0D9488',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#0D9488',
    backgroundColor: '#f0fdfa',
  },
  dropdownTriggerSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#f0fdfa',
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  dropdownTriggerTextSelected: {
    color: '#0f172a',
    fontWeight: '700',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '700',
    marginLeft: 8,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    marginTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownSearchInput: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fdfa',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  dropdownItemNameSelected: {
    color: '#0D9488',
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dropdownEmpty: {
    padding: 12,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
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
  // ── Receipt Modal ──
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  receiptIconBox: {
    alignItems: 'center',
    marginBottom: 4,
  },
  receiptIcon: {
    fontSize: 44,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: -4,
  },
  receiptDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  closeReceiptBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeReceiptBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  datePickerBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#0D9488',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  datePickerBtnIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  timePickerBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#0D9488',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
    flex: 1,
  },
  timePickerBtnIcon: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 4,
  },
  timePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timePickerCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  timePickerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  timePickerCloseBtn: {
    padding: 6,
  },
  timePickerCloseText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  anytimeBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#99f6e4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  anytimeBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0f766e',
  },
  anytimeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  anytimeBtnTextActive: {
    color: '#ffffff',
  },
  timePeriodGroup: {
    marginBottom: 12,
  },
  timePeriodLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slotChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  slotChipSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0f766e',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  slotChipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  customTimeSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  customTimeSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
    marginBottom: 10,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  timeInputCol: {
    alignItems: 'center',
  },
  timeInputColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  timeStepperBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    width: 58,
    overflow: 'hidden',
  },
  timeStepperBtn: {
    width: '100%',
    height: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeStepperBtnText: {
    fontSize: 10,
    color: '#0f766e',
    fontWeight: '800',
  },
  timeInputBox: {
    width: '100%',
    height: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    paddingVertical: 0,
  },
  timeColonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f766e',
    marginTop: 14,
  },
  ampmToggleCol: {
    alignItems: 'center',
    marginLeft: 4,
  },
  ampmToggleBox: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 2,
  },
  ampmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  ampmBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0f766e',
  },
  ampmBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  ampmBtnTextActive: {
    color: '#ffffff',
  },
  applyTimeBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyTimeBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
