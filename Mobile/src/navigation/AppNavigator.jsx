import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Platform,
  Image,
} from 'react-native';
import storage from '../utils/storage';
import apiClient from '../config/api';

import CentralizedLoginScreen from '../screens/auth/CentralizedLoginScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminStudentsScreen from '../screens/admin/AdminStudentsScreen';
import AdminCoachingCentersScreen from '../screens/admin/AdminCoachingCentersScreen';
import AdminCoursesScreen from '../screens/admin/AdminCoursesScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';

import OpdDashboardScreen from '../screens/opd/OpdDashboardScreen';
import OpdPatientsScreen from '../screens/opd/OpdPatientsScreen';
import OpdAppointmentsScreen from '../screens/opd/OpdAppointmentsScreen';
import OpdConsultationsScreen from '../screens/opd/OpdConsultationsScreen';
import OpdBillingScreen from '../screens/opd/OpdBillingScreen';
import OpdDiagnosticTestsScreen from '../screens/opd/OpdDiagnosticTestsScreen';
import OpdMedicinesScreen from '../screens/opd/OpdMedicinesScreen';
import OpdRolesScreen from '../screens/opd/OpdRolesScreen';
import OpdRemindersScreen from '../screens/opd/OpdRemindersScreen';
import { OpdSocketProvider } from '../context/OpdSocketContext';
import { useOpdSocketEvent } from '../context/useOpdSocket';

function RealtimeSocketSubscriber({ onNewReminder, onEventTriggered }) {
  useOpdSocketEvent('opd:reminder', (payload) => {
    if (payload?.type === 'created' && payload?.reminder) {
      onNewReminder(payload.reminder);
    }
  });

  useOpdSocketEvent('opd:appointment', () => onEventTriggered());
  useOpdSocketEvent('opd:consultation', () => onEventTriggered());
  useOpdSocketEvent('opd:testorder', () => onEventTriggered());
  useOpdSocketEvent('opd:bill', () => onEventTriggered());

  return null;
}

export default function AppNavigator() {
  const [activePortal, setActivePortal] = useState('ADMIN'); // 'ADMIN' | 'OPD'
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [opdSubTab, setOpdSubTab] = useState('dashboard');
  const [opdRouteParams, setOpdRouteParams] = useState(null); // cross-screen params

  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(['*']);
  const [userRoleName, setUserRoleName] = useState('Staff');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    checkAuthSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, refreshCounter]);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/opd/reminders');
      const data = res.data?.reminders || res.data || [];
      if (Array.isArray(data)) {
        setNotifications(data.slice(0, 15));
      }
    } catch (e) {}
  };

  const checkAuthSession = async () => {
    const userCat = await storage.getItem('userCategory');
    const userName = await storage.getItem('userName');
    const userId = await storage.getItem('userId');
    const roleName = await storage.getItem('userRoleName');
    const permStr = await storage.getItem('userPermissions');

    if (userId && userName) {
      setCurrentUser({ id: userId, name: userName, category: userCat });
      setUserRoleName(roleName || (userCat === 'admin' ? 'Super Admin' : 'OPD Staff'));
      try {
        setUserPermissions(permStr ? JSON.parse(permStr) : ['*']);
      } catch (e) {
        setUserPermissions(['*']);
      }

      if (userCat === 'admin') {
        setActivePortal('ADMIN');
      } else {
        setActivePortal('OPD');
      }
    }
  };

  const handleLoginSuccess = (user, portalType) => {
    setCurrentUser(user);
    checkAuthSession();
    if (portalType) {
      setActivePortal(portalType);
    } else if (user.category === 'admin') {
      setActivePortal('ADMIN');
    } else {
      setActivePortal('OPD');
    }
  };

  const handleLogout = async () => {
    setIsSidebarOpen(false);
    setIsNotificationOpen(false);
    await storage.clear();
    setCurrentUser(null);
  };

  const handleHeaderRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
    fetchNotifications();
  };

  const hasPermission = (perm) => {
    if (!perm) return true;
    return userPermissions.includes('*') || userPermissions.includes(perm);
  };

  // If no user is logged in, show Centralized Login Screen
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
        <CentralizedLoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  // Render Admin Screen Content
  const renderAdminContent = () => {
    switch (adminSubTab) {
      case 'dashboard':
        return <AdminDashboardScreen onNavigate={(tab) => setAdminSubTab(tab)} />;
      case 'users':
        return <AdminUsersScreen />;
      case 'students':
        return <AdminStudentsScreen />;
      case 'coaching':
        return <AdminCoachingCentersScreen />;
      case 'courses':
        return <AdminCoursesScreen />;
      case 'payments':
        return <AdminPaymentsScreen />;
      default:
        return <AdminDashboardScreen onNavigate={(tab) => setAdminSubTab(tab)} />;
    }
  };

  // Cross-screen navigation handler — carries params to destination tab
  const handleOpdNavigate = (tab, params) => {
    setOpdRouteParams(params || null);
    setOpdSubTab(tab);
  };

  // Render OPD Screen Content
  const renderOpdContent = () => {
    switch (opdSubTab) {
      case 'dashboard':
        return <OpdDashboardScreen onNavigate={handleOpdNavigate} />;
      case 'patients':
        return <OpdPatientsScreen onNavigate={handleOpdNavigate} routeParams={opdRouteParams} />;
      case 'appointments':
        return <OpdAppointmentsScreen onNavigate={handleOpdNavigate} routeParams={opdRouteParams} />;
      case 'consultations':
        return <OpdConsultationsScreen onNavigate={handleOpdNavigate} routeParams={opdRouteParams} />;
      case 'billing':
        return <OpdBillingScreen onNavigate={handleOpdNavigate} routeParams={opdRouteParams} />;
      case 'tests':
        return <OpdDiagnosticTestsScreen onNavigate={handleOpdNavigate} />;
      case 'medicines':
        return <OpdMedicinesScreen onNavigate={handleOpdNavigate} />;
      case 'roles':
        return <OpdRolesScreen onNavigate={handleOpdNavigate} />;
      case 'reminders':
        return <OpdRemindersScreen onNavigate={handleOpdNavigate} />;
      default:
        return <OpdDashboardScreen onNavigate={handleOpdNavigate} />;
    }
  };

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', permission: null },
    { id: 'users', label: 'Users Management', icon: '👥', permission: null },
    { id: 'students', label: 'Students Roster', icon: '🎓', permission: null },
    { id: 'coaching', label: 'Coaching Centers', icon: '🏫', permission: null },
    { id: 'courses', label: 'Courses Catalog', icon: '📚', permission: null },
    { id: 'payments', label: 'Payment Gateway Logs', icon: '💳', permission: null },
  ];

  const opdTabs = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: '🩺', permission: 'access_opd' },
    { id: 'patients', label: 'Patients Registry', icon: '🧑‍🤝‍🧑', permission: 'manage_patients' },
    { id: 'appointments', label: 'Appointments Queue', icon: '📅', permission: 'manage_appointments' },
    { id: 'consultations', label: 'Clinical Consults', icon: '💬', permission: 'manage_consultations' },
    { id: 'billing', label: 'Invoices & Billing', icon: '🧾', permission: 'manage_billing' },
    { id: 'tests', label: 'Diagnostics Catalog', icon: '🧪', permission: 'manage_tests' },
    { id: 'medicines', label: 'Pharmacy Inventory', icon: '💊', permission: 'manage_medicines' },
    { id: 'roles', label: 'Staff Roles & Roster', icon: '🛡️', permission: 'manage_roles' },
    { id: 'reminders', label: 'Patient Reminders', icon: '🔔', permission: 'access_opd' },
  ];

  const rawTabs = activePortal === 'ADMIN' ? adminTabs : opdTabs;
  // Filter navigation items by role permissions (matching Frontend OpdLayout)
  const currentTabs = rawTabs.filter((tab) => hasPermission(tab.permission));

  const currentSubTab = activePortal === 'ADMIN' ? adminSubTab : opdSubTab;
  const setCurrentSubTab = activePortal === 'ADMIN' ? setAdminSubTab : setOpdSubTab;

  return (
    <OpdSocketProvider userId={currentUser?.id}>
      <RealtimeSocketSubscriber
        onNewReminder={(newReminder) => {
          setNotifications((prev) => [newReminder, ...prev].slice(0, 15));
        }}
        onEventTriggered={() => {
          setRefreshCounter((prev) => prev + 1);
        }}
      />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={activePortal === 'ADMIN' ? '#1b4332' : '#0f766e'} />

      {/* Top Bar Header */}
      <View style={[styles.topHeader, activePortal === 'ADMIN' ? styles.adminBg : styles.opdBg]}>
        <View style={styles.topHeaderRow}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.menuIconBtn}
            onPress={() => setIsSidebarOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>

          {/* Title Banner */}
          <View style={styles.headerTitleBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/heka_icon.png')}
                style={{ width: 22, height: 22, borderRadius: 5, marginRight: 6 }}
              />
              <Text style={styles.headerTitle}>
                {activePortal === 'ADMIN' ? 'HEKA ADMIN' : 'HEKA OPD'}
              </Text>
            </View>
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {currentUser.name} • {userRoleName}
            </Text>
          </View>

          {/* Notification Bell Button */}
          <TouchableOpacity
            style={styles.headerNotificationBtn}
            onPress={() => setIsNotificationOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerNotificationIcon}>🔔</Text>
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={handleHeaderRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.headerRefreshText}>🔄</Text>
          </TouchableOpacity>

          {/* Portal Switcher Pill (Admin Only) */}
          {currentUser?.category === 'admin' && (
            <View style={styles.portalToggleContainer}>
              <TouchableOpacity
                style={[styles.portalBtn, activePortal === 'ADMIN' && styles.portalBtnActive]}
                onPress={() => setActivePortal('ADMIN')}
                activeOpacity={0.8}
              >
                <Text style={[styles.portalBtnText, activePortal === 'ADMIN' && styles.portalBtnTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.portalBtn, activePortal === 'OPD' && styles.portalBtnActive]}
                onPress={() => setActivePortal('OPD')}
                activeOpacity={0.8}
              >
                <Text style={[styles.portalBtnText, activePortal === 'OPD' && styles.portalBtnTextActive]}>
                  OPD
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Screen Body with Refresh Key */}
      <View style={styles.body} key={`${activePortal}-${currentSubTab}-${refreshCounter}`}>
        {activePortal === 'ADMIN' ? renderAdminContent() : renderOpdContent()}
      </View>

      {/* Role-based Sidebar Drawer Navigation Modal (Left Slide-Out) */}
      <Modal visible={isSidebarOpen} animationType="fade" transparent>
        <View style={styles.drawerOverlay}>
          {/* Sidebar Drawer Container (Positioned on the LEFT side) */}
          <View style={[styles.sidebarDrawer, activePortal === 'ADMIN' ? styles.sidebarAdminBg : styles.sidebarOpdBg]}>
            {/* Sidebar Brand Header */}
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../assets/heka_icon.png')}
                style={{ width: 34, height: 34, borderRadius: 8, marginRight: 10 }}
              />
              <Text style={styles.sidebarBrandTitle}>
                {activePortal === 'ADMIN' ? 'HEKA ADMIN' : 'HEKA OPD'}
              </Text>

              <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setIsSidebarOpen(false)}>
                <Text style={styles.closeDrawerText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Portal Switcher Banner */}
            {currentUser?.category === 'admin' ? (
              <View style={styles.sidebarPortalToggle}>
                <TouchableOpacity
                  style={[styles.sidebarPortalBtn, activePortal === 'ADMIN' && styles.sidebarPortalBtnActive]}
                  onPress={() => setActivePortal('ADMIN')}
                >
                  <Text
                    style={[
                      styles.sidebarPortalText,
                      activePortal === 'ADMIN' && styles.sidebarPortalTextActive,
                    ]}
                  >
                    Coaching
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sidebarPortalBtn, activePortal === 'OPD' && styles.sidebarPortalBtnActive]}
                  onPress={() => setActivePortal('OPD')}
                >
                  <Text
                    style={[
                      styles.sidebarPortalText,
                      activePortal === 'OPD' && styles.sidebarPortalTextActive,
                    ]}
                  >
                    OPD Portal
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Role-Filtered Modules List */}
            <ScrollView contentContainerStyle={styles.sidebarNavList} keyboardShouldPersistTaps="handled">
              <Text style={styles.sidebarSectionHeader}>
                {activePortal === 'ADMIN' ? 'ADMIN MODULES' : 'OPD MODULES'}
              </Text>

              {currentTabs.map((item) => {
                const isActive = currentSubTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sidebarNavItem, isActive && styles.sidebarNavItemActive]}
                    onPress={() => {
                      setCurrentSubTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sidebarNavIcon}>{item.icon}</Text>
                    <Text style={[styles.sidebarNavLabel, isActive && styles.sidebarNavLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive ? <View style={styles.sidebarActiveDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sidebar User Role Footer */}
            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarUserName}>{currentUser.name}</Text>
                <View style={styles.roleBadgeBox}>
                  <Text style={styles.sidebarUserRole}>{userRoleName.toUpperCase()}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={handleLogout}>
                <Text style={styles.sidebarLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Backdrop (Tapping right side closes the drawer) */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setIsSidebarOpen(false)}
          />
        </View>
      </Modal>

      {/* Collapsible Notification Panel Modal Overlay */}
      <Modal
        visible={isNotificationOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsNotificationOpen(false)}
      >
        <TouchableOpacity
          style={styles.notificationBackdrop}
          activeOpacity={1}
          onPress={() => setIsNotificationOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.notificationPanelCard}>
            <View style={styles.notificationPanelHeader}>
              <Text style={styles.notificationPanelTitle}>🔔 Notifications & Reminders</Text>
              <TouchableOpacity
                onPress={() => setIsNotificationOpen(false)}
                style={styles.notificationCloseBtn}
              >
                <Text style={styles.notificationCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationList} nestedScrollEnabled>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotificationsBox}>
                  <Text style={styles.emptyNotificationsText}>No active notifications or reminders</Text>
                </View>
              ) : (
                notifications.map((item, idx) => (
                  <View key={item._id || idx} style={styles.notificationItem}>
                    <Text style={styles.notificationItemTitle}>
                      {item.patientId?.name || item.title || 'Follow-up Reminder'}
                    </Text>
                    <Text style={styles.notificationItemMsg}>
                      {item.message || item.note || 'Scheduled appointment checkup'}
                    </Text>
                    <Text style={styles.notificationItemTime}>
                      {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'Active'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.viewAllRemindersBtn}
              onPress={() => {
                setIsNotificationOpen(false);
                if (activePortal === 'OPD') setOpdSubTab('reminders');
              }}
            >
              <Text style={styles.viewAllRemindersText}>View All Reminders Feed →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      </SafeAreaView>
    </OpdSocketProvider>
  );
}

const styles = StyleSheet.create({
  authSafeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  adminBg: {
    backgroundColor: '#1b4332',
  },
  opdBg: {
    backgroundColor: '#0f766e',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  menuIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuIconText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '800',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  userSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
  },
  headerRefreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRefreshText: {
    fontSize: 15,
    color: '#ffffff',
  },
  portalToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 3,
  },
  portalBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  portalBtnActive: {
    backgroundColor: '#ffffff',
  },
  portalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  portalBtnTextActive: {
    color: '#0f172a',
  },
  body: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarDrawer: {
    width: 285,
    height: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 50,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sidebarAdminBg: {
    backgroundColor: '#1b4332',
  },
  sidebarOpdBg: {
    backgroundColor: '#0f766e',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  sidebarBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    letterSpacing: -0.5,
  },
  closeDrawerBtn: {
    padding: 6,
  },
  closeDrawerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sidebarPortalToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  sidebarPortalBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  sidebarPortalBtnActive: {
    backgroundColor: '#ffffff',
  },
  sidebarPortalText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sidebarPortalTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  sidebarNavList: {
    gap: 6,
  },
  sidebarSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  sidebarNavItemActive: {
    backgroundColor: '#ffffff',
  },
  sidebarNavIcon: {
    fontSize: 16,
  },
  sidebarNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
  sidebarNavLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  sidebarActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D9488',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  sidebarUserInfo: {
    alignItems: 'center',
  },
  sidebarUserName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  roleBadgeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  sidebarUserRole: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sidebarLogoutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sidebarLogoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerNotificationBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  headerNotificationIcon: {
    fontSize: 15,
    color: '#ffffff',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0f766e',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  notificationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 60 : 70,
    paddingHorizontal: 16,
  },
  notificationPanelCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  notificationPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  notificationCloseBtn: {
    padding: 4,
  },
  notificationCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  notificationList: {
    maxHeight: 260,
    marginVertical: 8,
  },
  emptyNotificationsBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyNotificationsText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  notificationItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  notificationItemMsg: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  notificationItemTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  viewAllRemindersBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    marginTop: 6,
  },
  viewAllRemindersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d9488',
  },
});
