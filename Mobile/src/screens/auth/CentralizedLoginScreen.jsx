import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import apiClient from '../../config/api';
import storage from '../../utils/storage';

export default function CentralizedLoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    let authSuccess = false;

    // 1. First attempt Admin endpoint (/api/auth/login)
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const user = response.data?.user;

      if (user && user.category === 'admin') {
        await storage.setItem('userId', user.id);
        await storage.setItem('userName', user.name);
        await storage.setItem('userEmail', user.email);
        await storage.setItem('userCategory', 'admin');
        await storage.setItem('userRoleName', 'Admin');
        await storage.setItem('userPermissions', JSON.stringify(['*']));

        authSuccess = true;
        if (onLoginSuccess) {
          onLoginSuccess(user, 'ADMIN');
        }
        return;
      }
    } catch (adminErr) {
      // Admin auth failed or not admin, fallback to OPD auth endpoint
    }

    // 2. Second attempt OPD endpoint (/api/opd/auth/login)
    if (!authSuccess) {
      try {
        const response = await apiClient.post('/api/opd/auth/login', { email, password });
        const user = response.data?.user;

        if (user) {
          await storage.setItem('userId', user.id);
          await storage.setItem('userName', user.name);
          await storage.setItem('userEmail', user.email);
          await storage.setItem('userCategory', user.category || 'opd');
          await storage.setItem('userRoleName', user.roleName || 'OPD Staff');
          await storage.setItem('userPermissions', JSON.stringify(user.permissions || ['*']));

          authSuccess = true;
          if (onLoginSuccess) {
            onLoginSuccess(user, 'OPD');
          }
          return;
        }
      } catch (opdErr) {
        console.error('OPD Auth error:', opdErr);
      }
    }

    // 3. If both attempts failed
    setError('Invalid email or password. Please check your credentials.');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerBox}>
              <Image
                source={require('../../../assets/heka_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>Heka Health Portal</Text>
              </View>
              <Text style={styles.brandTitle}>Welcome Back</Text>
              <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@heka.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Single Primary Sign In Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 60,
    backgroundColor: '#f1f5f9',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 140,
    height: 48,
    marginBottom: 10,
  },
  logoBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  logoBadgeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#1b4332',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
