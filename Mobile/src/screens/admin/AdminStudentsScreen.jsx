import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import apiClient from '../../config/api';

export default function AdminStudentsScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/users');
      const data = res.data?.users || res.data || [];
      const studentList = Array.isArray(data) ? data.filter((u) => u.role === 'student' || u.category === 'student') : [];
      setStudents(studentList);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Students Roster</Text>
        <Text style={styles.subtitle}>Enrolled coaching & course students</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1b4332" />
          <Text style={styles.loadingText}>Fetching Roster...</Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Students Found</Text>
          <Text style={styles.emptyText}>Student registrations will appear here.</Text>
        </View>
      ) : (
        students.map((s) => (
          <View key={s._id || s.id} style={styles.card}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.detail}>Email: {s.email}</Text>
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
