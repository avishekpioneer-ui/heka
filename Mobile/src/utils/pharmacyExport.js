import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, Share } from 'react-native';

/**
 * Generates an elegant, high-definition HTML report for Pharmacy Catalogue & Inventory.
 */
export const generatePharmacyReportHtml = (medicines = [], options = {}) => {
  const {
    title = 'Pharmacy Stock & Inventory Report',
    filterLabel = 'All Medicines',
    generatedAt = new Date(),
  } = options;

  const formattedDate = new Date(generatedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(generatedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate statistics
  const totalItems = medicines.length;
  let totalUnits = 0;
  let totalValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;

  medicines.forEach((med) => {
    const stock = Number(med.stock) || 0;
    const price = Number(med.price) || 0;
    totalUnits += stock;
    totalValuation += stock * price;

    if (stock === 0) {
      outOfStockCount++;
    } else if (stock < 10) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  const rowsHtml = medicines
    .map((med, index) => {
      const stock = Number(med.stock) || 0;
      const price = Number(med.price) || 0;
      const itemValuation = stock * price;

      let statusBadge = '';
      if (stock === 0) {
        statusBadge = '<span class="badge badge-red">Out of Stock</span>';
      } else if (stock < 10) {
        statusBadge = '<span class="badge badge-orange">Low Stock</span>';
      } else {
        statusBadge = '<span class="badge badge-green">In Stock</span>';
      }

      return `
        <tr>
          <td style="text-align: center; color: #64748b;">${index + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${escapeHtml(med.name || 'Unnamed Medicine')}</div>
            <div style="font-size: 9px; color: #94a3b8;">SKU: MED-${String(med._id || med.id || index + 1).slice(-6).toUpperCase()}</div>
          </td>
          <td style="text-align: center;">${statusBadge}</td>
          <td style="text-align: right; font-weight: 700; color: ${stock === 0 ? '#dc2626' : stock < 10 ? '#ea580c' : '#0f766e'};">
            ${stock} <span style="font-size: 9px; font-weight: normal; color: #64748b;">units</span>
          </td>
          <td style="text-align: right; font-weight: 600; color: #334155;">₹${formatCurrency(price)}</td>
          <td style="text-align: right; font-weight: 800; color: #0f766e;">₹${formatCurrency(itemValuation)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #0f172a;
    }
    .report-container {
      width: 100%;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 2px solid #0D9488;
      margin-bottom: 14px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #0D9488;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 22px;
      font-weight: bold;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-tagline {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .header-right {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      color: #0f766e;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-text {
      font-size: 10px;
      color: #64748b;
      margin: 1px 0;
    }

    /* Title & Filter Bar */
    .title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 14px;
      margin-bottom: 14px;
    }
    .report-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .filter-tag {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 6px;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid #0D9488;
    }
    .kpi-card.kpi-warning {
      border-left-color: #ea580c;
    }
    .kpi-card.kpi-danger {
      border-left-color: #dc2626;
    }
    .kpi-card.kpi-success {
      border-left-color: #16a34a;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #0f766e;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 10px;
      text-align: left;
      border: 1px solid #0f766e;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fcfdfe;
    }
    tr:hover td {
      background: #f1f5f9;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 700;
    }
    .badge-green {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    .badge-orange {
      background: #fff7ed;
      color: #ea580c;
      border: 1px solid #fed7aa;
    }
    .badge-red {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Totals Footer Row */
    .totals-row td {
      background: #f0fdfa !important;
      font-weight: 800;
      border-top: 2px solid #0D9488;
      border-bottom: 2px solid #0D9488;
      color: #0f766e;
      font-size: 11px;
    }

    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <div class="header">
      <div class="brand-left">
        <div class="brand-logo-circle">💊</div>
        <div>
          <h1 class="brand-name">RUDRAKSH FOUNDATION</h1>
          <div class="brand-tagline">OPD Clinical & Pharmacy Stock Management</div>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-badge">Official Stock Register</div>
        <div class="meta-text"><strong>Date:</strong> ${formattedDate}</div>
        <div class="meta-text"><strong>Time:</strong> ${formattedTime}</div>
      </div>
    </div>

    <!-- Title Bar -->
    <div class="title-bar">
      <div>
        <h2 class="report-title">${escapeHtml(title)}</h2>
      </div>
      <div class="filter-tag">Filter: ${escapeHtml(filterLabel)}</div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Medicines</div>
        <div class="kpi-val">${totalItems}</div>
        <div class="kpi-sub">Unique catalogue items</div>
      </div>
      <div class="kpi-card kpi-success">
        <div class="kpi-label">Total Stock Units</div>
        <div class="kpi-val">${formatCurrency(totalUnits)}</div>
        <div class="kpi-sub">${inStockCount} items adequately stocked</div>
      </div>
      <div class="kpi-card ${lowStockCount > 0 || outOfStockCount > 0 ? 'kpi-warning' : ''}">
        <div class="kpi-label">Stock Alerts</div>
        <div class="kpi-val" style="color: ${outOfStockCount > 0 ? '#dc2626' : lowStockCount > 0 ? '#ea580c' : '#16a34a'};">
          ${lowStockCount + outOfStockCount}
        </div>
        <div class="kpi-sub">${outOfStockCount} out of stock, ${lowStockCount} low stock</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Inventory Valuation</div>
        <div class="kpi-val" style="color: #0f766e;">₹${formatCurrency(totalValuation)}</div>
        <div class="kpi-sub">Total catalog retail value</div>
      </div>
    </div>

    <!-- Medicine Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Medicine Name</th>
          <th style="width: 100px; text-align: center;">Status</th>
          <th style="width: 90px; text-align: right;">Stock Qty</th>
          <th style="width: 85px; text-align: right;">Unit Price</th>
          <th style="width: 100px; text-align: right;">Total Value</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No medicines found in this inventory register.</td></tr>'}
        <tr class="totals-row">
          <td colspan="3" style="text-align: right;">CATALOGUE TOTALS:</td>
          <td style="text-align: right;">${formatCurrency(totalUnits)} units</td>
          <td style="text-align: right;">—</td>
          <td style="text-align: right;">₹${formatCurrency(totalValuation)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
      <div>Generated automatically via Heka Mobile Healthcare System</div>
      <div>Confidential • For Official Pharmacy Audit & Management Only</div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Escapes HTML characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Print Pharmacy Report (opens native print preview modal)
 */
export const printPharmacyReport = async (medicines = [], options = {}) => {
  try {
    if (!medicines || medicines.length === 0) {
      Alert.alert('Empty Catalog', 'There are no medicines available to print.');
      return;
    }
    const html = generatePharmacyReportHtml(medicines, options);
    await Print.printAsync({ html, width: 595, height: 842 });
  } catch (error) {
    console.error('Error printing pharmacy report:', error);
    Alert.alert('Print Error', 'Could not open print preview: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Generate PDF and open native sharing dialog (WhatsApp, Drive, Files, Email)
 */
export const sharePharmacyPdf = async (medicines = [], options = {}) => {
  try {
    if (!medicines || medicines.length === 0) {
      Alert.alert('Empty Catalog', 'There are no medicines available to export.');
      return;
    }

    const html = generatePharmacyReportHtml(medicines, options);
    const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: false });

    if (Platform.OS === 'web') {
      Alert.alert('PDF Generated', 'PDF report generated successfully.');
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: options.title || 'Share Pharmacy Stock Report',
      });
    } else {
      Alert.alert('Sharing Unavailable', `PDF report saved at: ${uri}`);
    }
  } catch (error) {
    console.error('Error sharing pharmacy PDF:', error);
    Alert.alert('Export Error', 'Could not generate PDF: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Generate CSV and share directly
 */
export const sharePharmacyCsv = async (medicines = [], options = {}) => {
  try {
    if (!medicines || medicines.length === 0) {
      Alert.alert('Empty Catalog', 'There are no medicines available to export.');
      return;
    }

    const headers = ['S.No', 'Medicine Name', 'Stock Qty', 'Unit Price (INR)', 'Total Valuation (INR)', 'Stock Status'];
    const rows = medicines.map((med, index) => {
      const stock = Number(med.stock) || 0;
      const price = Number(med.price) || 0;
      const valuation = stock * price;
      const status = stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock';
      
      const cleanName = `"${String(med.name || '').replace(/"/g, '""')}"`;
      return `${index + 1},${cleanName},${stock},${price},${valuation},"${status}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    await Share.share({
      title: options.title || 'Pharmacy Inventory Stock Report (CSV)',
      message: csvContent,
    });
  } catch (error) {
    console.error('Error sharing CSV:', error);
    Alert.alert('CSV Export Error', 'Could not export CSV: ' + (error.message || 'Unknown error'));
  }
};
