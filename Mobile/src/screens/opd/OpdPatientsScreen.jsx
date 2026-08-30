import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import apiClient from '../../config/api';

export default function OpdPatientsScreen({ onNavigate, routeParams }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL'); // 'ALL' | 'Male' | 'Female' | 'Other'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name'

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    address: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Patient History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [patientConsultations, setPatientConsultations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients(searchTerm);
    setRefreshing(false);
  };

  const handleRegisterSubmit = async () => {
    if (!formData.name?.trim() || !formData.age || !formData.gender) {
      setFormError('Please fill out all required fields (*)');
      return;
    }

    if (formData.phone?.trim() && formData.phone.trim().length < 7) {
      setFormError('Please enter a valid phone number');
      return;
    }

    setFormError('');
    setFormSuccess('');
    setDuplicatePatient(null);
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/patients', {
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        gender: formData.gender,
        age: Number(formData.age),
        address: formData.address?.trim() || '',
      });

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
      }, 1100);
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

  const handleOpenEdit = (patient) => {
    setEditingPatientId(patient._id || patient.id);
    setEditFormData({
      name: patient.name || '',
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender || 'Male',
      age: patient.age ? String(patient.age) : '',
      address: patient.address || '',
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editFormData.name?.trim() || !editFormData.age || !editFormData.gender) {
      setEditError('Please fill out all required fields (*)');
      return;
    }

    setEditError('');
    setEditSuccess('');
    setEditSubmitting(true);

    try {
      await apiClient.put(`/api/opd/patients/${editingPatientId}`, {
        name: editFormData.name.trim(),
        phone: editFormData.phone?.trim() || '',
        email: editFormData.email?.trim() || '',
        gender: editFormData.gender,
        age: Number(editFormData.age),
        address: editFormData.address?.trim() || '',
      });

      setEditSuccess('Patient profile updated successfully!');
      fetchPatients(searchTerm);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess('');
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error updating patient. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeletePatient = (patient) => {
    Alert.alert(
      'Delete Patient Record',
      `Are you sure you want to delete "${patient.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const id = patient._id || patient.id;
              await apiClient.delete(`/api/opd/patients/${id}`);
              fetchPatients(searchTerm);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete patient');
            }
          },
        },
      ]
    );
  };

  const handleOpenHistory = async (patient) => {
    setSelectedPatientForHistory(patient);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const pid = patient._id || patient.id;
      const res = await apiClient.get(`/api/opd/consultations/patient/${pid}`).catch(() => ({ data: [] }));
      const list = res.data?.consultations || res.data || [];
      setPatientConsultations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching patient history:', err);
      setPatientConsultations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCallPatient = (phone) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'This patient has no registered phone number.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call on this device');
    });
  };

  const handleWhatsAppPatient = (phone, name) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'This patient has no registered phone number.');
      return;
    }
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const msg = encodeURIComponent(`Hello ${name || 'Patient'}, this is regarding your visit at Heka OPD.`);
    Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=${msg}`).catch(() => {
      Linking.openURL(`sms:${phone}?body=${msg}`).catch(() => {
        Alert.alert('Error', 'Unable to open messaging app');
      });
    });
  };

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let result = patients.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.phone?.includes(term) ||
        (p.uhid && p.uhid.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term));

      const matchGender = genderFilter === 'ALL' || p.gender === genderFilter;
      return matchSearch && matchGender;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [patients, searchTerm, genderFilter, sortBy]);

  // Metric stats
  const stats = useMemo(() => {
    const total = patients.length;
    const males = patients.filter((p) => p.gender === 'Male').length;
    const females = patients.filter((p) => p.gender === 'Female').length;
    const now = new Date();
    const thisMonth = patients.filter((p) => {
      if (!p.createdAt) return false;
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, males, females, thisMonth };
  }, [patients]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* ═══ Header Banner ═══ */}
        <View style={styles.heroBanner}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTextContainer}>
              <View style={styles.badgeRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.badgeText}>CLINICAL DIRECTORY</Text>
              </View>
              <Text style={styles.heroTitle}>Patients Registry</Text>
              <Text style={styles.heroSubtitle}>Manage medical profiles, records, and OPD visits</Text>
            </View>

            <TouchableOpacity
              style={styles.heroRegisterBtn}
              onPress={() => {
                setFormError('');
                setFormSuccess('');
                setDuplicatePatient(null);
                setIsModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.heroRegisterBtnIcon}>＋</Text>
              <Text style={styles.heroRegisterBtnText}>New Patient</Text>
            </TouchableOpacity>
          </View>

          {/* ═══ Responsive Metric Stats Badges ═══ */}
          <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
            {/* 1. Total Patients */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isTablet ? styles.statCardTablet : styles.statCardMobile,
                genderFilter === 'ALL' && styles.statCardHighlight,
              ]}
              onPress={() => setGenderFilter('ALL')}
              activeOpacity={0.75}
            >
              <View style={[styles.statIconBadge, { backgroundColor: '#ccfbf1' }]}>
                <Text style={styles.statIconText}>👥</Text>
              </View>
              <View style={styles.statMetaBox}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Total Patients</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Male Count */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isTablet ? styles.statCardTablet : styles.statCardMobile,
                genderFilter === 'Male' && styles.statCardHighlight,
              ]}
              onPress={() => setGenderFilter(genderFilter === 'Male' ? 'ALL' : 'Male')}
              activeOpacity={0.75}
            >
              <View style={[styles.statIconBadge, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.statIconText}>👨</Text>
              </View>
              <View style={styles.statMetaBox}>
                <Text style={styles.statNumber}>{stats.males}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Male</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Female Count */}
            <TouchableOpacity
              style={[
                styles.statCard,
                isTablet ? styles.statCardTablet : styles.statCardMobile,
                genderFilter === 'Female' && styles.statCardHighlight,
              ]}
              onPress={() => setGenderFilter(genderFilter === 'Female' ? 'ALL' : 'Female')}
              activeOpacity={0.75}
            >
              <View style={[styles.statIconBadge, { backgroundColor: '#fce7f3' }]}>
                <Text style={styles.statIconText}>👩</Text>
              </View>
              <View style={styles.statMetaBox}>
                <Text style={styles.statNumber}>{stats.females}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Female</Text>
              </View>
            </TouchableOpacity>

            {/* 4. New Registrations This Month */}
            <View
              style={[
                styles.statCard,
                isTablet ? styles.statCardTablet : styles.statCardMobile,
              ]}
            >
              <View style={[styles.statIconBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.statIconText}>✨</Text>
              </View>
              <View style={styles.statMetaBox}>
                <Text style={styles.statNumber}>{stats.thisMonth}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>This Month</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ Search & Filter Bar ═══ */}
        <View style={styles.controlPanel}>
          <View style={styles.searchBarContainer}>
            <Text style={styles.searchPrefixIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, UHID..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                fetchPatients(text);
              }}
            />
            {searchTerm ? (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchTerm('');
                  fetchPatients('');
                }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Gender Filter Chips & Sort Switcher */}
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
              {[
                { id: 'ALL', label: 'All Patients' },
                { id: 'Male', label: '👨 Male' },
                { id: 'Female', label: '👩 Female' },
                { id: 'Other', label: '⚧ Other' },
              ].map((filter) => {
                const isActive = genderFilter === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setGenderFilter(filter.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortBy(sortBy === 'newest' ? 'name' : 'newest')}
              activeOpacity={0.8}
            >
              <Text style={styles.sortBtnIcon}>{sortBy === 'newest' ? '🕒' : '🔤'}</Text>
              <Text style={styles.sortBtnText}>{sortBy === 'newest' ? 'Newest' : 'A-Z'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ Patient List Section ═══ */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeading}>
            Patient Directory <Text style={styles.listCount}>({filteredPatients.length})</Text>
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Loading clinical records...</Text>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🧑‍⚕️</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {searchTerm || genderFilter !== 'ALL' ? 'No Matching Patients' : 'No Patients Registered'}
            </Text>
            <Text style={styles.emptyText}>
              {searchTerm || genderFilter !== 'ALL'
                ? 'Try adjusting your search query or reset your active filters.'
                : 'Get started by creating a new patient record in the OPD system.'}
            </Text>
            {searchTerm || genderFilter !== 'ALL' ? (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchTerm('');
                  setGenderFilter('ALL');
                  fetchPatients('');
                }}
              >
                <Text style={styles.resetFilterBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryEmptyBtn}
                onPress={() => {
                  setFormError('');
                  setFormSuccess('');
                  setIsModalOpen(true);
                }}
              >
                <Text style={styles.primaryEmptyBtnText}>＋ Register First Patient</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPatients.map((p, idx) => {
            const initials = (p.name || 'P')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const isMale = p.gender === 'Male';
            const isFemale = p.gender === 'Female';
            const genderBadgeBg = isMale ? '#e0f2fe' : isFemale ? '#fce7f3' : '#f1f5f9';
            const genderBadgeText = isMale ? '#0369a1' : isFemale ? '#be185d' : '#475569';
            const genderIcon = isMale ? '♂' : isFemale ? '♀' : '⚧';

            const formattedDate = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            return (
              <View key={p._id || p.id || `patient-card-${idx}`} style={styles.card}>
                {/* Top Row: Avatar, Name, UHID & Quick Contact Actions */}
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarContainer}>
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: isMale ? '#0f766e' : isFemale ? '#9d174d' : '#334155' },
                      ]}
                    >
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={[styles.genderMiniTag, { backgroundColor: genderBadgeBg }]}>
                      <Text style={[styles.genderMiniText, { color: genderBadgeText }]}>{genderIcon}</Text>
                    </View>
                  </View>

                  <View style={styles.patientInfoBox}>
                    <View style={styles.nameRow}>
                      <Text style={styles.patientName} numberOfLines={1}>
                        {p.name}
                      </Text>
                    </View>

                    <View style={styles.metaBadgeRow}>
                      <View style={[styles.genderTag, { backgroundColor: genderBadgeBg }]}>
                        <Text style={[styles.genderTagText, { color: genderBadgeText }]}>
                          {p.gender || 'N/A'} • {p.age ? `${p.age} yrs` : 'Age N/A'}
                        </Text>
                      </View>

                      {(p.uhid || p.patientId) ? (
                        <View style={styles.uhidBadge}>
                          <Text style={styles.uhidText}>ID: {p.uhid || p.patientId}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Top Action Menu (Edit / Delete) */}
                  <View style={styles.cardHeaderMenu}>
                    <TouchableOpacity
                      style={styles.iconMiniBtn}
                      onPress={() => handleOpenEdit(p)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.iconMiniBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconMiniBtn, styles.iconMiniBtnDanger]}
                      onPress={() => handleDeletePatient(p)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.iconMiniBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Details Section: Phone, Email, Address, Registration */}
                <View style={styles.cardDetailsBox}>
                  {p.phone ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📞</Text>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValueBold}>{p.phone}</Text>

                      {/* Quick Communication Shortcuts */}
                      <View style={styles.quickContactRow}>
                        <TouchableOpacity
                          style={styles.callChip}
                          onPress={() => handleCallPatient(p.phone)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.callChipText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.whatsappChip}
                          onPress={() => handleWhatsAppPatient(p.phone, p.name)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.whatsappChipText}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {p.email ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>✉️</Text>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {p.email}
                      </Text>
                    </View>
                  ) : null}

                  {p.address ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailLabel}>Address:</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>
                        {p.address}
                      </Text>
                    </View>
                  ) : null}

                  {formattedDate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>🗓️</Text>
                      <Text style={styles.detailLabel}>Registered:</Text>
                      <Text style={styles.detailValueMuted}>{formattedDate}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Bottom Clinical Actions Row */}
                <View style={styles.cardActionGrid}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => {
                      if (onNavigate) onNavigate('appointments', { patient: p });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnPrimaryText}>📅 Book Visit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => {
                      if (onNavigate) onNavigate('billing', { patientId: p._id || p.id });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnSecondaryText}>💳 Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnHistory}
                    onPress={() => handleOpenHistory(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnHistoryText}>📜 History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════
          MODAL 1: NEW PATIENT REGISTRATION
      ════════════════════════════════════════════ */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconBg}>
                    <Text style={styles.modalHeaderIcon}>🧑‍🤝‍🧑</Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Register New Patient</Text>
                    <Text style={styles.modalSubtitle}>Create a permanent OPD medical profile</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                {formSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successIcon}>✓</Text>
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
                        <Text style={styles.duplicateBtnText}>
                          Use Existing Profile ({duplicatePatient.name}) ➔
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    FULL NAME <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                {/* Age & Gender Row */}
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>
                      AGE (YRS) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g. 35"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={formData.age}
                      onChangeText={(text) => setFormData({ ...formData, age: text })}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1.4 }]}>
                    <Text style={styles.fieldLabel}>
                      GENDER <Text style={styles.requiredStar}>*</Text>
                    </Text>
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

                {/* Phone Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER (OPTIONAL)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. patient@example.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                  />
                </View>

                {/* Residential Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.textAreaInput]}
                    placeholder="House / Street, Locality, City..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                  />
                </View>

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRegisterSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>✓ Complete Registration</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL 2: EDIT PATIENT PROFILE
      ════════════════════════════════════════════ */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={[styles.modalIconBg, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.modalHeaderIcon}>✏️</Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Edit Patient Profile</Text>
                    <Text style={styles.modalSubtitle}>Update patient information</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsEditModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                {editSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.successText}>{editSuccess}</Text>
                  </View>
                ) : null}

                {editError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{editError}</Text>
                  </View>
                ) : null}

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    FULL NAME <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Patient Name"
                    placeholderTextColor="#94a3b8"
                    value={editFormData.name}
                    onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  />
                </View>

                {/* Age & Gender */}
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>
                      AGE (YRS) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="35"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={editFormData.age}
                      onChangeText={(text) => setEditFormData({ ...editFormData, age: text })}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1.4 }]}>
                    <Text style={styles.fieldLabel}>
                      GENDER <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderChip, editFormData.gender === g && styles.genderChipActive]}
                          onPress={() => setEditFormData({ ...editFormData, gender: g })}
                        >
                          <Text style={[styles.genderChipText, editFormData.gender === g && styles.genderChipTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER (OPTIONAL)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Phone number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={editFormData.phone}
                    onChangeText={(text) => setEditFormData({ ...editFormData, phone: text })}
                  />
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Email address"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={editFormData.email}
                    onChangeText={(text) => setEditFormData({ ...editFormData, email: text })}
                  />
                </View>

                {/* Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.textAreaInput]}
                    placeholder="Address"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    value={editFormData.address}
                    onChangeText={(text) => setEditFormData({ ...editFormData, address: text })}
                  />
                </View>

                {/* Save Changes Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, editSubmitting && styles.btnDisabled]}
                  onPress={handleEditSubmit}
                  disabled={editSubmitting}
                  activeOpacity={0.85}
                >
                  {editSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Profile Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL 3: PATIENT CLINICAL HISTORY
      ════════════════════════════════════════════ */}
      <Modal
        visible={isHistoryModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsHistoryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconBg, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={styles.modalHeaderIcon}>📜</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedPatientForHistory?.name || 'Patient'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedPatientForHistory?.gender} • {selectedPatientForHistory?.age} yrs •{' '}
                    {selectedPatientForHistory?.phone || 'No phone'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsHistoryModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.historyContent}>
              {loadingHistory ? (
                <View style={styles.historyCenterBox}>
                  <ActivityIndicator size="large" color="#0D9488" />
                  <Text style={styles.loadingText}>Fetching visit history...</Text>
                </View>
              ) : patientConsultations.length === 0 ? (
                <View style={styles.historyEmptyBox}>
                  <Text style={styles.historyEmptyIcon}>🩺</Text>
                  <Text style={styles.historyEmptyTitle}>No Past Consultations</Text>
                  <Text style={styles.historyEmptyText}>
                    This patient has no logged clinical consultations or prescriptions yet.
                  </Text>
                  <TouchableOpacity
                    style={styles.historyBookBtn}
                    onPress={() => {
                      setIsHistoryModalOpen(false);
                      if (onNavigate) onNavigate('appointments', { patient: selectedPatientForHistory });
                    }}
                  >
                    <Text style={styles.historyBookBtnText}>📅 Schedule First Visit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.historyList}>
                  <Text style={styles.historyCountLabel}>
                    Past Consultations ({patientConsultations.length})
                  </Text>

                  {patientConsultations.map((c, i) => {
                    const consultDate = c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Visit Date N/A';

                    return (
                      <View key={c._id || c.id || `cons-${i}`} style={styles.historyCard}>
                        <View style={styles.historyCardHeader}>
                          <View>
                            <Text style={styles.historyDoctorText}>👨‍⚕️ {c.doctorName || 'Doctor'}</Text>
                            <Text style={styles.historyDateText}>{consultDate}</Text>
                          </View>
                          {c.followUpDate ? (
                            <View style={styles.followUpBadge}>
                              <Text style={styles.followUpBadgeText}>
                                Next: {new Date(c.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Symptoms & Diagnosis */}
                        <View style={styles.historySection}>
                          {c.diagnosis ? (
                            <View style={styles.historyMetaRow}>
                              <Text style={styles.historyMetaLabel}>Diagnosis:</Text>
                              <Text style={styles.historyDiagnosisValue}>{c.diagnosis}</Text>
                            </View>
                          ) : null}

                          {c.symptoms ? (
                            <View style={styles.historyMetaRow}>
                              <Text style={styles.historyMetaLabel}>Symptoms:</Text>
                              <Text style={styles.historyMetaValue}>{c.symptoms}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Prescriptions */}
                        {Array.isArray(c.prescription) && c.prescription.length > 0 ? (
                          <View style={styles.historyPrescriptionBox}>
                            <Text style={styles.historySectionTitle}>
                              💊 Prescribed Medicines ({c.prescription.length})
                            </Text>
                            {c.prescription.map((med, mIdx) => (
                              <View key={`med-${mIdx}`} style={styles.medRow}>
                                <Text style={styles.medBullet}>•</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.medNameText}>{med.medicineName}</Text>
                                  <Text style={styles.medDosageText}>
                                    {med.dosage} {med.duration ? `• ${med.duration}` : ''}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : null}

                        {/* Diagnostic Tests */}
                        {Array.isArray(c.tests) && c.tests.length > 0 ? (
                          <View style={styles.historyTestsBox}>
                            <Text style={styles.historySectionTitle}>🔬 Diagnostic Tests Ordered</Text>
                            {c.tests.map((t, tIdx) => (
                              <View key={`t-${tIdx}`} style={styles.testItemRow}>
                                <Text style={styles.testNameText}>{t.testName}</Text>
                                {t.notes ? <Text style={styles.testNotesText}>({t.notes})</Text> : null}
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
  },

  /* ═══ Hero Header & Stats ═══ */
  heroBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  heroRegisterBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  heroRegisterBtnIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  heroRegisterBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  /* ═══ Responsive Stats Grid ═══ */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statsGridTablet: {
    flexWrap: 'nowrap',
  },
  statCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardMobile: {
    width: '48.5%',
  },
  statCardTablet: {
    flex: 1,
  },
  statCardHighlight: {
    backgroundColor: '#f0fdfa',
    borderColor: '#5eead4',
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 16,
  },
  statMetaBox: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },

  /* ═══ Control Panel (Search & Filters) ═══ */
  controlPanel: {
    gap: 10,
  },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPrefixIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPillsScroll: {
    gap: 6,
    paddingRight: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortBtnIcon: {
    fontSize: 11,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* ═══ Section List Header ═══ */
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  listHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  listCount: {
    color: '#0D9488',
    fontWeight: '800',
  },

  /* ═══ Patient Cards ═══ */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  genderMiniTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  genderMiniText: {
    fontSize: 10,
    fontWeight: '800',
  },
  patientInfoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  genderTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genderTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  uhidBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uhidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  cardHeaderMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconMiniBtn: {
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconMiniBtnDanger: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  iconMiniBtnText: {
    fontSize: 12,
  },

  /* Details Box */
  cardDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  detailValueBold: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  detailValueMuted: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  quickContactRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 6,
  },
  callChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  callChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  whatsappChip: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  whatsappChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Action Buttons Grid */
  cardActionGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  actionBtnPrimary: {
    flex: 1.4,
    backgroundColor: '#0D9488',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnHistory: {
    flex: 1.1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnHistoryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },

  /* ═══ Empty and Loading States ═══ */
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  primaryEmptyBtn: {
    marginTop: 8,
    backgroundColor: '#0D9488',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryEmptyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  /* ═══ Modals ═══ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderIcon: {
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '800',
  },
  modalContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 60,
  },

  /* Alert Banners */
  successBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successIcon: {
    color: '#047857',
    fontWeight: '900',
    fontSize: 14,
  },
  successText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
  duplicateBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  duplicateBtnText: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Form Elements */
  fieldGroup: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: '#e11d48',
    fontWeight: '800',
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  textAreaInput: {
    height: 76,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genderChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  genderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  genderChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* ═══ Clinical History Modal Styles ═══ */
  historyContent: {
    padding: 18,
    paddingBottom: 40,
  },
  historyCenterBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  historyEmptyBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  historyEmptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  historyEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  historyEmptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  historyBookBtn: {
    marginTop: 12,
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyBookBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  historyList: {
    gap: 12,
  },
  historyCountLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  historyDoctorText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  followUpBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  followUpBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  historySection: {
    gap: 4,
  },
  historyMetaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  historyMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  historyDiagnosisValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
    flex: 1,
  },
  historyMetaValue: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  historyPrescriptionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historySectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  medBullet: {
    color: '#0D9488',
    fontWeight: '800',
    fontSize: 12,
  },
  medNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  medDosageText: {
    fontSize: 11,
    color: '#64748b',
  },
  historyTestsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  testItemRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  testNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  testNotesText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
