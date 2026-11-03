import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, Share } from 'react-native';

/**
 * Converts a number to Indian Currency words (Rupees and Paise)
 * e.g., 2200 -> "Rupees Two Thousand Two Hundred Only"
 */
export const numberToWordsINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'Rupees Zero Only';
  const numVal = Number(num);
  const rupees = Math.floor(Math.abs(numVal));
  const paise = Math.round((Math.abs(numVal) - rupees) * 100);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let result = '';
  if (rupees === 0) {
    result = paise > 0 ? '' : 'Zero';
  } else {
    const crore = Math.floor(rupees / 10000000);
    let rem = rupees % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    const thousand = Math.floor(rem / 1000);
    rem %= 1000;
    const hundred = rem;

    if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (hundred > 0) result += convertLessThanOneThousand(hundred) + ' ';
  }

  let finalStr = 'Rupees ' + result.trim();
  if (paise > 0) {
    finalStr += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }
  return finalStr.trim() + ' Only';
};

/**
 * Extracts line items from a bill object
 */
export const getInvoiceLineItems = (bill) => {
  const items = [];

  // Doctor Consultation
  const consultFee = parseFloat(bill.consultationFee || 0);
  if (consultFee > 0) {
    const disc = parseFloat(bill.consultationDiscount || 0);
    const discType = bill.consultationDiscountType || 'fixed';
    let net = consultFee;
    if (disc > 0) {
      net = discType === 'percentage' ? consultFee - (consultFee * disc) / 100 : consultFee - disc;
    }
    items.push({
      name: 'OPD Consultation Fee',
      qty: 1,
      rate: consultFee,
      amount: Math.max(0, net),
    });
  }

  // Diagnostic Tests
  (bill.tests || []).forEach((t) => {
    const price = parseFloat(t.price || 0);
    const disc = parseFloat(t.discount || 0);
    const discType = t.discountType || 'fixed';
    let net = price;
    if (disc > 0) {
      net = discType === 'percentage' ? price - (price * disc) / 100 : price - disc;
    }
    items.push({
      name: `Diagnostic: ${t.name || 'Test'}`,
      qty: 1,
      rate: price,
      amount: Math.max(0, net),
    });
  });

  // Medicines
  (bill.medicines || []).forEach((m) => {
    const price = parseFloat(m.price || 0);
    const qty = parseInt(m.quantity || 1, 10);
    const gross = price * qty;
    const disc = parseFloat(m.discount || 0);
    const discType = m.discountType || 'fixed';
    let net = gross;
    if (disc > 0) {
      net = discType === 'percentage' ? gross - (gross * disc) / 100 : gross - disc;
    }
    items.push({
      name: `Medicine: ${m.name || 'Medicine'}`,
      qty: qty,
      rate: price,
      amount: Math.max(0, net),
    });
  });

  return items;
};

/**
 * Format currency with Indian formatting (e.g., 2,200)
 */
export const formatINR = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  });
};

/**
 * Formats Bill ID as ddmmyyyy000001 (e.g. 20102026000001)
 */
export const formatBillId = (bill) => {
  if (!bill) return '';
  if (bill.invoiceNumber && /^\d{14}$/.test(String(bill.invoiceNumber))) {
    return String(bill.invoiceNumber);
  }
  if (bill.invoiceNumber && String(bill.invoiceNumber).length <= 14) {
    return String(bill.invoiceNumber);
  }

  const d = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const datePrefix = `${day}${month}${year}`;

  const rawId = String(bill.invoiceNumber || bill._id || bill.id || '');
  if (!rawId) {
    return `${datePrefix}000001`;
  }

  let seqNum = 1;
  if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
    const counterHex = rawId.slice(-6);
    seqNum = (parseInt(counterHex, 16) % 1000000) || 1;
  } else {
    const digitsOnly = rawId.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      seqNum = (parseInt(digitsOnly.slice(-6), 10) % 1000000) || 1;
    }
  }

  const seq = String(seqNum).padStart(6, '0');
  return `${datePrefix}${seq}`;
};

/**
 * Generates official Cash Memo / Bill HTML matching the exact design
 */
export const generateInvoiceHtml = (bill) => {
  if (!bill) return '';

  const patient = bill.patientId || {};
  const patientName = bill.patientName || patient.name || 'Walk-in Patient';
  const patientAddress = patient.address || bill.patientAddress || 'Kolkata Serenity Foundation';
  const patientPhone = bill.patientPhone || patient.phone || '';

  const billId = formatBillId(bill);
  const billDate = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const isPaid = (bill.status === 'Paid' || bill.status === 'PAID');
  const statusLabel = isPaid ? 'PAID' : 'PENDING';
  const paymentMethod = (bill.paymentMethod || (isPaid ? 'Cash' : '')).toLowerCase();

  const isCash = paymentMethod.includes('cash') || (isPaid && !paymentMethod.includes('upi') && !paymentMethod.includes('bank'));
  const isUpi = paymentMethod.includes('upi') || paymentMethod.includes('online');
  const isBank = paymentMethod.includes('bank') || paymentMethod.includes('neft') || paymentMethod.includes('rtgs');
  const isOther = isPaid && !isCash && !isUpi && !isBank;

  const items = getInvoiceLineItems(bill);
  
  // Calculate Totals
  const subtotal = parseFloat(bill.subtotal || items.reduce((acc, it) => acc + (it.amount || 0), 0) + (parseFloat(bill.discount || 0)));
  const discountVal = parseFloat(bill.discount || 0);
  const discountAmt = bill.discountType === 'percentage'
    ? (subtotal * discountVal) / 100
    : discountVal;
  const totalAmount = parseFloat(bill.totalAmount !== undefined ? bill.totalAmount : Math.max(0, subtotal - discountAmt));
  const amountWords = numberToWordsINR(totalAmount);

  // Pad to at least 10 rows to preserve exact layout
  const totalRows = Math.max(10, items.length);
  const rows = [];
  for (let i = 0; i < totalRows; i++) {
    const item = items[i];
    rows.push({
      slNo: `${i + 1}.`,
      description: item ? item.name : '',
      qty: item ? item.qty : '',
      rate: item ? formatINR(item.rate) : '',
      amount: item ? formatINR(item.amount) : '',
      isEmpty: !item,
    });
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${billId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
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
      color: #111827;
      font-size: 12px;
      line-height: 1.35;
    }

    /* ═══ OUTER FRAME ═══ */
    .bill-frame {
      border: 2px solid #01563f;
      border-radius: 8px;
      padding: 12px 16px;
      background: #ffffff;
      max-width: 820px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    /* ═══ TOP HEADER ═══ */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .rf-badge-svg {
      width: 78px;
      height: 78px;
      flex-shrink: 0;
    }

    .vertical-sep {
      width: 2px;
      height: 60px;
      background-color: #01563f;
    }

    .brand-titles {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .title-primary {
      font-size: 26px;
      font-weight: 900;
      color: #01563f;
      line-height: 1.0;
      letter-spacing: 0.5px;
      font-family: Impact, 'Arial Black', -apple-system, sans-serif;
    }

    .title-tagline {
      font-size: 11px;
      font-weight: 700;
      color: #01563f;
      margin-top: 4px;
      letter-spacing: 0.8px;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .pill-banner {
      background-color: #01563f;
      color: #ffffff;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 6px 20px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .phone-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 800;
      color: #111827;
      margin-top: 3px;
    }

    .phone-icon {
      width: 15px;
      height: 15px;
      fill: #01563f;
    }

    /* ═══ DIVIDER LINE ═══ */
    .h-divider {
      height: 1.5px;
      background-color: #01563f;
      margin: 3px 0 8px 0;
    }

    /* ═══ OFFICE INFO & BILL META ═══ */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      font-size: 11px;
    }

    .office-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      color: #1f2937;
      max-width: 55%;
    }

    .info-line {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-icon {
      width: 13px;
      height: 13px;
      fill: #01563f;
      flex-shrink: 0;
    }

    .bill-meta-box {
      min-width: 38%;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      padding: 2.5px 0;
      border-bottom: 1px solid #d1d5db;
    }

    .meta-label {
      width: 70px;
      font-weight: 700;
      color: #1f2937;
    }

    .meta-colon {
      margin-right: 8px;
      font-weight: 700;
      color: #1f2937;
    }

    .meta-value {
      font-weight: 700;
      color: #111827;
      font-size: 11px;
      letter-spacing: 0.5px;
      font-family: 'SF Mono', Consolas, Monaco, Menlo, monospace;
      word-break: break-all;
    }

    .status-badge {
      font-size: 10.5px;
      font-weight: 900;
      padding: 2px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      display: inline-block;
    }

    .status-pending {
      background-color: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    .status-paid {
      background-color: #dcfce7;
      color: #16a34a;
      border: 1px solid #86efac;
    }

    /* ═══ BILL TO & PAYMENT DETAILS ═══ */
    .party-row {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
    }

    .bill-to-box {
      flex: 1;
      border: 1.5px solid #01563f;
      border-radius: 5px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .box-header-green {
      background-color: #01563f;
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 800;
      padding: 4px 10px;
      letter-spacing: 0.5px;
    }

    .box-body {
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 11.5px;
    }

    .field-row {
      display: flex;
      align-items: baseline;
    }

    .field-lbl {
      width: 70px;
      font-weight: 700;
      color: #1f2937;
    }

    .field-sep {
      margin-right: 6px;
      font-weight: 700;
    }

    .field-val {
      flex: 1;
      color: #111827;
      font-weight: 600;
    }

    .field-underline {
      border-bottom: 1px solid #4b5563;
      padding-bottom: 1px;
    }

    .payment-details-box {
      flex: 1.1;
      border: 1.5px solid #01563f;
      border-radius: 5px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .pay-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #01563f;
      margin-bottom: 6px;
    }

    .checkboxes-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .check-box {
      width: 12px;
      height: 12px;
      border: 1.2px solid #01563f;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 900;
      color: #01563f;
      background: #ffffff;
    }

    .words-blank-row {
      margin-top: 8px;
      display: flex;
      align-items: baseline;
      font-size: 11px;
      font-weight: 600;
    }

    .words-blank-line {
      flex: 1;
      border-bottom: 1px solid #4b5563;
      margin-left: 6px;
      height: 12px;
    }

    /* ═══ LINE ITEMS TABLE ═══ */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #01563f;
      margin-bottom: 0px;
    }

    .items-table th {
      background-color: #01563f;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 5px 6px;
      text-align: left;
      border-right: 1px solid #ffffff;
      letter-spacing: 0.5px;
    }

    .items-table th:last-child {
      border-right: none;
    }

    .items-table td {
      padding: 4px 6px;
      font-size: 11px;
      border-right: 1.5px solid #01563f;
      border-bottom: 1px dotted #9ca3af;
      height: 20px;
      vertical-align: middle;
    }

    .items-table td:last-child {
      border-right: none;
    }

    .col-sl { width: 8%; text-align: center; }
    .col-desc { width: 52%; text-align: left; }
    .col-qty { width: 10%; text-align: center; }
    .col-rate { width: 15%; text-align: right; }
    .col-amount { width: 15%; text-align: right; font-weight: 600; }

    /* ═══ SUMMARY & TOTALS ═══ */
    .summary-section {
      display: flex;
      border-left: 1.5px solid #01563f;
      border-right: 1.5px solid #01563f;
      border-bottom: 1.5px solid #01563f;
    }

    .thankyou-box {
      width: 32%;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-right: 1.5px solid #01563f;
    }

    .calc-icon-svg {
      width: 28px;
      height: 28px;
      fill: #01563f;
      flex-shrink: 0;
    }

    .thankyou-text {
      font-size: 9.5px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.25;
    }

    .amount-words-middle {
      width: 38%;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      border-right: 1.5px solid #01563f;
      font-size: 11px;
      color: #1f2937;
      line-height: 1.3;
    }

    .words-val {
      font-weight: 800;
      color: #01563f;
    }

    .totals-box {
      width: 30%;
      display: flex;
      flex-direction: column;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      font-size: 11.5px;
      font-weight: 700;
      border-bottom: 1px solid #e5e7eb;
    }

    .total-line:last-child {
      border-bottom: none;
    }

    .grand-total-bar {
      background-color: #01563f;
      color: #ffffff;
      padding: 5px 8px;
      font-weight: 900;
      font-size: 12px;
    }

    /* ═══ SIGNATURES & DISCLAIMER ═══ */
    .sign-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 18px 8px 6px 8px;
      margin-top: 6px;
    }

    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 28%;
      font-size: 10.5px;
    }

    .sig-name {
      font-weight: 800;
      color: #111827;
    }

    .sig-sub {
      color: #4b5563;
      font-size: 9.5px;
    }

    .disclaimer-box {
      width: 42%;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fafafa;
    }

    .red-star {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      fill: #ef4444;
    }

    .disclaimer-text {
      font-size: 9.5px;
      line-height: 1.25;
      color: #374151;
    }

    .disclaimer-highlight {
      color: #dc2626;
      font-weight: 800;
    }

    /* ═══ FOOTER ═══ */
    .bill-footer {
      border-top: 1.5px solid #01563f;
      padding-top: 8px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      color: #01563f;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .heart-svg {
      width: 14px;
      height: 14px;
      fill: #01563f;
    }

    .footer-mid {
      color: #1f2937;
      font-weight: 600;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 800;
    }

    .heka-cross-svg {
      width: 16px;
      height: 16px;
    }
  </style>
</head>
<body>

<div class="bill-frame">

  <!-- ════ TOP HEADER ════ -->
  <div class="top-header">
    <div class="brand-group">
      <!-- Curved Circular RF Badge -->
      <svg class="rf-badge-svg" viewBox="0 0 120 120">
        <defs>
          <path id="badgeTopPath" d="M 18,60 A 42,42 0 0,1 102,60" fill="none" />
          <path id="badgeBotPath" d="M 16,60 A 44,44 0 0,0 104,60" fill="none" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#01563f" />
        <text font-size="10.5" font-weight="900" fill="#ffffff" letter-spacing="3.2" font-family="'Arial Black', Impact, Arial, sans-serif">
          <textPath href="#badgeTopPath" startOffset="50%" text-anchor="middle">RUDRAKSH</textPath>
        </text>
        <circle cx="26" cy="60" r="2.6" fill="#ffffff" />
        <text x="60" y="69" text-anchor="middle" font-size="30" font-weight="900" fill="#ffffff" font-family="'Arial Black', Impact, Arial, sans-serif" letter-spacing="1">RF</text>
        <circle cx="94" cy="60" r="2.6" fill="#ffffff" />
        <text font-size="9.2" font-weight="900" fill="#ffffff" letter-spacing="2.6" font-family="'Arial Black', Impact, Arial, sans-serif">
          <textPath href="#badgeBotPath" startOffset="50%" text-anchor="middle">FOUNDATION</textPath>
        </text>
      </svg>

      <div class="vertical-sep"></div>

      <div class="brand-titles">
        <div class="title-primary">RUDRAKSH</div>
        <div class="title-primary">FOUNDATION</div>
        <div class="title-tagline">Compassion | Care | Community</div>
      </div>
    </div>

    <div class="header-right">
      <div class="pill-banner">CASH MEMO / BILL</div>
      <div class="phone-row">
        <svg class="phone-icon" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        <span>Mob: 9674363307</span>
      </div>
    </div>
  </div>

  <div class="h-divider"></div>

  <!-- ════ OFFICE INFO & BILL META ════ -->
  <div class="meta-row">
    <div class="office-info">
      <div class="info-line">
        <svg class="meta-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <span><strong>Head Office :</strong> 82/39, Prince Gulam Hussain Shah Road, Kolkata 700032.</span>
      </div>
      <div class="info-line">
        <svg class="meta-icon" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span><strong>Email:</strong> info@rfheka.com</span>
      </div>
      <div class="info-line">
        <svg class="meta-icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8z"/></svg>
        <span>www.rfheka.com</span>
      </div>
    </div>

    <div class="bill-meta-box">
      <div class="meta-item">
        <span class="meta-label">Bill ID</span>
        <span class="meta-colon">:</span>
        <span class="meta-value">${billId}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-colon">:</span>
        <span class="meta-value">${billDate}</span>
      </div>
      <div class="meta-item" style="border-bottom: none;">
        <span class="meta-label">Status</span>
        <span class="meta-colon">:</span>
        <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">${statusLabel}</span>
      </div>
    </div>
  </div>

  <!-- ════ BILL TO & PAYMENT DETAILS ════ -->
  <div class="party-row">
    <!-- Left: BILL TO -->
    <div class="bill-to-box">
      <div class="box-header-green">BILL TO :</div>
      <div class="box-body">
        <div class="field-row">
          <span class="field-lbl">Patient</span>
          <span class="field-sep">:</span>
          <span class="field-val"><strong>${patientName}</strong></span>
        </div>
        <div class="field-row">
          <span class="field-lbl">Address</span>
          <span class="field-sep">:</span>
          <span class="field-val field-underline">${patientAddress}</span>
        </div>
        <div class="field-row">
          <span class="field-lbl">Mobile No.</span>
          <span class="field-sep">:</span>
          <span class="field-val"><strong>${patientPhone || 'N/A'}</strong></span>
        </div>
      </div>
    </div>

    <!-- Right: PAYMENT DETAILS -->
    <div class="payment-details-box">
      <div>
        <div class="pay-title">PAYMENT DETAILS :</div>
        <div class="checkboxes-row">
          <div class="check-item">
            <span class="check-box">${isCash ? '✓' : ''}</span>
            <span>Cash</span>
          </div>
          <div class="check-item">
            <span class="check-box">${isUpi ? '✓' : ''}</span>
            <span>UPI</span>
          </div>
          <div class="check-item">
            <span class="check-box">${isBank ? '✓' : ''}</span>
            <span>Bank Transfer</span>
          </div>
          <div class="check-item">
            <span class="check-box">${isOther ? '✓' : ''}</span>
            <span>Others : ${isOther ? (bill.paymentMethod || '') : '_______'}</span>
          </div>
        </div>
      </div>
      <div class="words-blank-row">
        <span>Amount in Words :</span>
        <div class="words-blank-line"></div>
      </div>
    </div>
  </div>

  <!-- ════ LINE ITEMS TABLE ════ -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="col-sl">SL. NO.</th>
        <th class="col-desc">PARTICULARS / DESCRIPTION</th>
        <th class="col-qty">QTY.</th>
        <th class="col-rate">RATE (₹)</th>
        <th class="col-amount">AMOUNT (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td class="col-sl">${r.slNo}</td>
          <td class="col-desc">${r.description}</td>
          <td class="col-qty">${r.qty}</td>
          <td class="col-rate">${r.rate}</td>
          <td class="col-amount">${r.amount}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- ════ SUMMARY & TOTALS ════ -->
  <div class="summary-section">
    <div class="thankyou-box">
      <svg class="calc-icon-svg" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="3" fill="none" stroke="#01563f" stroke-width="2"/>
        <rect x="7" y="5" width="10" height="4" rx="1" fill="#01563f"/>
        <circle cx="8" cy="13" r="1.2" fill="#01563f"/>
        <circle cx="12" cy="13" r="1.2" fill="#01563f"/>
        <circle cx="16" cy="13" r="1.2" fill="#01563f"/>
        <circle cx="8" cy="17" r="1.2" fill="#01563f"/>
        <circle cx="12" cy="17" r="1.2" fill="#01563f"/>
        <circle cx="16" cy="17" r="1.2" fill="#01563f"/>
      </svg>
      <div class="thankyou-text">
        Thank you for your support.<br>
        Your contribution helps us serve<br>
        better and build a healthier community.
      </div>
    </div>

    <div class="amount-words-middle">
      <div>Amount in Words : <span class="words-val">${amountWords}</span></div>
    </div>

    <div class="totals-box">
      <div class="total-line">
        <span>SUB TOTAL</span>
        <span>₹</span>
        <span>${formatINR(subtotal)}</span>
      </div>
      <div class="total-line">
        <span>DISCOUNT</span>
        <span>₹</span>
        <span>${formatINR(discountAmt)}</span>
      </div>
      <div class="total-line grand-total-bar">
        <span>TOTAL AMOUNT</span>
        <span>₹</span>
        <span>${formatINR(totalAmount)}</span>
      </div>
    </div>
  </div>

  <!-- ════ SIGNATURES & DISCLAIMER ════ -->
  <div class="sign-row">
    <div class="sig-col">
      <div style="height: 32px;"></div>
      <span class="sig-name">Authorized Signatory</span>
      <span class="sig-sub">(For Rudraksh Foundation)</span>
    </div>

    <div class="disclaimer-box">
      <svg class="red-star" viewBox="0 0 24 24">
        <path d="M12 2 L13.5 7 L18.5 5 L16 9.5 L21 11 L16 12.5 L18.5 17 L13.5 15 L12 20 L10.5 15 L5.5 17 L8 12.5 L3 11 L8 9.5 L5.5 5 L10.5 7 Z"/>
      </svg>
      <div class="disclaimer-text">
        <span class="disclaimer-highlight">Disclaimer :</span> The bill is issued for our official purpose only.<br>
        If any inconvenience occur that will not be under the jurisdiction of BNS.
      </div>
    </div>

    <div class="sig-col">
      <div style="height: 32px;"></div>
      <span class="sig-name">Receiver's Signature</span>
    </div>
  </div>

  <!-- ════ FOOTER ════ -->
  <div class="bill-footer">
    <div class="footer-left">
      <svg class="heart-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <span>We Care. We Serve. We Change Lives.</span>
    </div>
    <div class="footer-right">
      <span>Powered by <strong>HEKA</strong></span>
      <svg class="heka-cross-svg" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#01563f" stroke-width="2"/>
        <path d="M12 7v10M7 12h10" stroke="#01563f" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

</div>

</body>
</html>
  `;
};

/**
 * Print Cash Memo / Bill (Native Print Dialog)
 */
export const printInvoice = async (bill) => {
  try {
    const html = generateInvoiceHtml(bill);
    await Print.printAsync({ html, width: 595, height: 842 });
  } catch (error) {
    console.error('Error printing invoice:', error);
    Alert.alert('Print Error', 'Could not open print dialog: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Export and Share Invoice as PDF
 */
export const shareInvoicePdf = async (bill) => {
  try {
    const patientName = bill?.patientName || bill?.patientId?.name || 'Patient';
    const html = generateInvoiceHtml(bill);
    const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: false });

    if (Platform.OS === 'web') {
      Alert.alert('PDF Generated', 'Invoice PDF generated successfully.');
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Cash Memo / Bill - ${patientName}`,
      });
    } else {
      Alert.alert('Sharing Unavailable', `PDF saved at: ${uri}`);
    }
  } catch (error) {
    console.error('Error generating/sharing invoice PDF:', error);
    Alert.alert('PDF Error', 'Failed to generate PDF: ' + (error.message || 'Unknown error'));
  }
};

