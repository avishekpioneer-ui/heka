import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../../config/api';

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/payment-settings');
      const data = res.data?.payments || res.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Logs & Settings</Text>
        <Text style={styles.subtitle}>Payment gateway history & configurations</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1b4332" />
          <Text style={styles.loadingText}>Loading Payments...</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Payment Transactions Logged</Text>
          <Text style={styles.emptyText}>Payment records will appear here.</Text>
        </View>
      ) : (
        payments.map((p) => (
          <View key={p._id || p.id} style={styles.card}>
            <Text style={styles.name}>{p.title || p.gatewayName || 'Payment Item'}</Text>
            <Text style={styles.detail}>Status: {p.status || 'Active'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  header: { marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#1b4332', fontSize: 14 },
  emptyBox: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  detail: { fontSize: 13, color: '#64748b' },
});
