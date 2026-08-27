import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../../config/api';

export default function AdminCoachingCentersScreen() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/coaching-centers');
      const data = res.data?.centers || res.data || [];
      setCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching coaching centers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coaching Centers</Text>
        <Text style={styles.subtitle}>Affiliated education & training hubs</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1b4332" />
          <Text style={styles.loadingText}>Loading Centers...</Text>
        </View>
      ) : centers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Coaching Centers Found</Text>
          <Text style={styles.emptyText}>Coaching institutes will appear here.</Text>
        </View>
      ) : (
        centers.map((c) => (
          <View key={c._id || c.id} style={styles.card}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.detail}>Location: {c.location || 'N/A'}</Text>
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
