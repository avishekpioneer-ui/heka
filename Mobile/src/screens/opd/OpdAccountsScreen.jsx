import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Switch
} from 'react-native';
import apiClient from '../../config/api';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

export default function OpdAccountsScreen({ onNavigate, refreshKey }) {
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [salariesData, setSalariesData] = useState({ totals: {}, salaries: [], unGeneratedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Part Payment Modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStaffItem, setSelectedStaffItem] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNote, setPayNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // History Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Edit Month Salary & DOJ Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSalaryAmount, setEditSalaryAmount] = useState('');
  const [editDoj, setEditDoj] = useState('');
  const [updatePermanentBase, setUpdatePermanentBase] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (m === 1) {
      setSelectedMonth(`${y - 1}-12`);
    } else {
      const prevM = m - 1;
      setSelectedMonth(`${y}-${prevM < 10 ? '0' + prevM : prevM}`);
    }
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (m === 12) {
      setSelectedMonth(`${y + 1}-01`);
    } else {
      const nextM = m + 1;
      setSelectedMonth(`${y}-${nextM < 10 ? '0' + nextM : nextM}`);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const salRes = await apiClient.get(`/api/opd/accounts/salaries?month=${selectedMonth}`).catch(() => ({ data: { totals: {}, salaries: [] } }));
      setSalariesData(salRes.data || { totals: {}, salaries: [] });
    } catch (err) {
      console.error('Fetch Accounts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, refreshKey]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open Payment modal
  const openPayModal = (item) => {
    setSelectedStaffItem(item);
    const remaining = item.salary?.remainingBalance || 0;
    const partNum = (item.salary?.payments?.length || 0) + 1;
    setPayAmount(remaining > 0 ? remaining.toString() : '');
    setPayMode('UPI');
    setPayNote(`Part ${partNum} Payment`);
    setPaymentModalVisible(true);
  };

  // Submit Part Payment
  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      setSubmittingPayment(true);
      await apiClient.post('/api/opd/accounts/salaries/payment', {
        staffId: selectedStaffItem.staff._id,
        month: selectedMonth,
        amount: parseFloat(payAmount),
        paymentMode: payMode,
        notes: payNote
      });

      setPaymentModalVisible(false);
      Alert.alert('Success', 'Installment payment recorded successfully!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record installment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Generate Payroll on click
  const handleGeneratePayroll = async (targetStaffId = null) => {
    try {
      setLoading(true);
      const payload = { month: selectedMonth };
      if (targetStaffId) payload.staffId = targetStaffId;
      await apiClient.post('/api/opd/accounts/salaries/generate', payload);
      Alert.alert('Success', `Salaries generated for ${formatMonthDisplay(selectedMonth)}`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate salaries');
      setLoading(false);
    }
  };

  // Open Edit Month Salary & DOJ modal
  const openEditModal = (item) => {
    setSelectedStaffItem(item);
    setEditSalaryAmount(item.salary?.baseSalary ? item.salary.baseSalary.toString() : (item.staff.baseSalary || 0).toString());
    const rawDoj = item.staff.doj ? new Date(item.staff.doj).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    setEditDoj(rawDoj);
    setUpdatePermanentBase(false);
    setEditModalVisible(true);
  };

  // Submit Edit Month Salary & DOJ
  const handleSaveSalaryAndDoj = async () => {
    if (!editSalaryAmount || Number(editSalaryAmount) < 0) {
      Alert.alert('Invalid Salary', 'Please enter a valid salary amount.');
      return;
    }

    try {
      setSubmittingEdit(true);

      // 1. Update Staff DOJ (and optional permanent base salary)
      if (editDoj) {
        await apiClient.put(`/api/opd/accounts/staff/${selectedStaffItem.staff._id}/profile`, {
          doj: editDoj,
          baseSalary: updatePermanentBase ? parseFloat(editSalaryAmount) : undefined
        });
      }

      // 2. Update Month Salary Amount
      if (selectedStaffItem.isGenerated && selectedStaffItem.salary?._id) {
        await apiClient.put(`/api/opd/accounts/salaries/${selectedStaffItem.salary._id}/amount`, {
          amount: parseFloat(editSalaryAmount),
          updatePermanentBase
        });
      } else {
        // Generate first then update amount
        const genRes = await apiClient.post('/api/opd/accounts/salaries/generate', {
          month: selectedMonth,
          staffId: selectedStaffItem.staff._id
        });
        const createdRecord = genRes.data?.records?.[0];
        if (createdRecord?._id) {
          await apiClient.put(`/api/opd/accounts/salaries/${createdRecord._id}/amount`, {
            amount: parseFloat(editSalaryAmount),
            updatePermanentBase
          });
        }
      }

      setEditModalVisible(false);
      Alert.alert('Updated', 'Staff salary & DOJ updated successfully!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update salary/DOJ');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const filteredSalaries = useMemo(() => {
    return (salariesData.salaries || []).filter((item) =>
      item.staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staff.roleName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [salariesData, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.monthTitleBox}>
          <Text style={styles.monthLabel}>Billing Period</Text>
          <Text style={styles.monthValue}>{formatMonthDisplay(selectedMonth)}</Text>
        </View>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
          <Text style={styles.monthBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: '#0d9488' }]}>
          <Text style={styles.metricLabel}>Total Due</Text>
          <Text style={styles.metricValue}>{formatINR(salariesData.totals?.totalPayable || 0)}</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.metricLabel}>Disbursed</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>{formatINR(salariesData.totals?.totalPaid || 0)}</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{formatINR(salariesData.totals?.totalPending || 0)}</Text>
        </View>
      </View>

      {/* Generate Payroll Action Banner if ungenerated records exist */}
      {salariesData.unGeneratedCount > 0 && (
        <View style={styles.generateBanner}>
          <Text style={styles.generateBannerText}>
            ⚡ {salariesData.unGeneratedCount} staff pending salary generation
          </Text>
          <TouchableOpacity onPress={() => handleGeneratePayroll()} style={styles.generateBannerBtn}>
            <Text style={styles.generateBannerBtnText}>Generate All</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Calculating salary balances...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSalaries}
          keyExtractor={(item) => item.staff._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />}
          ListHeaderComponent={
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search staff by name or role..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9ca3af"
              />
            </View>
          }
          renderItem={({ item }) => {
            const carry = item.salary.carriedOverBalance || 0;
            const payments = item.salary.payments || [];
            const dojText = item.staff.doj ? new Date(item.staff.doj).toLocaleDateString('en-IN') : 'N/A';

            return (
              <View style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{item.staff.name}</Text>
                    <View style={styles.subInfoRow}>
                      <Text style={styles.staffRole}>{item.staff.roleName}</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.dojText}>DOJ: {dojText}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, item.isGenerated && item.salary.status === 'Paid' ? styles.statusPaid : item.isGenerated && item.salary.status === 'Partially Paid' ? styles.statusPartial : styles.statusUnpaid]}>
                    <Text style={styles.statusText}>{item.isGenerated ? item.salary.status : 'Not Generated'}</Text>
                  </View>
                </View>

                {/* Salary Calculation Breakdown */}
                <View style={styles.calcRow}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Salary ✏️</Text>
                    <Text style={[styles.calcVal, { color: '#0d9488', textDecorationLine: 'underline' }]}>
                      {formatINR(item.salary.baseSalary)}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Carry-over</Text>
                    <Text style={[styles.calcVal, carry > 0 ? { color: '#d97706' } : carry < 0 ? { color: '#7c3aed' } : { color: '#6b7280' }]}>
                      {carry > 0 ? `+${formatINR(carry)}` : carry < 0 ? `-${formatINR(Math.abs(carry))}` : '₹0'}
                    </Text>
                  </View>
                  <View style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Net Payable</Text>
                    <Text style={[styles.calcVal, { color: '#0f766e', fontWeight: 'bold' }]}>{formatINR(item.salary.netPayable)}</Text>
                  </View>
                </View>

                {/* Paid & Remaining */}
                <View style={styles.paidRow}>
                  <Text style={styles.paidText}>Paid: <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{formatINR(item.salary.totalPaid)}</Text> ({payments.length} parts)</Text>
                  <Text style={styles.remainingText}>
                    {item.salary.remainingBalance > 0 ? `Due: ${formatINR(item.salary.remainingBalance)}` : item.salary.remainingBalance < 0 ? `Overpaid: ${formatINR(Math.abs(item.salary.remainingBalance))}` : 'Fully Paid'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={styles.editBtn}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit Salary/DOJ</Text>
                  </TouchableOpacity>

                  {!item.isGenerated ? (
                    <TouchableOpacity
                      onPress={() => handleGeneratePayroll(item.staff._id)}
                      style={styles.payBtn}
                    >
                      <Text style={styles.payBtnText}>⚡ Generate</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedStaffItem(item);
                          setHistoryModalVisible(true);
                        }}
                        style={styles.historyBtn}
                      >
                        <Text style={styles.historyBtnText}>📜 Slip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openPayModal(item)}
                        style={styles.payBtn}
                      >
                        <Text style={styles.payBtnText}>+ Pay Part</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No staff eligible for {formatMonthDisplay(selectedMonth)}.</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                Salary begins strictly from staff Date of Joining (DOJ) month onwards.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal 1: Edit Month Salary & DOJ */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Salary & Date of Joining</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStaffItem?.staff.name} — {formatMonthDisplay(selectedMonth)}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Salary for {formatMonthDisplay(selectedMonth)} (₹) *</Text>
              <TextInput
                keyboardType="numeric"
                value={editSalaryAmount}
                onChangeText={setEditSalaryAmount}
                style={styles.textInput}
                placeholder="10000"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Joining (DOJ) (YYYY-MM-DD) *</Text>
              <TextInput
                value={editDoj}
                onChangeText={setEditDoj}
                style={styles.textInput}
                placeholder="2026-09-01"
              />
              <Text style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                Salary eligibility starts only from this month onwards.
              </Text>
            </View>

            <View style={styles.switchRow}>
              <Switch
                value={updatePermanentBase}
                onValueChange={setUpdatePermanentBase}
                trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
              />
              <Text style={styles.switchText}>
                Also update permanent default base salary for future months
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSalaryAndDoj}
                disabled={submittingEdit}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>{submittingEdit ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Part Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Part Salary Payment</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStaffItem?.staff.name} ({formatMonthDisplay(selectedMonth)})
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                style={styles.textInput}
                placeholder="4000"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Installment Note</Text>
              <TextInput
                value={payNote}
                onChangeText={setPayNote}
                style={styles.textInput}
                placeholder="Part 1 payment"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRecordPayment}
                disabled={submittingPayment}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>{submittingPayment ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Installment History Modal */}
      <Modal visible={historyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Installment History & Slip</Text>
            <Text style={styles.modalSubtitle}>{selectedStaffItem?.staff.name} — {formatMonthDisplay(selectedMonth)}</Text>

            <ScrollView style={{ marginTop: 10 }}>
              {(!selectedStaffItem?.salary?.payments || selectedStaffItem.salary.payments.length === 0) ? (
                <Text style={{ textAlign: 'center', color: '#6b7280', marginVertical: 20 }}>No installments recorded yet.</Text>
              ) : (
                selectedStaffItem.salary.payments.map((p) => (
                  <View key={p._id} style={styles.historyItem}>
                    <View>
                      <Text style={styles.historyPart}>Part {p.partNumber}</Text>
                      <Text style={styles.historyDate}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <Text style={styles.historyAmount}>{formatINR(p.amount)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={[styles.modalCancelBtn, { marginTop: 15 }]}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  monthBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  monthBtnText: { color: '#0f766e', fontWeight: 'bold' },
  monthTitleBox: { alignItems: 'center' },
  monthLabel: { fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' },
  monthValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  metricsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  metricCard: { flex: 1, backgroundColor: '#ffffff', padding: 10, borderRadius: 12, borderLeftWidth: 4, elevation: 1 },
  metricLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  metricValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  generateBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#ccfbf1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99f6e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  generateBannerText: { fontSize: 11, fontWeight: 'bold', color: '#115e59', flex: 1 },
  generateBannerBtn: { backgroundColor: '#0d9488', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  generateBannerBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#0f766e', fontSize: 13 },
  searchBox: { padding: 12 },
  searchInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  staffCard: { backgroundColor: '#ffffff', marginHorizontal: 12, marginBottom: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  staffName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  staffRole: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  dotSeparator: { fontSize: 11, color: '#cbd5e1', marginHorizontal: 4 },
  dojText: { fontSize: 11, color: '#0f766e', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPaid: { backgroundColor: '#dcfce7' },
  statusPartial: { backgroundColor: '#fef3c7' },
  statusUnpaid: { backgroundColor: '#ffe4e6' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  calcRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderRadius: 10, marginTop: 10 },
  calcItem: { flex: 1, alignItems: 'center' },
  calcLabel: { fontSize: 10, color: '#64748b' },
  calcVal: { fontSize: 12, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  paidRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  paidText: { fontSize: 12, color: '#475569' },
  remainingText: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  editBtn: { flex: 1.2, paddingVertical: 8, backgroundColor: '#f0fdf4', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  editBtnText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },
  historyBtn: { flex: 0.8, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 8, alignItems: 'center' },
  historyBtnText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  payBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#0d9488', borderRadius: 8, alignItems: 'center' },
  payBtnText: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 15 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  switchText: { fontSize: 11, color: '#475569', flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 },
  modalCancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#f1f5f9' },
  modalCancelText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },
  modalSubmitBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#0d9488' },
  modalSubmitText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyPart: { fontSize: 13, fontWeight: 'bold', color: '#0f766e' },
  historyDate: { fontSize: 11, color: '#94a3b8' },
  historyAmount: { fontSize: 14, fontWeight: 'bold', color: '#10b981' }
});
