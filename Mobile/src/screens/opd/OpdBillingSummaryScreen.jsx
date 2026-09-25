import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import apiClient from '../../config/api';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function OpdBillingSummaryScreen({ onNavigate, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all-due'); // 'all-due' | 'this-month' | 'this-week' | 'today' | 'recent-paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [payingBillId, setPayingBillId] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/opd/billing/summary');
      if (res.data?.success && res.data?.summary) {
        setData(res.data.summary);
      }
    } catch (err) {
      console.error('Fetch billing summary mobile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshKey]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleMarkPaid = (billId, patientName, amount) => {
    Alert.alert(
      'Mark as Paid',
      `Record full payment of ${formatINR(amount)} for ${patientName || 'this invoice'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Mark Paid',
          onPress: async () => {
            try {
              setPayingBillId(billId);
              await apiClient.put(`/api/opd/billing/${billId}/pay`);
              fetchSummary();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update payment.');
            } finally {
              setPayingBillId(null);
            }
          }
        }
      ]
    );
  };

  const allTime = data?.allTime || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };
  const thisMonth = data?.thisMonth || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0, monthName: '' };
  const thisWeek = data?.thisWeek || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };
  const today = data?.today || { totalBilled: 0, totalPaid: 0, totalDue: 0, totalCount: 0, paidCount: 0, dueCount: 0 };

  const displayedInvoices = useMemo(() => {
    if (!data) return [];
    let list = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    if (activeFilter === 'recent-paid') {
      list = data.recentPaidInvoices || [];
    } else {
      const dues = data.dueInvoices || [];
      if (activeFilter === 'all-due') {
        list = dues;
      } else if (activeFilter === 'today') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfToday);
      } else if (activeFilter === 'this-week') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfWeek);
      } else if (activeFilter === 'this-month') {
        list = dues.filter(b => new Date(b.createdAt) >= startOfMonth);
      }
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(b => {
      const pName = (b.patientId?.name || '').toLowerCase();
      const pPhone = (b.patientId?.phone || '').toLowerCase();
      const invNo = String(b.invoiceNumber || b._id || '').toLowerCase();
      return pName.includes(q) || pPhone.includes(q) || invNo.includes(q);
    });
  }, [data, activeFilter, searchQuery]);

  const renderHeader = () => {
    const collectionPercent = allTime.totalBilled > 0
      ? Math.round((allTime.totalPaid / allTime.totalBilled) * 100)
      : 0;

    return (
      <View style={styles.headerContainer}>
        {/* Title Bar */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>📊 Revenue & Dues</Text>
            <Text style={styles.screenSubtitle}>Financial summary and unpaid receivables</Text>
          </View>
        </View>

        {/* 6 Summary Cards Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsCarousel}>
          {/* Card 1: All Time Total Billed */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelLight}>TOTAL BILLED</Text>
              <Text style={styles.metricBadgeLight}>All Time</Text>
            </View>
            <Text style={styles.metricValueLight}>{formatINR(allTime.totalBilled)}</Text>
            <View style={styles.metricCardFooterLight}>
              <Text style={styles.metricSubtextLight}>{allTime.totalCount} Total Invoices</Text>
              <Text style={styles.metricSubtextLight}>{collectionPercent}% Paid</Text>
            </View>
          </View>

          {/* Card 2: Total Received / Paid Amount */}
          <View style={[styles.metricCard, styles.metricCardReceived]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelReceived}>RECEIVED AMOUNT</Text>
              <View style={styles.badgeReceived}>
                <Text style={styles.badgeReceivedText}>{allTime.paidCount} Paid</Text>
              </View>
            </View>
            <Text style={styles.metricValueReceived}>{formatINR(allTime.totalPaid)}</Text>
            <View style={styles.metricCardFooter}>
              <Text style={styles.metricSubtextReceived}>✓ Collected in OPD Cash/UPI</Text>
            </View>
          </View>

          {/* Card 3: Total Due */}
          <View style={[styles.metricCard, styles.metricCardDue]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelDue}>OUTSTANDING DUE</Text>
              <View style={styles.badgeDue}>
                <Text style={styles.badgeDueText}>{allTime.dueCount} Unpaid</Text>
              </View>
            </View>
            <Text style={styles.metricValueDue}>{formatINR(allTime.totalDue)}</Text>
            <View style={styles.metricCardFooter}>
              <Text style={styles.metricSubtextDue}>Pending patient settlement</Text>
            </View>
          </View>

          {/* Card 4: This Month */}
          <View style={[styles.metricCard, styles.metricCardMonth]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelMonth}>THIS MONTH</Text>
              <Text style={styles.metricBadgeMonth}>{thisMonth.monthName || 'Month'}</Text>
            </View>
            <Text style={styles.metricValueMonth}>{formatINR(thisMonth.totalBilled)}</Text>
            <View style={styles.metricCardSplit}>
              <Text style={styles.metricSplitPaidDark}>Received: {formatINR(thisMonth.totalPaid)}</Text>
              <Text style={styles.metricSplitDueDark}>Due: {formatINR(thisMonth.totalDue)}</Text>
            </View>
          </View>

          {/* Card 5: This Week */}
          <View style={[styles.metricCard, styles.metricCardWeek]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelWeek}>THIS WEEK</Text>
              <Text style={styles.metricBadgeWeek}>{thisWeek.totalCount} Bills</Text>
            </View>
            <Text style={styles.metricValueWeek}>{formatINR(thisWeek.totalBilled)}</Text>
            <View style={styles.metricCardSplit}>
              <Text style={styles.metricSplitPaidDark}>Received: {formatINR(thisWeek.totalPaid)}</Text>
              <Text style={styles.metricSplitDueDark}>Due: {formatINR(thisWeek.totalDue)}</Text>
            </View>
          </View>

          {/* Card 6: Today */}
          <View style={[styles.metricCard, styles.metricCardToday]}>
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricLabelToday}>TODAY</Text>
              <Text style={styles.metricBadgeToday}>{today.totalCount} Created</Text>
            </View>
            <Text style={styles.metricValueToday}>{formatINR(today.totalBilled)}</Text>
            <View style={styles.metricCardSplit}>
              <Text style={styles.metricSplitPaidDark}>Received: {formatINR(today.totalPaid)}</Text>
              <Text style={styles.metricSplitDueDark}>Due: {formatINR(today.totalDue)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search patient, phone, or invoice..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all-due' && styles.filterChipActiveDue]}
            onPress={() => setActiveFilter('all-due')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all-due' && styles.filterChipTextActive]}>
              All Due ({allTime.dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'this-month' && styles.filterChipActive]}
            onPress={() => setActiveFilter('this-month')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'this-month' && styles.filterChipTextActive]}>
              This Month Due ({thisMonth.dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'this-week' && styles.filterChipActive]}
            onPress={() => setActiveFilter('this-week')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'this-week' && styles.filterChipTextActive]}>
              This Week Due ({thisWeek.dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'today' && styles.filterChipActive]}
            onPress={() => setActiveFilter('today')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'today' && styles.filterChipTextActive]}>
              Today Due ({today.dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'recent-paid' && styles.filterChipActivePaid]}
            onPress={() => setActiveFilter('recent-paid')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'recent-paid' && styles.filterChipTextActive]}>
              Settled / Paid ({data?.recentPaidInvoices?.length || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'recent-paid' ? 'Settled Invoices' : 'Outstanding Bills'} ({displayedInvoices.length})
          </Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isPaid = (item.status === 'Paid' || item.status === 'PAID' || item.paymentStatus === 'Paid');
    const invCode = String(item.invoiceNumber || item._id || '').slice(-8).toUpperCase();
    const patientName = item.patientId?.name || 'Walk-in Patient';
    const patientPhone = item.patientId?.phone || '';
    const testsCount = (item.tests || []).length;
    const medsCount = (item.medicines || []).length;
    const consultFee = parseFloat(item.consultationFee || 0);

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.codeRow}>
              <Text style={styles.invoiceCode}>🧾 #{invCode}</Text>
              <Text style={styles.invoiceDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.patientName}>{patientName}</Text>
            {patientPhone ? <Text style={styles.patientPhone}>📞 {patientPhone}</Text> : null}
          </View>

          <View style={styles.amountCol}>
            <Text style={[styles.amountValue, isPaid ? styles.amountValuePaid : styles.amountValueDue]}>
              {formatINR(item.totalAmount)}
            </Text>
            <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
              <Text style={[styles.statusBadgeText, isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextPending]}>
                {isPaid ? '✓ PAID' : '⏳ DUE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Breakdown Tags */}
        <View style={styles.tagsRow}>
          <View style={styles.tagItem}>
            <Text style={styles.tagText}>{item.billingType || 'Bill'}</Text>
          </View>
          {consultFee > 0 && (
            <View style={[styles.tagItem, styles.tagConsult]}>
              <Text style={styles.tagConsultText}>👨‍⚕️ Consult</Text>
            </View>
          )}
          {testsCount > 0 && (
            <View style={[styles.tagItem, styles.tagTest]}>
              <Text style={styles.tagTestText}>🧪 {testsCount} Test{testsCount > 1 ? 's' : ''}</Text>
            </View>
          )}
          {medsCount > 0 && (
            <View style={[styles.tagItem, styles.tagMed]}>
              <Text style={styles.tagMedText}>💊 {medsCount} Med{medsCount > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {/* Action Button for Unpaid Invoices */}
        {!isPaid && (
          <TouchableOpacity
            style={styles.payActionBtn}
            onPress={() => handleMarkPaid(item._id, patientName, item.totalAmount)}
            disabled={payingBillId === item._id}
            activeOpacity={0.8}
          >
            {payingBillId === item._id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.payActionBtnText}>💳 Record Payment (Mark Paid)</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyTitle}>No Invoices Found</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'No bills match your search criteria.'
            : activeFilter === 'recent-paid'
              ? 'No settled payments recorded yet.'
              : 'All patient bills in this category are fully paid!'}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading revenue & dues summary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={displayedInvoices}
        keyExtractor={(item, index) => item._id || `inv-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0D9488']}
            tintColor="#0D9488"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#0f766e', fontSize: 14, fontWeight: '600' },
  listContainer: { padding: 14, paddingBottom: 110 },
  headerContainer: { gap: 12, marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  screenSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  billsNavBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  billsNavBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  // Metrics Carousel
  metricsCarousel: { gap: 12, paddingVertical: 4 },
  metricCard: {
    width: 220,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  metricCardPrimary: { backgroundColor: '#134e4a' },
  metricCardReceived: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#86efac' },
  metricCardDue: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fecdd3' },
  metricCardMonth: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#a7f3d0' },
  metricCardWeek: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#99f6e4' },
  metricCardToday: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fed7aa' },

  metricCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabelLight: { fontSize: 10, fontWeight: '800', color: '#5eead4', letterSpacing: 0.5 },
  metricBadgeLight: { fontSize: 10, fontWeight: '700', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricValueLight: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginTop: 8 },
  metricCardFooterLight: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metricSubtextLight: { fontSize: 11, color: '#99f6e4', fontWeight: '600' },
  metricSplitRowLight: { marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 4 },
  metricSplitPaid: { fontSize: 11, color: '#a7f3d0', fontWeight: '700' },

  metricLabelReceived: { fontSize: 10, fontWeight: '800', color: '#15803d', letterSpacing: 0.5 },
  badgeReceived: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeReceivedText: { fontSize: 10, fontWeight: '800', color: '#16a34a' },
  metricValueReceived: { fontSize: 22, fontWeight: '800', color: '#15803d', marginTop: 8 },
  metricSubtextReceived: { fontSize: 11, color: '#166534', fontWeight: '700' },

  metricLabelDue: { fontSize: 10, fontWeight: '800', color: '#e11d48', letterSpacing: 0.5 },
  badgeDue: { backgroundColor: '#ffe4e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeDueText: { fontSize: 10, fontWeight: '800', color: '#e11d48' },
  metricValueDue: { fontSize: 22, fontWeight: '800', color: '#e11d48', marginTop: 8 },
  metricCardFooter: { marginTop: 8 },
  metricSubtextDue: { fontSize: 11, color: '#9f1239', fontWeight: '600' },

  metricLabelMonth: { fontSize: 10, fontWeight: '800', color: '#047857', letterSpacing: 0.5 },
  metricBadgeMonth: { fontSize: 10, fontWeight: '700', color: '#047857', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricValueMonth: { fontSize: 22, fontWeight: '800', color: '#047857', marginTop: 8 },
  metricCardSplit: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6 },
  metricSplitPaidDark: { fontSize: 10, color: '#047857', fontWeight: '700' },
  metricSplitDueDark: { fontSize: 10, color: '#e11d48', fontWeight: '700' },

  metricLabelWeek: { fontSize: 10, fontWeight: '800', color: '#0f766e', letterSpacing: 0.5 },
  metricBadgeWeek: { fontSize: 10, fontWeight: '700', color: '#0f766e', backgroundColor: '#f0fdfa', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricValueWeek: { fontSize: 22, fontWeight: '800', color: '#0f766e', marginTop: 8 },

  metricLabelToday: { fontSize: 10, fontWeight: '800', color: '#c2410c', letterSpacing: 0.5 },
  metricBadgeToday: { fontSize: 10, fontWeight: '700', color: '#c2410c', backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricValueToday: { fontSize: 22, fontWeight: '800', color: '#c2410c', marginTop: 8 },

  // Search
  searchBox: { marginTop: 4 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },

  // Chips
  filterChipsRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActiveDue: { backgroundColor: '#e11d48', borderColor: '#e11d48' },
  filterChipActive: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
  filterChipActivePaid: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#ffffff' },

  // Section Header
  sectionHeaderRow: { marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },

  // Invoice Card
  invoiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    gap: 8,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  invoiceCode: { fontSize: 11, fontWeight: '800', color: '#0f766e', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  invoiceDate: { fontSize: 11, color: '#94a3b8' },
  patientName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  patientPhone: { fontSize: 12, color: '#64748b', marginTop: 1 },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  amountValue: { fontSize: 16, fontWeight: '800' },
  amountValuePaid: { color: '#047857' },
  amountValueDue: { color: '#e11d48' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 },
  statusPaid: { backgroundColor: '#ecfdf5' },
  statusPending: { backgroundColor: '#fff7ed' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  statusBadgeTextPaid: { color: '#047857' },
  statusBadgeTextPending: { color: '#c2410c' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tagItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  tagConsult: { backgroundColor: '#eff6ff' },
  tagConsultText: { fontSize: 10, fontWeight: '600', color: '#1d4ed8' },
  tagTest: { backgroundColor: '#faf5ff' },
  tagTestText: { fontSize: 10, fontWeight: '600', color: '#7e22ce' },
  tagMed: { backgroundColor: '#fffbeb' },
  tagMedText: { fontSize: 10, fontWeight: '600', color: '#b45309' },

  payActionBtn: {
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  payActionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },

  emptyContainer: { padding: 30, alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', marginTop: 10 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 8 },
  emptyText: { fontSize: 12, color: '#64748b', marginTop: 4, textAlign: 'center' },
});
