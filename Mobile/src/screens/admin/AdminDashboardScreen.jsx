import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function AdminDashboardScreen({ onNavigate }) {
  const stats = [
    { title: 'Total Users', value: '1,234', change: '+12%', color: '#2563eb', bg: '#eff6ff', icon: '👥' },
    { title: 'Total Hospitals', value: '56', change: '+3%', color: '#16a34a', bg: '#f0fdf4', icon: '🏥' },
    { title: 'Active Services', value: '12', change: '0%', color: '#9333ea', bg: '#faf5ff', icon: '⚡' },
    { title: 'Pending Requests', value: '23', change: '-5%', color: '#ca8a04', bg: '#fefce8', icon: '⏳' },
  ];

  const quickActions = [
    { id: 'users', label: 'Manage Users', icon: '👤', bg: '#eff6ff' },
    { id: 'students', label: 'Manage Students', icon: '🎓', bg: '#f0fdf4' },
    { id: 'courses', label: 'Courses Roster', icon: '📚', bg: '#faf5ff' },
    { id: 'payments', label: 'Payment Logs', icon: '💳', bg: '#fff7ed' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Overview</Text>
        <Text style={styles.subtitle}>Welcome back, here is your real-time portal overview.</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((item, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: item.bg }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>{item.icon}</Text>
              <Text style={[styles.changeBadge, { color: item.color }]}>{item.change}</Text>
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statTitle}>{item.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Navigation Shortcuts */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionBtn, { backgroundColor: action.bg }]}
            onPress={() => onNavigate && onNavigate(action.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionHeader}>Recent Activity</Text>
      <View style={styles.activityBox}>
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>📝</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New course added to catalog</Text>
            <Text style={styles.activityTime}>Admin • 2 hours ago</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>👤</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New student registered</Text>
            <Text style={styles.activityTime}>System • 4 hours ago</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>💳</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>Payment received for Medical Coaching</Text>
            <Text style={styles.activityTime}>Gateway • 6 hours ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
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
    borderColor: '#e2e8f0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  changeBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  statTitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
