import React from 'react';

const PrescriptionPdfModal = ({ consultation, onClose }) => {
  if (!consultation) return null;

  const patient = consultation.patientId || {};
  const patientName = consultation.patientName || patient.name || '';
  const age = patient.age ? `${patient.age} Yrs` : '';
  const gender = (patient.gender || '').toUpperCase();
  const phone = patient.phone || '';
  const address = patient.address || '';

  const formattedDate = consultation.createdAt
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

  const followUpFormatted = consultation.followUpDate
    ? new Date(consultation.followUpDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const medicines = consultation.prescription || [];
  const isMale = gender.startsWith('M');
  const isFemale = gender.startsWith('F');
  const isOther = !isMale && !isFemale && gender.length > 0;

  const handlePrint = () => {
    window.print();
  };

  /* ─── Shared sub-components for the prescription card ─── */
  const RfBadge = () => (
    <svg viewBox="0 0 120 120" width="102" height="102" style={{ flexShrink: 0 }}>
      <defs>
        <path id="modalBadgeTop" d="M 18,60 A 42,42 0 0,1 102,60" fill="none" />
        <path id="modalBadgeBot" d="M 16,60 A 44,44 0 0,0 104,60" fill="none" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="#3b735f" />
      <text fontSize="10.5" fontWeight="900" fill="#ffffff" letterSpacing="3.2" fontFamily="'Arial Black', Impact, Arial, sans-serif">
        <textPath href="#modalBadgeTop" startOffset="50%" textAnchor="middle">RUDRAKSH</textPath>
      </text>
      <circle cx="26" cy="60" r="2.6" fill="#ffffff" />
      <text x="60" y="69" textAnchor="middle" fontSize="30" fontWeight="900" fill="#ffffff" fontFamily="'Arial Black', Impact, Arial, sans-serif" letterSpacing="1">RF</text>
      <circle cx="94" cy="60" r="2.6" fill="#ffffff" />
      <text fontSize="9.2" fontWeight="900" fill="#ffffff" letterSpacing="2.6" fontFamily="'Arial Black', Impact, Arial, sans-serif">
        <textPath href="#modalBadgeBot" startOffset="50%" textAnchor="middle">FOUNDATION</textPath>
      </text>
    </svg>
  );

  const LeafSvg = ({ size = 34 }) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none" style={{ flexShrink: 0 }}>
      <path d="M8 24 C8 24 11 12 21 6 C26 3 30 1 30 1 C30 1 28 4 22 10 C16 16 11 22 8 24 Z" fill="#3ea03b"/>
      <path d="M12 21 C12 21 15 14 23 11 C28 9 32 8 32 8 C32 8 30 11 25 15 C20 19 15 21 12 21 Z" fill="#65bd48"/>
      <path d="M18 26 C18 26 21 15 31 8 C36 4 40 2 40 2 C40 2 38 6 32 12 C26 18 21 24 18 26 Z" fill="#3ea03b"/>
      <path d="M22 22 C22 22 25 15 33 12 C38 10 42 9 42 9 C42 9 40 12 35 16 C30 20 25 22 22 22 Z" fill="#65bd48"/>
    </svg>
  );

  const OrgDetails = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px', color: '#1a1a1a', maxWidth: '200px', borderLeft: '1px solid #d1d5db', paddingLeft: '10px' }}>
      {[
        {
          icon: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>,
          label: 'Address :', value: 'Bamanpukur,\nP. S Minakhan,\nDistrict North 24 parganas'
        },
        {
          icon: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>,
          label: 'Landmark :', value: 'Bamanpukur Battala'
        },
        {
          icon: <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>,
          label: 'Contact No.', value: '9674363307', bold: true
        },
        {
          icon: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>,
          label: 'Email :', value: 'info@rfheka.com'
        },
        {
          icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>,
          label: 'Registration No.', value: '190101649/2025'
        },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', lineHeight: 1.3 }}>
          <svg style={{ width: '14px', height: '14px', fill: '#0b4d3c', flexShrink: 0, marginTop: '1px' }} viewBox="0 0 24 24">{item.icon}</svg>
          <div>
            <span style={{ fontWeight: 700, color: '#0b4d3c', display: 'block' }}>{item.label}</span>
            <span style={{ fontWeight: item.bold ? 900 : 400, fontSize: item.bold ? '14px' : '10.5px', color: '#1a1a1a', display: 'block', whiteSpace: 'pre-line' }}>{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const WatermarkSvg = () => (
    <svg viewBox="0 0 320 320" width="320" height="320">
      <circle cx="160" cy="160" r="155" fill="none" stroke="#0b4d3c" strokeWidth="18"/>
      <circle cx="160" cy="160" r="137" fill="#0b4d3c"/>
      <path id="topArcPrev" d="M 50,160 A 110,110 0 0,1 270,160" fill="none"/>
      <text fontSize="26" fontWeight="900" fill="#ffffff" letterSpacing="5" fontFamily="Arial,sans-serif">
        <textPath href="#topArcPrev" startOffset="50%" textAnchor="middle">RUDRAKSH</textPath>
      </text>
      <circle cx="68" cy="160" r="7" fill="#ffffff"/>
      <text x="160" y="182" textAnchor="middle" fontSize="75" fontWeight="900" fill="#ffffff" fontFamily="Arial Black,Arial,sans-serif" letterSpacing="4">RF</text>
      <circle cx="252" cy="160" r="7" fill="#ffffff"/>
      <path id="botArcPrev" d="M 46,160 A 114,114 0 0,0 274,160" fill="none"/>
      <text fontSize="23" fontWeight="900" fill="#ffffff" letterSpacing="5" fontFamily="Arial,sans-serif">
        <textPath href="#botArcPrev" startOffset="50%" textAnchor="middle">FOUNDATION</textPath>
      </text>
    </svg>
  );

  const FooterIcon = () => (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <path d="M24 34 C24 34 10 25 10 16 C10 11 14 8 18 9 C20 9.5 22 11 24 13 C26 11 28 9.5 30 9 C34 8 38 11 38 16 C38 25 24 34 24 34Z" fill="#ffffff"/>
      <path d="M8 38 C8 38 12 35 18 36 C20 36.5 22 38 24 38 C26 38 28 36.5 30 36 C36 35 40 38 40 38" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M4 42 C4 42 8 39 14 40 L18 41" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M44 42 C44 42 40 39 34 40 L30 41" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 18 L18 18 L20 14 L22 22 L24 16 L26 22 L28 18 L34 18" stroke="#0b4d3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ─── The actual prescription card (reused in preview + print) ─── */
  const PrescriptionCard = ({ printMode = false }) => (
    <div style={{
      width: '100%',
      ...(printMode ? { height: '100%' } : {}),
      padding: '20px 24px 14px 24px',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
      fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
      fontSize: '11px',
      color: '#1a1a1a',
      ...(printMode ? { pageBreakInside: 'avoid', breakInside: 'avoid', overflow: 'hidden' } : {}),
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '2px solid #0b4d3c', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <RfBadge />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '54px', fontWeight: 900, color: '#0b4534', lineHeight: 0.90, letterSpacing: '0.5px', fontFamily: "'Arial Black', Impact, 'Segoe UI', Arial, sans-serif" }}>RUDRAKSH</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#0b4534', letterSpacing: '7px', textTransform: 'uppercase', fontFamily: "'Arial Black', Arial, sans-serif" }}>FOUNDATION</span>
              <LeafSvg size={40} />
            </div>
          </div>
        </div>
        <OrgDetails />
      </div>

      {/* PATIENT BOX */}
      <div style={{ border: '1px solid #9ca3af', borderRadius: '8px', padding: '8px 14px', margin: '8px 0 6px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px', fontSize: '11px' }}>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Name of Patient :</span>
          <span style={{ borderBottom: '1px dotted #6b7280', flex: 1, minWidth: '40px', height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{patientName}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>Age :</span>
          <span style={{ borderBottom: '1px dotted #6b7280', minWidth: '55px', height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{age}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>Sex :</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontWeight: 600, fontSize: '11px' }}>
            <span style={{ padding: '0 2px', ...(isMale ? { fontWeight: 800, textDecoration: 'underline', color: '#0b4d3c' } : {}) }}>M</span> /
            <span style={{ padding: '0 2px', ...(isFemale ? { fontWeight: 800, textDecoration: 'underline', color: '#0b4d3c' } : {}) }}>F</span> /
            <span style={{ padding: '0 2px', ...(isOther ? { fontWeight: 800, textDecoration: 'underline', color: '#0b4d3c' } : {}) }}>O</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px', fontSize: '11px' }}>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Date :</span>
          <span style={{ borderBottom: '1px dotted #6b7280', maxWidth: '120px', minWidth: '80px', height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{formattedDate}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '12px' }}>Contact No. :</span>
          <span style={{ borderBottom: '1px dotted #6b7280', maxWidth: '130px', minWidth: '80px', height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{phone}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '12px' }}>Weight</span>
          <span style={{ borderBottom: '1px dotted #6b7280', minWidth: '60px', height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{consultation.patientWeight || ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', fontSize: '11px' }}>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Address :</span>
          <span style={{ borderBottom: '1px dotted #6b7280', flex: 1, height: '14px', display: 'inline-block', verticalAlign: 'bottom', fontSize: '10.5px', color: '#0b4d3c', fontWeight: 600 }}>{address}</span>
        </div>
      </div>

      {/* PRESCRIPTION FRAME */}
      <div style={{ border: '1.5px solid #0b4d3c', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...(printMode ? { minHeight: 0 } : { minHeight: '320px' }) }}>
        {/* Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '38%', transform: 'translate(-50%, -50%)', opacity: 0.12, zIndex: 0, pointerEvents: 'none' }}>
          <WatermarkSvg />
        </div>

        {/* Columns */}
        <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 1, minHeight: 0 }}>
          {/* Left: Rx */}
          <div style={{ flex: 7, padding: '10px 14px', borderRight: '1.5px dashed #0b4d3c', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0b4d3c', fontFamily: 'Times New Roman, Georgia, serif', lineHeight: 1, marginBottom: '8px' }}>
              R<sub style={{ fontSize: '18px' }}>x</sub>
            </div>
            {medicines.length > 0 ? medicines.map((med, idx) => (
              <div key={idx} style={{ marginBottom: '6px', paddingBottom: '5px', borderBottom: '1px dotted #d1d5db' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{idx + 1}. {med.medicineName}</div>
                <div style={{ fontSize: '10.5px', color: '#374151', paddingLeft: '14px', marginTop: '2px' }}>
                  <span style={{ display: 'inline-block', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '1px 5px', borderRadius: '3px', fontWeight: 600, marginRight: '5px' }}>Dosage: {med.dosage}</span>
                  <span style={{ display: 'inline-block', background: '#f8fafc', color: '#374151', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>Duration: {med.duration}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '10px 0', color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>No medicines prescribed. Refer advice.</div>
            )}

            {consultation.tests && consultation.tests.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '7px', borderTop: '1.5px dashed #0b4d3c' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0b4d3c', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  🔬 Recommended Tests / Investigations:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '2px' }}>
                  {consultation.tests.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '10.5px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{idx + 1}. {typeof t === 'string' ? t : (t.testName || t.name)}</span>
                      {t.notes && <span style={{ fontSize: '9.5px', color: '#065f46', fontStyle: 'italic' }}>({t.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Advice */}
          <div style={{ flex: 3, padding: '10px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ alignSelf: 'flex-end', background: '#0b4d3c', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '3px 14px', borderRadius: '14px', textTransform: 'uppercase', marginBottom: '10px' }}>ADVICE</div>
            {consultation.diagnosis && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#0b4d3c', letterSpacing: '0.5px', marginBottom: '1px' }}>Diagnosis (Dx)</div>
                <div style={{ fontSize: '10px', color: '#0b4d3c', fontWeight: 700 }}>{consultation.diagnosis}</div>
              </div>
            )}
            {consultation.symptoms && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#0b4d3c', letterSpacing: '0.5px', marginBottom: '1px' }}>Symptoms</div>
                <div style={{ fontSize: '10px', color: '#1e293b' }}>{consultation.symptoms}</div>
              </div>
            )}
            {consultation.adviceNotes && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#0b4d3c', letterSpacing: '0.5px', marginBottom: '1px' }}>Clinical Notes</div>
                <div style={{ fontSize: '10px', color: '#1e293b' }}>{consultation.adviceNotes}</div>
              </div>
            )}
            {followUpFormatted && (
              <div style={{ marginTop: 'auto', padding: '5px 7px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '5px', fontSize: '9.5px', color: '#166534', fontWeight: 700 }}>
                ⏰ Follow-up: {followUpFormatted}
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        <div style={{ borderTop: '1.5px solid #0b4d3c', padding: '10px 20px 8px 20px', display: 'flex', justifyContent: 'flex-end', background: '#fff', position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
            <div style={{ borderBottom: '1.5px solid #374151', width: '140px', height: '1px', display: 'block' }}></div>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#374151', letterSpacing: '0.5px', marginTop: '4px' }}>Signature</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#0b4d3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '6px 14px', borderRadius: '4px', marginTop: '5px', flexShrink: 0 }}>
        <FooterIcon />
        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.4)' }}></div>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase' }}>— RUDRAKSH FOUNDATION —</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '8px', color: '#6b7280', fontStyle: 'italic', marginTop: '3px', flexShrink: 0 }}>
        This is a computer generated prescription
      </div>
    </div>
  );

  return (
    <>
      {/* Modal Overlay Preview */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-print">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh]">
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Prescription Preview</h2>
              <p className="text-sm text-slate-500 mt-0.5">Rudraksh Foundation Prescription</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#0b4d3c] text-white text-sm font-semibold rounded-lg hover:bg-[#0a3d2f] transition-colors"
              >
                🖨️ Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors text-xl font-light"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
            <div className="bg-white w-full max-w-[760px] rounded-lg shadow-md border border-slate-200 overflow-hidden">
              <PrescriptionCard printMode={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Printable Container */}
      <div id="printable-prescription" style={{ display: 'none' }}>
        <PrescriptionCard printMode={true} />
      </div>
    </>
  );
};

export default PrescriptionPdfModal;
