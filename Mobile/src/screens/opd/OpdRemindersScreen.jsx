import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import apiClient from '../../config/api';
import { useOpdSocketEvent } from '../../context/useOpdSocket';

export default function OpdRemindersScreen({ onNavigate }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'LATER'
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL'); // 'ALL' | 'Scheduled' | 'Sent' | 'Completed'

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to realtime socket events
  useOpdSocketEvent('opd:reminder', () => {
    fetchData(true);
  });

  useOpdSocketEvent('opd:consultation', () => {
    fetchData(true);
  });

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const rRes = await apiClient.get('/api/opd/reminders').catch(() => ({ data: [] }));
      const rData = rRes.data?.reminders || rRes.data || [];
      setReminders(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error('Error fetching reminders data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleSyncConsults = async () => {
    setScanning(true);
    setScanResult('');
    try {
      const res = await apiClient.post('/api/opd/reminders/scan', {});
      const count = res.data?.remindersSent ?? res.data?.count ?? 0;
      setScanResult(`Sync complete! ${count} follow-up advisory notification(s) synced from clinical consults.`);
      fetchData(true);
    } catch (err) {
      setScanResult('Sync engine error. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleCallPatient = (phone, name) => {
    if (!phone) {
      Alert.alert('No Phone Number', `No registered phone number for ${name || 'patient'}.`);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call on this device.');
    });
  };

  const handleWhatsAppPatient = (phone, name, advisoryMsg, followUpDate) => {
    if (!phone) {
      Alert.alert('No Phone Number', `No registered phone number for ${name || 'patient'}.`);
      return;
    }
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

    const formattedDate = followUpDate ? new Date(followUpDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'your scheduled date';

    const text = `Hello ${name || 'Patient'}, this is a follow-up reminder from Heka OPD. Your follow-up consultation is advised for *${formattedDate}*. ${advisoryMsg ? `\n\nAdvisory: ${advisoryMsg}` : ''}\n\nPlease visit the clinic on time. Thank you!`;

    const encodedMsg = encodeURIComponent(text);
    Linking.openURL(`whatsapp://send?phone=${fullPhone}&text=${encodedMsg}`).catch(() => {
      Linking.openURL(`https://wa.me/${fullPhone}?text=${encodedMsg}`).catch(() => {
        Linking.openURL(`sms:${phone}?body=${encodedMsg}`).catch(() => {
          Alert.alert('Error', 'Unable to open WhatsApp or SMS app on this device.');
        });
      });
    });
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/opd/reminders/${id}/status`, { status });
      fetchData(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to remove this follow-up reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/reminders/${id}`);
              fetchData(true);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  // Date difference helper
  const getDiffDays = (dateStr) => {
    if (!dateStr) return 999;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 999;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetClean = new Date(target);
    targetClean.setHours(0, 0, 0, 0);

    const diffMs = targetClean.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // Filtered & Sorted (earliest/fewer date first)
  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        const pName = (r.patientId?.name || r.patientName || '').toLowerCase();
        const pPhone = (r.patientId?.phone || '').toLowerCase();
        const msg = (r.message || r.note || '').toLowerCase();
        const q = searchQuery.toLowerCase().trim();

        const matchesSearch = !q || pName.includes(q) || pPhone.includes(q) || msg.includes(q);

        const matchesStatus =
          activeStatusFilter === 'ALL' ||
          (r.status || 'Scheduled').toLowerCase() === activeStatusFilter.toLowerCase();

        // Date-wise filtering
        const dueDate = r.followUpDate || r.scheduledDate || r.createdAt;
        const diff = getDiffDays(dueDate);

        let matchesDate = true;
        if (activeDateFilter === 'OVERDUE') {
          matchesDate = diff < 0;
        } else if (activeDateFilter === 'TODAY') {
          matchesDate = diff === 0;
        } else if (activeDateFilter === 'TOMORROW') {
          matchesDate = diff === 1;
        } else if (activeDateFilter === 'WEEK') {
          matchesDate = diff >= 0 && diff <= 7;
        } else if (activeDateFilter === 'LATER') {
          matchesDate = diff > 7;
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        // Earliest / fewer date comes first (ascending order)
        const dateA = new Date(a.followUpDate || a.scheduledDate || a.createdAt || '9999-12-31').getTime();
        const dateB = new Date(b.followUpDate || b.scheduledDate || b.createdAt || '9999-12-31').getTime();
        return dateA - dateB;
      });
  }, [reminders, searchQuery, activeStatusFilter, activeDateFilter]);

  const stats = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let tomorrow = 0;
    let thisWeek = 0;

    reminders.forEach((r) => {
      const diff = getDiffDays(r.followUpDate || r.scheduledDate || r.createdAt);
      if (diff < 0) overdue++;
      if (diff === 0) today++;
      if (diff === 1) tomorrow++;
      if (diff >= 0 && diff <= 7) thisWeek++;
    });

    return {
      total: reminders.length,
      overdue,
      today,
      tomorrow,
      thisWeek,
    };
  }, [reminders]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDueBadgeInfo = (dateStr) => {
    const diffDays = getDiffDays(dateStr);

    if (diffDays === 999) return { label: 'Date N/A', bg: '#f1f5f9', text: '#475569' };
    if (diffDays < 0) {
      return { label: `⚠️ Overdue (${Math.abs(diffDays)}d ago)`, bg: '#fee2e2', text: '#b91c1c' };
    } else if (diffDays === 0) {
      return { label: '🔥 Due Today', bg: '#fef3c7', text: '#b45309' };
    } else if (diffDays === 1) {
      return { label: '⏰ Due Tomorrow', bg: '#e0f2fe', text: '#0369a1' };
    } else if (diffDays <= 7) {
      return { label: `📅 In ${diffDays} days`, bg: '#ecfdf5', text: '#047857' };
    } else {
      return { label: `📅 In ${diffDays} days`, bg: '#f8fafc', text: '#475569' };
    }
  };

  const dateFilterTabs = [
    { id: 'ALL', label: `All Dates (${stats.total})` },
    { id: 'TODAY', label: `Today (${stats.today})` },
    { id: 'TOMORROW', label: `Tomorrow (${stats.tomorrow})` },
    { id: 'WEEK', label: `Next 7 Days (${stats.thisWeek})` },
    { id: 'OVERDUE', label: `Overdue (${stats.overdue})` },
    { id: 'LATER', label: 'Later' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Patient Follow-up Advisories</Text>
              <Text style={styles.subtitle}>Earliest due dates first • Instant Call & WhatsApp dispatch</Text>
            </View>
            <TouchableOpacity
              style={[styles.syncBtn, scanning && styles.btnDisabled]}
              onPress={handleSyncConsults}
              disabled={scanning}
              activeOpacity={0.8}
            >
              <Text style={styles.syncBtnText}>{scanning ? '⏳ Syncing...' : '🔄 Sync Consults'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <TouchableOpacity
              style={[styles.metricItem, activeDateFilter === 'ALL' && styles.metricItemActive]}
              onPress={() => setActiveDateFilter('ALL')}
            >
              <Text style={styles.metricNumber}>{stats.total}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricItem, styles.borderLeft, activeDateFilter === 'TODAY' && styles.metricItemActive]}
              onPress={() => setActiveDateFilter('TODAY')}
            >
              <Text style={[styles.metricNumber, { color: '#b45309' }]}>{stats.today}</Text>
              <Text style={styles.metricLabel}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricItem, styles.borderLeft, activeDateFilter === 'TOMORROW' && styles.metricItemActive]}
              onPress={() => setActiveDateFilter('TOMORROW')}
            >
              <Text style={[styles.metricNumber, { color: '#0369a1' }]}>{stats.tomorrow}</Text>
              <Text style={styles.metricLabel}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricItem, styles.borderLeft, activeDateFilter === 'WEEK' && styles.metricItemActive]}
              onPress={() => setActiveDateFilter('WEEK')}
            >
              <Text style={[styles.metricNumber, { color: '#0D9488' }]}>{stats.thisWeek}</Text>
              <Text style={styles.metricLabel}>7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricItem, styles.borderLeft, activeDateFilter === 'OVERDUE' && styles.metricItemActive]}
              onPress={() => setActiveDateFilter('OVERDUE')}
            >
              <Text style={[styles.metricNumber, { color: '#b91c1c' }]}>{stats.overdue}</Text>
              <Text style={styles.metricLabel}>Overdue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Result Notice Banner */}
        {scanResult ? (
          <View style={styles.scanResultBox}>
            <Text style={styles.scanResultIcon}>🔔</Text>
            <Text style={styles.scanResultText}>{scanResult}</Text>
            <TouchableOpacity onPress={() => setScanResult('')}>
              <Text style={styles.scanResultClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Search Bar & Date-wise Filter Tabs */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by patient name, phone, or advisory notes..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date-wise Tabs (Earliest / fewer dates first) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {dateFilterTabs.map((tab) => {
              const isActive = activeDateFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  onPress={() => setActiveDateFilter(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Reminders Content Feed */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading earliest follow-up advisories...</Text>
          </View>
        ) : filteredReminders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🩺</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery || activeDateFilter !== 'ALL' ? 'No Matching Follow-ups' : 'No Follow-up Advisories Found'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || activeDateFilter !== 'ALL'
                ? 'Try switching date filters (e.g. All Dates) or clearing your search.'
                : 'Follow-up advisories are generated automatically when a doctor sets a "Follow-up Advisory Date" during a Clinical Consultation.'}
            </Text>
            {onNavigate ? (
              <View style={styles.emptyActionRow}>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => onNavigate('consultations')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>💬 Go to Clinical Consults</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : (
          filteredReminders.map((r, idx) => {
            const patientObj = r.patientId || {};
            const patientName = patientObj.name || r.patientName || 'Unknown Patient';
            const patientPhone = patientObj.phone || '';
            const dueDate = r.followUpDate || r.scheduledDate || r.createdAt;
            const dueBadge = getDueBadgeInfo(dueDate);
            const status = r.status || 'Scheduled';

            return (
              <View key={r._id || r.id || `reminder-card-${idx}`} style={styles.card}>
                {/* Top Row: Patient Info + Due Badge */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.patientNameRow}>
                      <Text style={styles.patientName}>👤 {patientName}</Text>
                      {patientPhone ? <Text style={styles.patientPhone}>{patientPhone}</Text> : null}
                    </View>
                    <Text style={styles.patientDetails}>
                      {patientObj.gender ? `${patientObj.gender}, ` : ''}
                      {patientObj.age ? `${patientObj.age} yrs` : ''}
                      {patientObj.uhid ? ` • UHID: ${patientObj.uhid}` : ''}
                    </Text>
                  </View>

                  <View style={styles.badgeCol}>
                    <View style={[styles.dueBadge, { backgroundColor: dueBadge.bg }]}>
                      <Text style={[styles.dueBadgeText, { color: dueBadge.text }]}>{dueBadge.label}</Text>
                    </View>
                    <Text style={styles.dueDateSubText}>📅 {formatDateDisplay(dueDate)}</Text>
                  </View>
                </View>

                {/* Advisory Message Body */}
                <View style={styles.msgBox}>
                  <Text style={styles.msgText}>📝 {r.message || r.note || 'No specific advisory notes'}</Text>
                </View>

                {/* Call & WhatsApp Action Buttons Bar */}
                <View style={styles.contactBar}>
                  <TouchableOpacity
                    style={[styles.callBtn, !patientPhone && styles.btnDisabled]}
                    onPress={() => handleCallPatient(patientPhone, patientName)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.callBtnText}>📞 Call Patient</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.whatsappBtn, !patientPhone && styles.btnDisabled]}
                    onPress={() => handleWhatsAppPatient(patientPhone, patientName, r.message, dueDate)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.whatsappBtnText}>💬 WhatsApp Advisory</Text>
                  </TouchableOpacity>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerStatusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        status === 'Completed'
                          ? styles.statusCompleted
                          : status === 'Sent'
                          ? styles.statusSent
                          : styles.statusScheduled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          status === 'Completed'
                            ? styles.statusTextCompleted
                            : status === 'Sent'
                            ? styles.statusTextSent
                            : styles.statusTextScheduled,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                    {r.sentAt ? (
                      <Text style={styles.sentAtText}>Logged: {new Date(r.sentAt).toLocaleDateString()}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardActionBtns}>
                    {status !== 'Completed' ? (
                      <TouchableOpacity
                        style={styles.doneActionBtn}
                        onPress={() => handleUpdateStatus(r._id, 'Completed')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.doneActionText}>✓ Mark Done</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.reopenActionBtn}
                        onPress={() => handleUpdateStatus(r._id, 'Scheduled')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reopenActionText}>↺ Reopen</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDeleteReminder(r._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteActionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12, paddingBottom: 60 },
  headerCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  syncBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  syncBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricItem: { flex: 1, alignItems: 'center', paddingVertical: 2, borderRadius: 8 },
  metricItemActive: { backgroundColor: '#e2e8f0' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#e2e8f0' },
  metricNumber: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  metricLabel: { fontSize: 10, fontWeight: '600', color: '#64748b', marginTop: 1 },
  scanResultBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanResultIcon: { fontSize: 16 },
  scanResultText: { color: '#047857', fontWeight: '700', fontSize: 13, flex: 1 },
  scanResultClose: { fontSize: 14, color: '#047857', fontWeight: '700', padding: 4 },
  filterSection: { gap: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', padding: 0 },
  clearSearchText: { fontSize: 14, color: '#94a3b8', fontWeight: '700', paddingHorizontal: 4 },
  tabsContainer: { flexDirection: 'row', gap: 6 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  tabChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tabChipTextActive: { color: '#ffffff', fontWeight: '700' },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14, fontWeight: '600' },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  emptyText: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
  emptyActionRow: { marginTop: 8 },
  emptyBtn: { backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  patientName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  patientPhone: { fontSize: 12, color: '#0f766e', fontWeight: '700', backgroundColor: '#f0fdfa', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  patientDetails: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  badgeCol: { alignItems: 'flex-end', gap: 2 },
  dueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dueBadgeText: { fontSize: 10, fontWeight: '800' },
  dueDateSubText: { fontSize: 11, color: '#475569', fontWeight: '700', marginTop: 2 },
  msgBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  msgText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  contactBar: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  whatsappBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  whatsappBtnText: { color: '#047857', fontWeight: '700', fontSize: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  footerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusScheduled: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  statusSent: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  statusCompleted: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextScheduled: { color: '#0f766e' },
  statusTextSent: { color: '#2563eb' },
  statusTextCompleted: { color: '#475569' },
  sentAtText: { fontSize: 10, color: '#94a3b8' },
  cardActionBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneActionBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneActionText: { color: '#047857', fontWeight: '700', fontSize: 11 },
  reopenActionBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reopenActionText: { color: '#475569', fontWeight: '700', fontSize: 11 },
  deleteActionBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteActionText: { fontSize: 12 },
  btnDisabled: { opacity: 0.5 },
});
