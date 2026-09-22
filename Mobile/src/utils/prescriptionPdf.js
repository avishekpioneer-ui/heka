import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Generates HTML matching the official Rudraksh Foundation prescription letterhead exactly.
 */
export const generatePrescriptionHtml = (consultation) => {
  const patient = consultation?.patientId || {};
  const patientName = consultation?.patientName || patient.name || '';
  const age = patient.age ? `${patient.age} Yrs` : '';
  const gender = (patient.gender || '').toUpperCase();
  const phone = patient.phone || '';
  const address = patient.address || '';

  const formattedDate = consultation?.createdAt
    ? new Date(consultation.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  const followUpFormatted = consultation?.followUpDate
    ? new Date(consultation.followUpDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const medicines = consultation?.prescription || [];
  const isMale = gender.startsWith('M');
  const isFemale = gender.startsWith('F');
  const isOther = !isMale && !isFemale && gender.length > 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - ${patientName || 'Patient'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: #1a1a1a;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    /* ═══ PAGE WRAPPER ═══ */
    .page {
      width: 100%;
      height: 100%;
      padding: 20px 24px 14px 24px;
      display: flex;
      flex-direction: column;
      gap: 0px;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }

    /* ═══ HEADER ═══ */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 2px solid #0b4d3c;
      flex-shrink: 0;
    }

    /* --- Brand Left --- */
    .brand-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* RF circular badge SVG */
    .rf-badge-svg {
      width: 102px;
      height: 102px;
      flex-shrink: 0;
    }

    /* Brand text */
    .brand-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-name {
      font-size: 54px;
      font-weight: 900;
      color: #0b4534;
      line-height: 0.90;
      letter-spacing: 0.5px;
      font-family: 'Arial Black', Impact, 'Segoe UI', Arial, sans-serif;
    }
    .brand-tagline {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
    .brand-sub {
      font-size: 22px;
      font-weight: 900;
      color: #0b4534;
      letter-spacing: 7px;
      text-transform: uppercase;
      font-family: 'Arial Black', Arial, sans-serif;
    }
    .leaf-svg {
      width: 40px;
      height: 28px;
    }

    /* --- Org Details Right --- */
    .org-right {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 10.5px;
      color: #1a1a1a;
      max-width: 200px;
      border-left: 1px solid #d1d5db;
      padding-left: 10px;
    }
    .org-row {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      line-height: 1.3;
    }
    .org-icon {
      width: 14px;
      height: 14px;
      fill: #0b4d3c;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .org-label {
      font-weight: 700;
      color: #0b4d3c;
      display: block;
    }
    .org-val {
      font-weight: 400;
      color: #1a1a1a;
      display: block;
    }
    .org-val-bold {
      font-size: 14px;
      font-weight: 900;
      color: #1a1a1a;
      display: block;
    }

    /* ═══ PATIENT BOX ═══ */
    .patient-box {
      border: 1px solid #9ca3af;
      border-radius: 8px;
      padding: 8px 14px;
      margin: 8px 0 6px 0;
      flex-shrink: 0;
    }
    .patient-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .patient-row:last-child { margin-bottom: 0; }
    .p-label {
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
    }
    .p-fill {
      border-bottom: 1px dotted #6b7280;
      flex: 1;
      min-width: 40px;
      height: 14px;
      display: inline-block;
      vertical-align: bottom;
      padding-right: 4px;
      font-size: 10.5px;
      color: #0b4d3c;
      font-weight: 600;
    }
    .p-fill-val {
      font-size: 10.5px;
      color: #0b4d3c;
      font-weight: 600;
      border-bottom: 1px dotted #6b7280;
      min-width: 30px;
      display: inline-block;
      vertical-align: bottom;
      height: 14px;
    }
    .sex-block {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-size: 11px;
      font-weight: 600;
    }
    .sex-opt {
      padding: 0 2px;
    }
    .sex-active {
      font-weight: 800;
      text-decoration: underline;
      color: #0b4d3c;
    }

    /* ═══ PRESCRIPTION FRAME ═══ */
    .rx-frame {
      border: 1.5px solid #0b4d3c;
      border-radius: 8px;
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      min-height: 0;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 38%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      opacity: 0.12;
    }

    /* Body columns */
    .rx-body {
      display: flex;
      flex: 1;
      position: relative;
      z-index: 1;
      min-height: 0;
    }
    .rx-left {
      flex: 7;
      padding: 10px 14px;
      border-right: 1.5px dashed #0b4d3c;
      display: flex;
      flex-direction: column;
    }
    .rx-right {
      flex: 3;
      padding: 10px;
      display: flex;
      flex-direction: column;
    }
    .rx-symbol {
      font-size: 30px;
      font-weight: 900;
      color: #0b4d3c;
      font-family: 'Times New Roman', Georgia, serif;
      line-height: 1;
      margin-bottom: 8px;
    }
    .advice-pill {
      background: #0b4d3c;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      padding: 3px 14px;
      border-radius: 14px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 10px;
      align-self: flex-end;
    }

    /* Med items */
    .med-item {
      margin-bottom: 6px;
      padding-bottom: 5px;
      border-bottom: 1px dotted #d1d5db;
    }
    .med-item:last-child { border-bottom: none; }
    .med-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .med-details {
      font-size: 10.5px;
      color: #374151;
      padding-left: 14px;
      margin-top: 2px;
    }
    .med-tag {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
      margin-right: 5px;
    }
    .med-tag-gray {
      display: inline-block;
      background: #f8fafc;
      color: #374151;
      border: 1px solid #cbd5e1;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
    }

    /* Tests below medicines in Rx section */
    .rx-tests-box {
      margin-top: 10px;
      padding-top: 7px;
      border-top: 1.5px dashed #0b4d3c;
    }
    .rx-tests-header {
      font-size: 9.5px;
      font-weight: 800;
      color: #0b4d3c;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rx-test-row {
      margin-bottom: 3px;
      padding-left: 2px;
      font-size: 10.5px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .rx-test-title {
      font-weight: 700;
      color: #0f172a;
    }
    .rx-test-note {
      font-size: 9.5px;
      color: #065f46;
      font-style: italic;
    }

    /* Advice sections */
    .adv-section { margin-bottom: 8px; }
    .adv-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0b4d3c;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    .adv-content { font-size: 10px; color: #1e293b; line-height: 1.3; }
    .followup-box {
      margin-top: auto;
      padding: 5px 7px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 5px;
      font-size: 9.5px;
      color: #166534;
      font-weight: 700;
    }

    /* Signature area */
    .sig-area {
      border-top: 1.5px solid #0b4d3c;
      padding: 10px 20px 8px 20px;
      display: flex;
      justify-content: flex-end;
      position: relative;
      z-index: 2;
      background: #fff;
      flex-shrink: 0;
    }
    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 140px;
    }
    .sig-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #374151;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .sig-line {
      border-bottom: 1.5px solid #374151;
      width: 140px;
      height: 1px;
      display: block;
    }

    /* ═══ FOOTER ═══ */
    .footer {
      background: #0b4d3c;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 6px 14px;
      border-radius: 4px;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .footer-icon {
      width: 32px;
      height: 32px;
      fill: none;
      stroke: #ffffff;
    }
    .footer-divider {
      width: 1px;
      height: 22px;
      background: rgba(255,255,255,0.4);
    }
    .footer-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #ffffff;
    }

    /* ═══ DISCLAIMER ═══ */
    .disclaimer {
      text-align: center;
      font-size: 8px;
      color: #6b7280;
      font-style: italic;
      margin-top: 3px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ════ HEADER ════ -->
  <div class="header">
    <div class="brand-left">
      <!-- Real RF Circular Badge SVG with curved text matching official logo -->
      <svg class="rf-badge-svg" viewBox="0 0 120 120" width="102" height="102">
        <defs>
          <path id="badgeTopPath" d="M 18,60 A 42,42 0 0,1 102,60" fill="none" />
          <path id="badgeBotPath" d="M 16,60 A 44,44 0 0,0 104,60" fill="none" />
        </defs>
        <!-- Background circle in official dark green -->
        <circle cx="60" cy="60" r="58" fill="#3b735f" />
        
        <!-- Curved top text: RUDRAKSH -->
        <text font-size="10.5" font-weight="900" fill="#ffffff" letter-spacing="3.2" font-family="'Arial Black', Impact, Arial, sans-serif">
          <textPath href="#badgeTopPath" startOffset="50%" text-anchor="middle">RUDRAKSH</textPath>
        </text>

        <!-- Left dot -->
        <circle cx="26" cy="60" r="2.6" fill="#ffffff" />

        <!-- Center: RF -->
        <text x="60" y="69" text-anchor="middle" font-size="30" font-weight="900" fill="#ffffff" font-family="'Arial Black', Impact, Arial, sans-serif" letter-spacing="1">RF</text>

        <!-- Right dot -->
        <circle cx="94" cy="60" r="2.6" fill="#ffffff" />

        <!-- Curved bottom text: FOUNDATION -->
        <text font-size="9.2" font-weight="900" fill="#ffffff" letter-spacing="2.6" font-family="'Arial Black', Impact, Arial, sans-serif">
          <textPath href="#badgeBotPath" startOffset="50%" text-anchor="middle">FOUNDATION</textPath>
        </text>
      </svg>

      <!-- Brand Name (Bigger & Prominent) -->
      <div class="brand-text">
        <div class="brand-name">RUDRAKSH</div>
        <div class="brand-tagline">
          <span class="brand-sub">FOUNDATION</span>
          <!-- Dual Leaf Icon matching official letterhead -->
          <svg class="leaf-svg" viewBox="0 0 40 28" fill="none">
            <path d="M8 24 C8 24 11 12 21 6 C26 3 30 1 30 1 C30 1 28 4 22 10 C16 16 11 22 8 24 Z" fill="#3ea03b"/>
            <path d="M12 21 C12 21 15 14 23 11 C28 9 32 8 32 8 C32 8 30 11 25 15 C20 19 15 21 12 21 Z" fill="#65bd48"/>
            <path d="M18 26 C18 26 21 15 31 8 C36 4 40 2 40 2 C40 2 38 6 32 12 C26 18 21 24 18 26 Z" fill="#3ea03b"/>
            <path d="M22 22 C22 22 25 15 33 12 C38 10 42 9 42 9 C42 9 40 12 35 16 C30 20 25 22 22 22 Z" fill="#65bd48"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Org Contact Details -->
    <div class="org-right">
      <div class="org-row">
        <svg class="org-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <div>
          <span class="org-label">Address :</span>
          <span class="org-val">Bamanpukur,<br>P. S Minakhan,<br>District North 24 parganas</span>
        </div>
      </div>
      <div class="org-row">
        <svg class="org-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <div>
          <span class="org-label">Landmark :</span>
          <span class="org-val">Bamanpukur Battala</span>
        </div>
      </div>
      <div class="org-row">
        <svg class="org-icon" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        <div>
          <span class="org-label">Contact No.</span>
          <span class="org-val-bold">9674363307</span>
        </div>
      </div>
      <div class="org-row">
        <svg class="org-icon" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <div>
          <span class="org-label">Email :</span>
          <span class="org-val">info@rfheka.com</span>
        </div>
      </div>
      <div class="org-row">
        <svg class="org-icon" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        <div>
          <span class="org-label">Registration No.</span>
          <span class="org-val">190101649/2025</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ════ PATIENT BOX ════ -->
  <div class="patient-box">
    <div class="patient-row">
      <span class="p-label">Name of Patient :</span>
      <span class="p-fill">${patientName}</span>
      <span class="p-label" style="margin-left:8px;">Age :</span>
      <span class="p-fill-val" style="min-width:55px;">${age}</span>
      <span class="p-label" style="margin-left:8px;">Sex :</span>
      <span class="sex-block">
        <span class="sex-opt ${isMale ? 'sex-active' : ''}">M</span> /
        <span class="sex-opt ${isFemale ? 'sex-active' : ''}">F</span> /
        <span class="sex-opt ${isOther ? 'sex-active' : ''}">O</span>
      </span>
    </div>
    <div class="patient-row">
      <span class="p-label">Date :</span>
      <span class="p-fill" style="max-width:120px;">${formattedDate}</span>
      <span class="p-label" style="margin-left:12px;">Contact No. :</span>
      <span class="p-fill" style="max-width:130px;">${phone}</span>
      <span class="p-label" style="margin-left:12px;">Weight</span>
      <span class="p-fill-val" style="min-width:60px;">${consultation?.patientWeight || ''}</span>
    </div>
    <div class="patient-row">
      <span class="p-label">Address :</span>
      <span class="p-fill">${address}</span>
    </div>
  </div>

  <!-- ════ PRESCRIPTION FRAME ════ -->
  <div class="rx-frame">

    <!-- RF Watermark matching image (circular RF badge style, large & faded) -->
    <div class="watermark">
      <svg viewBox="0 0 320 320" width="320" height="320">
        <!-- Outer ring -->
        <circle cx="160" cy="160" r="155" fill="none" stroke="#0b4d3c" stroke-width="18" opacity="0.9"/>
        <!-- Inner fill circle -->
        <circle cx="160" cy="160" r="137" fill="#0b4d3c" opacity="0.9"/>
        <!-- Top arc text: RUDRAKSH -->
        <path id="topArc" d="M 50,160 A 110,110 0 0,1 270,160" fill="none"/>
        <text font-size="26" font-weight="900" fill="#ffffff" letter-spacing="5" font-family="Arial,sans-serif">
          <textPath href="#topArc" startOffset="50%" text-anchor="middle">RUDRAKSH</textPath>
        </text>
        <!-- Left dot -->
        <circle cx="68" cy="160" r="7" fill="#ffffff"/>
        <!-- RF Center -->
        <text x="160" y="182" text-anchor="middle" font-size="75" font-weight="900" fill="#ffffff" font-family="'Arial Black',Arial,sans-serif" letter-spacing="4">RF</text>
        <!-- Right dot -->
        <circle cx="252" cy="160" r="7" fill="#ffffff"/>
        <!-- Bottom arc text: FOUNDATION -->
        <path id="botArc" d="M 46,160 A 114,114 0 0,0 274,160" fill="none"/>
        <text font-size="23" font-weight="900" fill="#ffffff" letter-spacing="5" font-family="Arial,sans-serif">
          <textPath href="#botArc" startOffset="50%" text-anchor="middle">FOUNDATION</textPath>
        </text>
      </svg>
    </div>

    <!-- Columns -->
    <div class="rx-body">
      <!-- Left: Rx -->
      <div class="rx-left">
        <div class="rx-symbol">R<sub style="font-size:18px;">x</sub></div>
        ${
          medicines.length > 0
            ? medicines.map((med, idx) => `
          <div class="med-item">
            <div class="med-name">${idx + 1}. ${med.medicineName || 'Medicine'}</div>
            <div class="med-details">
              <span class="med-tag">Dosage: ${med.dosage || 'As directed'}</span>
              <span class="med-tag-gray">Duration: ${med.duration || '—'}</span>
            </div>
          </div>
          `).join('')
            : `<div style="padding:10px 0;color:#9ca3af;font-style:italic;font-size:10px;">No medicines prescribed. Refer advice.</div>`
        }

        ${
          consultation?.tests && consultation.tests.length > 0
            ? `
          <div class="rx-tests-box">
            <div class="rx-tests-header">🔬 Recommended Tests / Investigations:</div>
            ${consultation.tests.map((t, idx) => `
              <div class="rx-test-row">
                <span class="rx-test-title">${idx + 1}. ${typeof t === 'string' ? t : (t.testName || t.name)}</span>
                ${t.notes ? `<span class="rx-test-note">(${t.notes})</span>` : ''}
              </div>
            `).join('')}
          </div>
          `
            : ''
        }
      </div>

      <!-- Right: Advice -->
      <div class="rx-right">
        <div class="advice-pill">ADVICE</div>
        ${consultation?.diagnosis ? `
        <div class="adv-section">
          <div class="adv-title">Diagnosis (Dx)</div>
          <div class="adv-content" style="font-weight:700;color:#0b4d3c;">${consultation.diagnosis}</div>
        </div>` : ''}
        ${consultation?.symptoms ? `
        <div class="adv-section">
          <div class="adv-title">Symptoms</div>
          <div class="adv-content">${consultation.symptoms}</div>
        </div>` : ''}
        ${consultation?.adviceNotes ? `
        <div class="adv-section">
          <div class="adv-title">Clinical Notes</div>
          <div class="adv-content">${consultation.adviceNotes}</div>
        </div>` : ''}
        ${followUpFormatted ? `
        <div class="followup-box">⏰ Follow-up: ${followUpFormatted}</div>` : ''}
      </div>
    </div>

    <!-- Signature Area -->
    <div class="sig-area">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Signature</div>
      </div>
    </div>
  </div>

  <!-- ════ FOOTER ════ -->
  <div class="footer">
    <!-- Heart in caring hands icon matching official letterhead -->
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <!-- Heart -->
      <path d="M24 34 C24 34 10 25 10 16 C10 11 14 8 18 9 C20 9.5 22 11 24 13 C26 11 28 9.5 30 9 C34 8 38 11 38 16 C38 25 24 34 24 34Z" fill="#ffffff"/>
      <!-- Caring hands around heart -->
      <path d="M8 38 C8 38 12 35 18 36 C20 36.5 22 38 24 38 C26 38 28 36.5 30 36 C36 35 40 38 40 38" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M4 42 C4 42 8 39 14 40 L18 41" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M44 42 C44 42 40 39 34 40 L30 41" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- ECG line inside heart area -->
      <path d="M14 18 L18 18 L20 14 L22 22 L24 16 L26 22 L28 18 L34 18" stroke="#0b4d3c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
    <div class="footer-divider"></div>
    <span class="footer-text">— RUDRAKSH FOUNDATION —</span>
  </div>

  <div class="disclaimer">This is a computer generated prescription</div>

</div>
</body>
</html>
  `;
};

/**
 * Print Prescription (opens native print preview)
 */
export const printPrescription = async (consultation) => {
  try {
    const html = generatePrescriptionHtml(consultation);
    await Print.printAsync({ html, width: 595, height: 842 });
  } catch (error) {
    console.error('Error printing prescription:', error);
    Alert.alert('Print Error', 'Could not open print dialog: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Generate PDF and open native share sheet (WhatsApp, Drive, Email, etc.)
 */
export const sharePrescriptionPdf = async (consultation) => {
  try {
    const html = generatePrescriptionHtml(consultation);
    const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: false });

    if (Platform.OS === 'web') {
      Alert.alert('PDF Generated', 'PDF generated successfully.');
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Prescription - ${consultation?.patientName || 'Patient'}`,
      });
    } else {
      Alert.alert('Sharing Unavailable', `PDF saved at: ${uri}`);
    }
  } catch (error) {
    console.error('Error generating/sharing PDF:', error);
    Alert.alert('PDF Error', 'Failed to generate PDF: ' + (error.message || 'Unknown error'));
  }
};
