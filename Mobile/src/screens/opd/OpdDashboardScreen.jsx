import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../../config/api';
import storage from '../../utils/storage';

export default function OpdDashboardScreen({ onNavigate }) {
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    consultations: 0,
    billingPending: 0,
    billingPaid: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    const permStr = await storage.getItem('userPermissions');
    try {
      setPermissions(permStr ? JSON.parse(permStr) : ['*']);
    } catch (e) {
      setPermissions(['*']);
    }
  };

  const hasPermission = (perm) => permissions.includes('*') || permissions.includes(perm);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Attempt single fast aggregation endpoint
      try {
        const res = await apiClient.get('/api/opd/dashboard/stats');
        if (res.data?.stats) {
          setStats(res.data.stats);
          setAppointments(Array.isArray(res.data.recentAppointments) ? res.data.recentAppointments : []);
          return;
        }
      } catch (err) {
        // Fallback to parallel requests if endpoint not available
      }

      const role = await storage.getItem('userRoleName');
      const name = await storage.getItem('userName');
      const id = await storage.getItem('userId');

      // Parallel fetch using Promise.all
      const [pRes, aRes, cRes, bRes] = await Promise.all([
        apiClient.get('/api/opd/patients').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/appointments').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/consultations').catch(() => ({ data: [] })),
        apiClient.get('/api/opd/billing').catch(() => ({ data: [] })),
      ]);

      const pData = pRes.data?.patients || pRes.data || [];
      const patientsCount = Array.isArray(pData) ? pData.length : 0;

      const aData = aRes.data?.appointments || aRes.data || [];
      let list = Array.isArray(aData) ? aData : [];
      if (role && role.toLowerCase() === 'doctor') {
        list = list.filter(
          (a) =>
            a.doctorId === id ||
            (a.doctorName && a.doctorName.toLowerCase() === name?.toLowerCase())
        );
      }
      setAppointments(list.slice(0, 5));

      const cData = cRes.data?.consultations || cRes.data || [];
      let cList = Array.isArray(cData) ? cData : [];
      if (role && role.toLowerCase() === 'doctor') {
        cList = cList.filter(
          (c) =>
            c.doctorId === id ||
            (c.doctorName && c.doctorName.toLowerCase() === name?.toLowerCase())
        );
      }

      let pending = 0;
      let paid = 0;
      const bData = bRes.data?.invoices || bRes.data?.bills || bRes.data || [];
      if (Array.isArray(bData)) {
        pending = bData.filter((b) => b.status === 'Pending' || b.status === 'UNPAID').length;
        paid = bData.filter((b) => b.status === 'Paid' || b.status === 'PAID').length;
      }

      setStats({
        patients: patientsCount,
        appointments: list.length,
        consultations: cList.length,
        billingPending: pending,
        billingPaid: paid,
      });
    } catch (err) {
      console.error('Error fetching OPD dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.patients,
      bg: '#f0fdf4',
      border: '#bbf7d0',
      color: '#15803d',
      icon: '🧑‍🤝‍🧑',
    },
    {
      title: 'Appointments Booked',
      value: stats.appointments,
      bg: '#f0fdfa',
      border: '#ccfbf1',
      color: '#0f766e',
      icon: '📅',
    },
    {
      title: 'Consultations Done',
      value: stats.consultations,
      bg: '#ecfeff',
      border: '#cffafe',
      color: '#0e7490',
      icon: '🩺',
    },
    {
      title: 'Bills (Paid / Pending)',
      value: `${stats.billingPaid} / ${stats.billingPending}`,
      bg: '#fffbebe6',
      border: '#fde68a',
      color: '#b45309',
      icon: '🧾',
    },
  ];

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading OPD Operations Console...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>OPD Operations Console</Text>
          <Text style={styles.subtitle}>Real-time clinical consultations, checkups & invoicing.</Text>
        </View>

        <View style={styles.headerActions}>
          {hasPermission('manage_patients') ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onNavigate && onNavigate('patients')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>+ Register Patient</Text>
            </TouchableOpacity>
          ) : null}

          {hasPermission('manage_appointments') ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => onNavigate && onNavigate('appointments')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats Cards Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: card.bg, borderColor: card.border }]}>
            <View style={styles.statTop}>
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={[styles.statTitle, { color: card.color }]}>{card.title}</Text>
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      {/* Active Consultations Feed */}
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Active Consultations Feed</Text>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('appointments')}>
            <Text style={styles.feedLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyFeedText}>No scheduled appointments found for today.</Text>
          </View>
        ) : (
          appointments.map((appt) => (
            <View key={appt._id || appt.id} style={styles.feedItem}>
              <View style={styles.feedItemMain}>
                <Text style={styles.patientName}>{appt.patientName || appt.patientId?.name || 'Patient'}</Text>
                <Text style={styles.doctorInfo}>
                  Doctor: <Text style={styles.doctorHighlight}>{appt.doctorName || 'Assigned'}</Text> • 📱{' '}
                  {appt.patientId?.phone || 'N/A'}
                </Text>
                <Text style={styles.apptTime}>
                  Date: {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString() : 'Today'}
                </Text>
              </View>

              <View style={styles.feedItemActions}>
                <View
                  style={[
                    styles.statusBadge,
                    appt.status === 'Completed'
                      ? styles.statusGreen
                      : appt.status === 'Cancelled'
                      ? styles.statusRed
                      : styles.statusOrange,
                  ]}
                >
                  <Text style={styles.statusText}>{appt.status || 'Scheduled'}</Text>
                </View>

                {appt.status === 'Scheduled' && hasPermission('manage_consultations') ? (
                  <TouchableOpacity
                    style={styles.consultBtn}
                    onPress={() => onNavigate && onNavigate('consultations')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.consultBtnText}>Consult</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>

      {/* OPD Workflow Summary Guide */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>OPD Clinical Workflow Summary</Text>

        <View style={styles.guideStep}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Registration:</Text> Register patient profiles in Patients Registry.
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Booking:</Text> Book doctor appointments and assign consultation fees.
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Consultation:</Text> Doctor enters diagnoses and prescribes medicines.
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>4</Text>
          </View>
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Billing:</Text> Generate combined invoices for appointments and tests.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#f8fafc',
  },
  centerBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#ccfbf1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  secondaryBtnText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    gap: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  feedLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  emptyFeed: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  emptyFeedText: {
    fontSize: 13,
    color: '#64748b',
  },
  feedItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  feedItemMain: {
    gap: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  doctorInfo: {
    fontSize: 13,
    color: '#475569',
  },
  doctorHighlight: {
    fontWeight: '700',
    color: '#0f766e',
  },
  apptTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  feedItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusGreen: {
    backgroundColor: '#f0fdf4',
  },
  statusOrange: {
    backgroundColor: '#fff7ed',
  },
  statusRed: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  consultBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  consultBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
  },
  stepText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
});
