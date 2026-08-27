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
  Switch,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import apiClient from '../../config/api';

const AVAILABLE_PERMISSIONS = [
  { id: 'access_opd', label: 'Access OPD Portal / View Dashboard' },
  { id: 'manage_patients', label: 'Register & View Patients' },
  { id: 'manage_appointments', label: 'Book & View Appointments' },
  { id: 'manage_consultations', label: 'Doctor Workspaces & Clinical Prescriptions' },
  { id: 'manage_tests', label: 'Manage Diagnostics & Test Price catalogs' },
  { id: 'manage_medicines', label: 'Manage Pharmacy stock & Medicine price catalogs' },
  { id: 'manage_billing', label: 'Generate bills, invoices, checkouts, and record payments' },
  { id: 'manage_roles', label: 'Configure Custom roles, permissions, and Staff logins' },
];

export default function OpdRolesScreen() {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'roles'
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal 1: Staff Registration
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [staffIsDoctor, setStaffIsDoctor] = useState(false);
  const [staffFees, setStaffFees] = useState('50');

  // Modal 2: Custom Role Creation / Edit
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');

  const selectedRole = roles.find((r) => (r._id || r.id) === staffRoleId);
  const isDoctorSelected = Boolean(
    staffIsDoctor || (selectedRole && selectedRole.name?.toLowerCase().includes('doctor'))
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      const [rolesRes, staffRes] = await Promise.all([
        apiClient.get('/api/opd/staff/roles').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/staff/staff').catch(() => ({ data: [] })),
      ]);

      const rData = rolesRes.data?.roles || rolesRes.data || [];
      const sData = staffRes.data?.staff || staffRes.data || [];

      const loadedRoles = Array.isArray(rData) ? rData : [];
      setRoles(loadedRoles);
      setStaffList(Array.isArray(sData) ? sData : []);

      // Default staffRoleId to the first role or "Doctor" role if available
      if (!staffRoleId && loadedRoles.length > 0) {
        const docRole = loadedRoles.find((r) => r.name?.toLowerCase().includes('doctor'));
        setStaffRoleId(docRole ? docRole._id || docRole.id : loadedRoles[0]._id || loadedRoles[0].id);
      }
    } catch (err) {
      console.error('Error loading roles & staff data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Open Add Staff Modal ──────────────────────────────────────────────────
  const handleOpenAddStaff = () => {
    setStaffName('');
    setStaffEmail('');
    setStaffPassword('');
    setStaffFees('50');
    setStaffError('');
    setStaffSuccess('');

    if (roles.length > 0) {
      const docRole = roles.find((r) => r.name?.toLowerCase().includes('doctor'));
      setStaffRoleId(docRole ? docRole._id || docRole.id : roles[0]._id || roles[0].id);
    } else {
      setStaffRoleId('');
    }

    setIsStaffModalOpen(true);
  };

  // ── Submit Staff Registration ─────────────────────────────────────────────
  const handleRegisterStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim() || !staffRoleId) {
      setStaffError('Please complete all required fields (*)');
      return;
    }

    setStaffError('');
    setStaffSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/staff/staff', {
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        password: staffPassword,
        roleId: staffRoleId,
        isDoctor: !!isDoctorSelected,
        fees: isDoctorSelected ? parseFloat(staffFees || 0) : 0,
      });

      setStaffSuccess('Staff account created successfully!');
      fetchData();

      setTimeout(() => {
        setIsStaffModalOpen(false);
        setStaffSuccess('');
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
      }, 1000);
    } catch (err) {
      setStaffError(err.response?.data?.message || 'Error creating staff login.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Staff ──────────────────────────────────────────────────────────
  const handleDeleteStaff = (staffId, staffMemberName) => {
    Alert.alert(
      'Remove Staff Account',
      `Are you sure you want to remove ${staffMemberName || 'this staff member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/staff/staff/${staffId}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  // ── Open Create Role Modal ────────────────────────────────────────────────
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setSelectedPermissions(['access_opd']);
    setRoleError('');
    setRoleSuccess('');
    setIsRoleModalOpen(true);
  };

  // ── Open Edit Role Modal ──────────────────────────────────────────────────
  const handleOpenEditRole = (role) => {
    setEditingRoleId(role._id || role.id);
    setRoleName(role.name);
    setSelectedPermissions(Array.isArray(role.permissions) ? [...role.permissions] : []);
    setRoleError('');
    setRoleSuccess('');
    setIsRoleModalOpen(true);
  };

  // ── Toggle Permission Checkbox ────────────────────────────────────────────
  const handlePermissionToggle = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // ── Submit Create / Update Role ───────────────────────────────────────────
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      setRoleError('Role name is required');
      return;
    }

    setRoleError('');
    setRoleSuccess('');
    setSubmitting(true);

    try {
      if (editingRoleId) {
        await apiClient.put(`/api/opd/staff/roles/${editingRoleId}`, {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        setRoleSuccess('Role updated successfully!');
      } else {
        await apiClient.post('/api/opd/staff/roles', {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        setRoleSuccess('Custom role created successfully!');
      }

      fetchData();

      setTimeout(() => {
        setIsRoleModalOpen(false);
        setRoleSuccess('');
        setRoleName('');
        setSelectedPermissions([]);
        setEditingRoleId(null);
      }, 1000);
    } catch (err) {
      setRoleError(err.response?.data?.message || 'Error saving role.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Role ───────────────────────────────────────────────────────────
  const handleDeleteRole = (roleId, rName) => {
    if (rName === 'Doctor') {
      Alert.alert('Protected Role', 'The standard "Doctor" role cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Access Role',
      `Are you sure you want to delete role "${rName}"? Staff assigned to this role will lose their configured permissions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/staff/roles/${roleId}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete role');
            }
          },
        },
      ]
    );
  };

  const doctorsCount = staffList.filter(
    (s) => s.isDoctor || s.role?.name?.toLowerCase().includes('doctor')
  ).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title}>Staff & Roles Access</Text>
            <Text style={styles.subtitle}>
              Configure custom roles, adjust permissions & onboard staff logins
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => (activeTab === 'staff' ? handleOpenAddStaff() : handleOpenCreateRole())}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>
              + {activeTab === 'staff' ? 'Add Staff' : 'Create Role'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{staffList.length}</Text>
            <Text style={styles.statLbl}>Total Staff</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#7c3aed' }]}>{doctorsCount}</Text>
            <Text style={styles.statLbl}>Doctors on Roster</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#0d9488' }]}>{roles.length}</Text>
            <Text style={styles.statLbl}>Configured Roles</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnActive]}
            onPress={() => setActiveTab('staff')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}>
              👨‍⚕️ Staff Roster ({staffList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'roles' && styles.tabBtnActive]}
            onPress={() => setActiveTab('roles')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'roles' && styles.tabTextActive]}>
              🛡️ Access Roles ({roles.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Loading staff & permissions...</Text>
          </View>
        ) : activeTab === 'staff' ? (
          // ── Staff Roster Tab ───────────────────────────────────────────────
          staffList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyTitle}>No OPD Staff Members Found</Text>
              <Text style={styles.emptyText}>
                Tap "+ Add Staff" to register doctors, receptionists, or clinic personnel.
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { marginTop: 12 }]}
                onPress={handleOpenAddStaff}
              >
                <Text style={styles.addBtnText}>+ Register Staff Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            staffList.map((s) => {
              const isDoc = s.isDoctor || s.role?.name?.toLowerCase().includes('doctor');
              const roleNameDisplay = s.role?.name || (s.role && typeof s.role === 'string' ? s.role : 'No Role');

              return (
                <View key={s._id || s.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                      </Text>
                    </View>

                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{s.name}</Text>
                      <Text style={styles.staffEmail}>{s.email}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteStaffBtn}
                      onPress={() => handleDeleteStaff(s._id || s.id, s.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteStaffBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>🛡️ {roleNameDisplay}</Text>
                    </View>

                    {s.isDoctor && (
                      <View style={styles.doctorBadge}>
                        <Text style={styles.doctorBadgeText}>🩺 Doctor</Text>
                      </View>
                    )}

                    {isDoc && (s.fees || s.fees === 0) && (
                      <View style={styles.feeBadge}>
                        <Text style={styles.feeBadgeText}>💰 Fee: ₹{s.fees}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : (
          // ── Roles Matrix Tab ───────────────────────────────────────────────
          roles.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Access Roles Configured</Text>
              <Text style={styles.emptyText}>
                Tap "+ Create Role" to create customized permission sets.
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { marginTop: 12 }]}
                onPress={handleOpenCreateRole}
              >
                <Text style={styles.addBtnText}>+ Create Access Role</Text>
              </TouchableOpacity>
            </View>
          ) : (
            roles.map((r) => {
              const isDefaultDoctor = r.name === 'Doctor';
              const permsList = Array.isArray(r.permissions) ? r.permissions : [];

              return (
                <View key={r._id || r.id} style={styles.card}>
                  <View style={styles.roleCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.roleTitleRow}>
                        <Text style={styles.customRoleTitle}>{r.name}</Text>
                        {isDefaultDoctor && (
                          <View style={styles.systemBadge}>
                            <Text style={styles.systemBadgeText}>System Role</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.permCountText}>
                        {permsList.length} permissions configured
                      </Text>
                    </View>

                    <View style={styles.roleHeaderActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEditRole(r)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.editBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>

                      {!isDefaultDoctor && (
                        <TouchableOpacity
                          style={styles.deleteRoleIconBtn}
                          onPress={() => handleDeleteRole(r._id || r.id, r.name)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteRoleIconText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <Text style={styles.permListTitle}>PERMISSIONS MATRIX:</Text>
                  <View style={styles.permChipsRow}>
                    {permsList.length > 0 ? (
                      permsList.map((p) => {
                        const permObj = AVAILABLE_PERMISSIONS.find((ap) => ap.id === p);
                        return (
                          <View key={p} style={styles.permChip}>
                            <Text style={styles.permChipText}>✓ {permObj ? permObj.label : p}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.noPermText}>No explicit permissions assigned</Text>
                    )}
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* ── Modal 1: Register Staff Account ──────────────────────────────────── */}
      <Modal
        visible={isStaffModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsStaffModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Register OPD Staff Member</Text>
                  <TouchableOpacity onPress={() => setIsStaffModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {staffSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{staffSuccess}</Text>
                  </View>
                ) : null}

                {staffError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{staffError}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>STAFF FULL NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Dr. Jane Smith / John Doe"
                    placeholderTextColor="#94a3b8"
                    value={staffName}
                    onChangeText={setStaffName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>LOGIN EMAIL ADDRESS *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="staff@hospital.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={staffEmail}
                    onChangeText={setStaffEmail}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>LOGIN PASSWORD *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    value={staffPassword}
                    onChangeText={setStaffPassword}
                  />
                </View>

                {/* Role Profile Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ASSIGN ROLE PROFILE *</Text>
                  {roles.length === 0 ? (
                    <Text style={styles.fieldHintWarning}>
                      ⚠️ No roles found. Please create a role profile first.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.roleScrollRow}
                      keyboardShouldPersistTaps="handled"
                    >
                      {roles.map((r) => {
                        const isSelected = staffRoleId === (r._id || r.id);
                        return (
                          <TouchableOpacity
                            key={r._id || r.id}
                            style={[styles.roleSelectChip, isSelected && styles.roleSelectChipActive]}
                            onPress={() => setStaffRoleId(r._id || r.id)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.roleSelectChipText,
                                isSelected && styles.roleSelectChipTextActive,
                              ]}
                            >
                              {r.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500', flex: 1, paddingRight: 8 }}>
                    Designate as Doctor
                  </Text>
                  <Switch
                    value={staffIsDoctor}
                    onValueChange={setStaffIsDoctor}
                    trackColor={{ false: '#cbd5e1', true: '#99f6e4' }}
                    thumbColor={staffIsDoctor ? '#0f766e' : '#f8fafc'}
                  />
                </View>

                {isDoctorSelected && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>DEFAULT CONSULTATION FEE (₹) *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="50"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      value={staffFees}
                      onChangeText={setStaffFees}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRegisterStaff}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Staff Account</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal 2: Create / Edit Custom Role ────────────────────────────────── */}
      <Modal
        visible={isRoleModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsRoleModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingRoleId ? 'Edit Access Role' : 'Create Custom Access Role'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsRoleModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {roleSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{roleSuccess}</Text>
                  </View>
                ) : null}

                {roleError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{roleError}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ROLE NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Pharmacy Manager / Senior Receptionist"
                    placeholderTextColor="#94a3b8"
                    value={roleName}
                    onChangeText={setRoleName}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ASSIGN PERMISSIONS MATRIX *</Text>
                  <Text style={styles.fieldSubLabel}>
                    Choose access rights granted to staff members with this role:
                  </Text>
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <TouchableOpacity
                        key={perm.id}
                        style={[styles.permCheckRow, isChecked && styles.permCheckRowActive]}
                        onPress={() => handlePermissionToggle(perm.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkBox, isChecked && styles.checkBoxActive]}>
                          {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
                        </View>
                        <Text
                          style={[
                            styles.permCheckText,
                            isChecked && styles.permCheckTextActive,
                          ]}
                        >
                          {perm.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleSaveRole}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingRoleId ? 'Update Role Permissions' : 'Save Custom Role'}
                    </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 3,
    marginTop: 4,
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
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#0f766e',
    fontWeight: '800',
    fontSize: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  staffEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deleteStaffBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteStaffBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderColor: '#ccfbf1',
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d9488',
  },
  doctorBadge: {
    backgroundColor: '#faf5ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderColor: '#f3e8ff',
    borderWidth: 1,
  },
  doctorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7e22ce',
  },
  feeBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderColor: '#fef3c7',
    borderWidth: 1,
  },
  feeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customRoleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  systemBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  permCountText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  roleHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  editBtnText: {
    color: '#0d9488',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteRoleIconBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteRoleIconText: {
    fontSize: 11,
  },
  permListTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  permChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  permChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  permChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  noPermText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
    paddingBottom: 56,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  fieldSubLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  fieldHintWarning: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
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
  roleScrollRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  roleSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleSelectChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  roleSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  roleSelectChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  switchDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  permCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
  },
  permCheckRowActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkBoxActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  permCheckText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  permCheckTextActive: {
    color: '#0f766e',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
