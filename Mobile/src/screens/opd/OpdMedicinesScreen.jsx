import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import apiClient from '../../config/api';
import {
  printPharmacyReport,
  sharePharmacyPdf,
  sharePharmacyCsv,
} from '../../utils/pharmacyExport';

export default function OpdMedicinesScreen() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  // Restock Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  // Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState('FILTERED'); // 'FILTERED' | 'ALL' | 'ALERTS'

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ name: '', stock: '', price: '' });
  const [editFormData, setEditFormData] = useState({ name: '', stock: '', price: '' });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/opd/medicines');
      const data = res.data?.medicines || res.data || [];
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered medicines list
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const nameMatch = (med.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!nameMatch) return false;

      const stock = Number(med.stock) || 0;
      if (activeFilter === 'IN_STOCK') return stock >= 10;
      if (activeFilter === 'LOW_STOCK') return stock > 0 && stock < 10;
      if (activeFilter === 'OUT_OF_STOCK') return stock === 0;
      return true;
    });
  }, [medicines, searchQuery, activeFilter]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalUnits = 0;
    let totalValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    medicines.forEach((med) => {
      const stock = Number(med.stock) || 0;
      const price = Number(med.price) || 0;
      totalUnits += stock;
      totalValue += stock * price;

      if (stock === 0) outOfStock++;
      else if (stock < 10) lowStock++;
      else inStock++;
    });

    return {
      totalItems: medicines.length,
      totalUnits,
      totalValue,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [medicines]);

  // Medicines dataset to export based on selected export scope
  const targetExportList = useMemo(() => {
    if (exportScope === 'ALL') {
      return medicines;
    }
    if (exportScope === 'ALERTS') {
      return medicines.filter((med) => (Number(med.stock) || 0) < 10);
    }
    return filteredMedicines;
  }, [exportScope, medicines, filteredMedicines]);

  const targetExportLabel = useMemo(() => {
    if (exportScope === 'ALL') return 'Entire Pharmacy Catalogue';
    if (exportScope === 'ALERTS') return 'Low & Out of Stock Alerts';
    if (searchQuery.trim()) return `Search: "${searchQuery}" (${activeFilter})`;
    return `Filter: ${activeFilter}`;
  }, [exportScope, searchQuery, activeFilter]);

  // Export handlers
  const handlePrintReport = async () => {
    try {
      setExporting(true);
      await printPharmacyReport(targetExportList, {
        title: 'Pharmacy Inventory & Stock Report',
        filterLabel: targetExportLabel,
      });
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setExporting(true);
      await sharePharmacyPdf(targetExportList, {
        title: 'Pharmacy Stock Report',
        filterLabel: targetExportLabel,
      });
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleShareCsv = async () => {
    try {
      setExporting(true);
      await sharePharmacyCsv(targetExportList, {
        title: 'Pharmacy Inventory (CSV)',
      });
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // Add Medicine
  const handleAddMedicine = async () => {
    if (!formData.name || !formData.stock || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/opd/medicines', {
        name: formData.name,
        stock: Number(formData.stock),
        price: Number(formData.price),
      });

      setSuccess('Medicine added to inventory!');
      setFormData({ name: '', stock: '', price: '' });
      fetchMedicines();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Medicine
  const handleOpenEdit = (med) => {
    setEditTarget(med);
    setEditFormData({
      name: med.name,
      stock: String(med.stock || 0),
      price: String(med.price || 0),
    });
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditMedicine = async () => {
    if (!editFormData.name || !editFormData.stock || !editFormData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.put(`/api/opd/medicines/${editTarget._id || editTarget.id}`, {
        name: editFormData.name,
        stock: Number(editFormData.stock),
        price: Number(editFormData.price),
      });

      setSuccess('Medicine updated successfully!');
      fetchMedicines();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // Restock Medicine
  const handleOpenRestock = (med) => {
    setRestockTarget(med);
    setRestockQty('');
    setError('');
    setSuccess('');
    setIsRestockModalOpen(true);
  };

  const handleRestock = async () => {
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid stock quantity');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await apiClient.put(`/api/opd/medicines/${restockTarget._id || restockTarget.id}/restock`, {
        quantity: qty,
      });

      setSuccess(`Added ${qty} units to ${restockTarget.name}!`);
      fetchMedicines();
      setTimeout(() => {
        setIsRestockModalOpen(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error restocking medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Medicine
  const handleDelete = (med) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to remove "${med.name}" from the inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/opd/medicines/${med._id || med.id}`);
              fetchMedicines();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete medicine');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Header with Title & Action Buttons */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Pharmacy Catalogue</Text>
            <Text style={styles.subtitle}>Stock control, retail pricing & reports</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setIsExportModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.exportBtnText}>📄 Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MEDICINES</Text>
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statSub}>{stats.inStock} In Stock</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL UNITS</Text>
            <Text style={[styles.statValue, { color: '#0f766e' }]}>{stats.totalUnits.toLocaleString('en-IN')}</Text>
            <Text style={styles.statSub}>Available Units</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>STOCK ALERTS</Text>
            <Text
              style={[
                styles.statValue,
                { color: stats.lowStock + stats.outOfStock > 0 ? '#ea580c' : '#16a34a' },
              ]}
            >
              {stats.lowStock + stats.outOfStock}
            </Text>
            <Text style={styles.statSub}>{stats.outOfStock} Out / {stats.lowStock} Low</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>INVENTORY VALUE</Text>
            <Text style={[styles.statValue, { color: '#047857' }]}>
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statSub}>Catalog Worth</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
              All ({medicines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'IN_STOCK' && styles.filterChipActive]}
            onPress={() => setActiveFilter('IN_STOCK')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'IN_STOCK' && styles.filterChipTextActive]}>
              In Stock ({stats.inStock})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'LOW_STOCK' && styles.filterChipActiveWarning]}
            onPress={() => setActiveFilter('LOW_STOCK')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'LOW_STOCK' && styles.filterChipTextActiveWarning,
              ]}
            >
              Low ({stats.lowStock})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'OUT_OF_STOCK' && styles.filterChipActiveDanger]}
            onPress={() => setActiveFilter('OUT_OF_STOCK')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'OUT_OF_STOCK' && styles.filterChipTextActiveDanger,
              ]}
            >
              Out ({stats.outOfStock})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Medicines List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loadingText}>Loading Pharmacy Stock...</Text>
          </View>
        ) : filteredMedicines.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>No Medicines Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || activeFilter !== 'ALL'
                ? 'No medicines match your search / filter criteria.'
                : 'Add medicines to your catalogue to manage stock and billing.'}
            </Text>
            {(searchQuery || activeFilter !== 'ALL') && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
              >
                <Text style={styles.resetFilterText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMedicines.map((med) => {
            const stock = Number(med.stock) || 0;
            const price = Number(med.price) || 0;
            const isLowStock = stock < 10 && stock > 0;
            const isOutOfStock = stock === 0;
            const itemValue = stock * price;

            return (
              <View key={med._id || med.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{med.name}</Text>
                    <Text style={styles.category}>
                      Unit Price: <Text style={styles.priceHighlight}>₹{price}</Text>
                      {stock > 0 ? ` • Valuation: ₹${itemValue.toLocaleString('en-IN')}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stockBadge,
                      isOutOfStock ? styles.badgeRed : isLowStock ? styles.badgeOrange : styles.badgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isOutOfStock ? styles.textRed : isLowStock ? styles.textOrange : styles.textGreen,
                      ]}
                    >
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </Text>
                  </View>
                </View>

                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Current Stock:</Text>
                  <Text
                    style={[
                      styles.stockValue,
                      isOutOfStock ? styles.textRed : isLowStock ? styles.textOrange : styles.textGreen,
                    ]}
                  >
                    {stock} units
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.restockBtn]}
                    onPress={() => handleOpenRestock(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionBtnText, styles.restockBtnText]}>+ Restock</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEdit(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(med)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionBtnText, styles.deleteBtnText]}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Export Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={isExportModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsExportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Export Pharmacy Report</Text>
                  <Text style={styles.modalSubTitle}>Print, PDF download or spreadsheet data</Text>
                </View>
                <TouchableOpacity onPress={() => setIsExportModalOpen(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Export Scope Selector */}
              <View style={styles.exportScopeContainer}>
                <Text style={styles.scopeTitle}>SELECT EXPORT SCOPE:</Text>
                <View style={styles.scopeOptions}>
                  <TouchableOpacity
                    style={[styles.scopeBtn, exportScope === 'FILTERED' && styles.scopeBtnActive]}
                    onPress={() => setExportScope('FILTERED')}
                  >
                    <Text style={[styles.scopeBtnText, exportScope === 'FILTERED' && styles.scopeBtnTextActive]}>
                      Current View ({filteredMedicines.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scopeBtn, exportScope === 'ALL' && styles.scopeBtnActive]}
                    onPress={() => setExportScope('ALL')}
                  >
                    <Text style={[styles.scopeBtnText, exportScope === 'ALL' && styles.scopeBtnTextActive]}>
                      All Items ({medicines.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scopeBtn, exportScope === 'ALERTS' && styles.scopeBtnActive]}
                    onPress={() => setExportScope('ALERTS')}
                  >
                    <Text style={[styles.scopeBtnText, exportScope === 'ALERTS' && styles.scopeBtnTextActive]}>
                      Stock Alerts ({stats.lowStock + stats.outOfStock})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary of what will be exported */}
              <View style={styles.exportSummaryCard}>
                <View style={styles.exportSummaryRow}>
                  <Text style={styles.exportSummaryLabel}>Items Selected:</Text>
                  <Text style={styles.exportSummaryVal}>{targetExportList.length} Medicines</Text>
                </View>
                <View style={styles.exportSummaryRow}>
                  <Text style={styles.exportSummaryLabel}>Total Units:</Text>
                  <Text style={styles.exportSummaryVal}>
                    {targetExportList
                      .reduce((acc, m) => acc + (Number(m.stock) || 0), 0)
                      .toLocaleString('en-IN')}{' '}
                    units
                  </Text>
                </View>
                <View style={styles.exportSummaryRow}>
                  <Text style={styles.exportSummaryLabel}>Valuation:</Text>
                  <Text style={[styles.exportSummaryVal, { color: '#0f766e', fontWeight: '800' }]}>
                    ₹
                    {targetExportList
                      .reduce((acc, m) => acc + (Number(m.stock) || 0) * (Number(m.price) || 0), 0)
                      .toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.exportActionGroup}>
                <TouchableOpacity
                  style={[styles.exportActionBtn, styles.printActionBtn, exporting && styles.btnDisabled]}
                  onPress={handlePrintReport}
                  disabled={exporting || targetExportList.length === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportActionIcon}>🖨️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportActionTitle}>Print Stock Register</Text>
                    <Text style={styles.exportActionSub}>Open printer preview dialog & A4 layout</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.exportActionBtn, styles.pdfActionBtn, exporting && styles.btnDisabled]}
                  onPress={handleSharePdf}
                  disabled={exporting || targetExportList.length === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportActionIcon}>📑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportActionTitle}>Share / Download PDF</Text>
                    <Text style={styles.exportActionSub}>Export PDF via WhatsApp, Email, Drive</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.exportActionBtn, styles.csvActionBtn, exporting && styles.btnDisabled]}
                  onPress={handleShareCsv}
                  disabled={exporting || targetExportList.length === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportActionIcon}>📊</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportActionTitle}>Share CSV / Spreadsheet Data</Text>
                    <Text style={styles.exportActionSub}>Raw tabular data for Excel & Sheets</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {exporting && (
                <View style={styles.exportingIndicator}>
                  <ActivityIndicator size="small" color="#0D9488" />
                  <Text style={styles.exportingText}>Preparing Report Export...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Medicine Modal ──────────────────────────────────────────── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsAddModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Pharmacy Stock</Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MEDICINE NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Paracetamol 650mg"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>STOCK QTY *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="100"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      value={formData.stock}
                      onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PRICE (₹) *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="30"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleAddMedicine}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Add Stock to Pharmacy</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Medicine Modal ──────────────────────────────────────────── */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsEditModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Medicine</Text>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MEDICINE NAME *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Medicine Name"
                    placeholderTextColor="#94a3b8"
                    value={editFormData.name}
                    onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>STOCK QTY</Text>
                    <TextInput
                      style={styles.fieldInput}
                      keyboardType="number-pad"
                      placeholderTextColor="#94a3b8"
                      value={editFormData.stock}
                      onChangeText={(text) => setEditFormData({ ...editFormData, stock: text })}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>PRICE (₹)</Text>
                    <TextInput
                      style={styles.fieldInput}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#94a3b8"
                      value={editFormData.price}
                      onChangeText={(text) => setEditFormData({ ...editFormData, price: text })}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleEditMedicine}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Restock Modal ────────────────────────────────────────────────── */}
      <Modal visible={isRestockModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsRestockModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Restock Medicine</Text>
                  <TouchableOpacity onPress={() => setIsRestockModalOpen(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                {restockTarget && (
                  <View style={styles.restockInfo}>
                    <Text style={styles.restockName}>{restockTarget.name}</Text>
                    <Text style={styles.restockCurrent}>Current Stock: {restockTarget.stock || 0} units</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>UNITS TO ADD *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 50"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    value={restockQty}
                    onChangeText={setRestockQty}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRestock}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm Restock</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc', paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { backgroundColor: '#0D9488', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  exportBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  exportBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 13 },

  // Stats Grid
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginVertical: 2 },
  statSub: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },
  clearSearchBtn: { padding: 4 },
  clearSearchText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },

  // Filter Chips
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipActiveWarning: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  filterChipActiveDanger: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#ffffff', fontWeight: '700' },
  filterChipTextActiveWarning: { color: '#ffffff', fontWeight: '700' },
  filterChipTextActiveDanger: { color: '#ffffff', fontWeight: '700' },

  // Card items
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#0f766e', fontSize: 14 },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  resetFilterBtn: {
    marginTop: 12,
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  resetFilterText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  card: { backgroundColor: '#ffffff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  category: { fontSize: 12, color: '#64748b', marginTop: 2 },
  priceHighlight: { fontWeight: '700', color: '#0f766e' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  badgeOrange: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  badgeRed: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  stockBadgeText: { fontSize: 10, fontWeight: '700' },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  stockLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  stockValue: { fontSize: 13, fontWeight: '800' },

  textGreen: { color: '#16a34a' },
  textOrange: { color: '#ea580c' },
  textRed: { color: '#dc2626' },

  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  restockBtn: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  restockBtnText: { color: '#0f766e', fontWeight: '700' },
  deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  deleteBtnText: { color: '#991b1b', fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 20, gap: 14, paddingBottom: Platform.OS === 'ios' ? 40 : 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalSubTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  modalClose: { fontSize: 20, color: '#64748b', fontWeight: '700', padding: 4 },

  // Export Modal Specific Styles
  exportScopeContainer: { gap: 8 },
  scopeTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  scopeOptions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  scopeBtn: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  scopeBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  scopeBtnText: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
  scopeBtnTextActive: { color: '#ffffff', fontWeight: '700' },

  exportSummaryCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    padding: 12,
    gap: 6,
  },
  exportSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportSummaryLabel: { fontSize: 12, color: '#475569', fontWeight: '600' },
  exportSummaryVal: { fontSize: 12, color: '#0f172a', fontWeight: '700' },

  exportActionGroup: { gap: 10, marginTop: 4 },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  printActionBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  pdfActionBtn: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  csvActionBtn: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  exportActionIcon: { fontSize: 22 },
  exportActionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  exportActionSub: { fontSize: 11, color: '#64748b', marginTop: 1 },

  exportingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  exportingText: { fontSize: 12, color: '#0D9488', fontWeight: '600' },

  successBox: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, padding: 10, borderRadius: 10 },
  successText: { color: '#047857', fontWeight: '700', fontSize: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 10, borderRadius: 10 },
  errorText: { color: '#b91c1c', fontSize: 13 },

  fieldGroup: { gap: 6 },
  rowFields: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  restockInfo: { backgroundColor: '#f0fdfa', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#99f6e4', gap: 4 },
  restockName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  restockCurrent: { fontSize: 13, color: '#0f766e', fontWeight: '600' },
});
