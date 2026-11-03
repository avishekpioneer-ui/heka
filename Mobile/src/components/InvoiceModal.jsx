import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import {
  numberToWordsINR,
  getInvoiceLineItems,
  formatINR,
  formatBillId,
  printInvoice,
  shareInvoicePdf,
} from '../utils/billingInvoicePdf';

const { width } = Dimensions.get('window');

export default function InvoiceModal({ visible, bill, onClose }) {
  if (!visible || !bill) return null;

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

  const subtotal = parseFloat(bill.subtotal || items.reduce((acc, it) => acc + (it.amount || 0), 0) + (parseFloat(bill.discount || 0)));
  const discountVal = parseFloat(bill.discount || 0);
  const discountAmt = bill.discountType === 'percentage'
    ? (subtotal * discountVal) / 100
    : discountVal;
  const totalAmount = parseFloat(bill.totalAmount !== undefined ? bill.totalAmount : Math.max(0, subtotal - discountAmt));
  const amountWords = numberToWordsINR(totalAmount);

  // At least 6-10 rows to maintain aesthetic form proportions
  const totalRows = Math.max(8, items.length);
  const rows = [];
  for (let i = 0; i < totalRows; i++) {
    const item = items[i];
    rows.push({
      slNo: `${i + 1}.`,
      description: item ? item.name : '',
      qty: item ? String(item.qty) : '',
      rate: item ? formatINR(item.rate) : '',
      amount: item ? formatINR(item.amount) : '',
      isEmpty: !item,
    });
  }

  const handleShareText = async () => {
    let itemsText = '';
    items.forEach((it, idx) => {
      itemsText += `${idx + 1}. ${it.name} | Qty: ${it.qty} | ₹${formatINR(it.amount)}\n`;
    });

    const text =
      `🧾 RUDRAKSH FOUNDATION - CASH MEMO / BILL\n` +
      `----------------------------------------\n` +
      `Bill ID  : ${billId}\n` +
      `Date     : ${billDate}\n` +
      `Status   : ${statusLabel}\n` +
      `Patient  : ${patientName}\n` +
      (patientPhone ? `Phone    : ${patientPhone}\n` : '') +
      `----------------------------------------\n` +
      itemsText +
      `----------------------------------------\n` +
      `Sub Total: ₹${formatINR(subtotal)}\n` +
      (discountAmt > 0 ? `Discount : -₹${formatINR(discountAmt)}\n` : '') +
      `TOTAL    : ₹${formatINR(totalAmount)}\n` +
      `Words    : ${amountWords}\n` +
      `----------------------------------------\n` +
      `We Care. We Serve. We Change Lives.`;

    try {
      await Share.share({ message: text });
    } catch (e) { }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>

          {/* Action Bar Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>🧾 Cash Memo / Bill</Text>
              <Text style={styles.modalHeaderSubtitle}>Official Receipt Preview</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Invoice Document Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* The Document Frame */}
            <View style={styles.billFrame}>

              {/* ═══ TOP HEADER ═══ */}
              <View style={styles.topHeader}>
                <View style={styles.brandRow}>
                  {/* RF Circle Badge */}
                  <View style={styles.rfBadge}>
                    <Text style={styles.rfBadgeTop}>RUDRAKSH</Text>
                    <Text style={styles.rfBadgeCenter}>RF</Text>
                    <Text style={styles.rfBadgeBottom}>FOUNDATION</Text>
                  </View>

                  <View style={styles.verticalSep} />

                  <View style={styles.brandTextCol}>
                    <Text style={styles.brandNameTitle}>RUDRAKSH</Text>
                    <Text style={styles.brandNameTitle}>FOUNDATION</Text>
                    <Text style={styles.brandTagline}>Compassion | Care | Community</Text>
                  </View>
                </View>

                <View style={styles.headerRightCol}>
                  <View style={styles.cashMemoPill}>
                    <Text style={styles.cashMemoPillText}>CASH MEMO / BILL</Text>
                  </View>
                  <Text style={styles.mobPhoneText}>📞 Mob: 9674363307</Text>
                </View>
              </View>

              <View style={styles.greenDivider} />

              {/* ═══ OFFICE INFO & BILL META ═══ */}
              <View style={styles.metaRow}>
                <View style={styles.officeInfoCol}>
                  <Text style={styles.infoLine}>📍 <Text style={styles.infoBold}>Head Office :</Text> 82/39, Prince Gulam Hussain Shah Road, Kolkata 700032.</Text>
                  <Text style={styles.infoLine}>✉️ <Text style={styles.infoBold}>Email:</Text> info@rfheka.com</Text>
                  <Text style={styles.infoLine}>🌐 www.rfheka.com</Text>
                </View>

                <View style={styles.billMetaCol}>
                  <View style={styles.metaFieldRow}>
                    <Text style={styles.metaFieldLbl}>Bill ID</Text>
                    <Text style={styles.metaFieldColon}>:</Text>
                    <Text style={styles.metaFieldVal} numberOfLines={1}>{billId}</Text>
                  </View>
                  <View style={styles.metaFieldRow}>
                    <Text style={styles.metaFieldLbl}>Date</Text>
                    <Text style={styles.metaFieldColon}>:</Text>
                    <Text style={styles.metaFieldVal}>{billDate}</Text>
                  </View>
                  <View style={[styles.metaFieldRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.metaFieldLbl}>Status</Text>
                    <Text style={styles.metaFieldColon}>:</Text>
                    <View style={[styles.statusBadge, isPaid ? styles.statusPaidBadge : styles.statusPendingBadge]}>
                      <Text style={[styles.statusBadgeText, isPaid ? styles.statusPaidText : styles.statusPendingText]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ═══ BILL TO & PAYMENT DETAILS ═══ */}
              <View style={styles.partyRow}>
                {/* BILL TO */}
                <View style={styles.billToBox}>
                  <View style={styles.billToHeader}>
                    <Text style={styles.billToHeaderText}>BILL TO :</Text>
                  </View>
                  <View style={styles.billToBody}>
                    <View style={styles.partyField}>
                      <Text style={styles.partyLbl}>Patient</Text>
                      <Text style={styles.partyColon}>:</Text>
                      <Text style={[styles.partyVal, styles.partyBold]}>{patientName}</Text>
                    </View>
                    <View style={styles.partyField}>
                      <Text style={styles.partyLbl}>Address</Text>
                      <Text style={styles.partyColon}>:</Text>
                      <Text style={[styles.partyVal, styles.partyUnderline]}>{patientAddress}</Text>
                    </View>
                    <View style={styles.partyField}>
                      <Text style={styles.partyLbl}>Mobile No.</Text>
                      <Text style={styles.partyColon}>:</Text>
                      <Text style={[styles.partyVal, styles.partyBold]}>{patientPhone || 'N/A'}</Text>
                    </View>
                  </View>
                </View>

                {/* PAYMENT DETAILS */}
                <View style={styles.paymentBox}>
                  <Text style={styles.paymentBoxTitle}>PAYMENT DETAILS :</Text>
                  <View style={styles.checkboxRow}>
                    <Text style={styles.checkItemText}>
                      {isCash ? '☑' : '☐'} Cash
                    </Text>
                    <Text style={styles.checkItemText}>
                      {isUpi ? '☑' : '☐'} UPI
                    </Text>
                    <Text style={styles.checkItemText}>
                      {isBank ? '☑' : '☐'} Bank
                    </Text>
                    <Text style={styles.checkItemText}>
                      {isOther ? '☑' : '☐'} Other
                    </Text>
                  </View>
                  <View style={styles.wordsBlankContainer}>
                    <Text style={styles.wordsBlankLbl}>Amount in Words :</Text>
                    <View style={styles.wordsBlankLine} />
                  </View>
                </View>
              </View>

              {/* ═══ LINE ITEMS TABLE ═══ */}
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, styles.colSl]}>SL. NO.</Text>
                  <Text style={[styles.thText, styles.colDesc]}>PARTICULARS / DESCRIPTION</Text>
                  <Text style={[styles.thText, styles.colQty]}>QTY.</Text>
                  <Text style={[styles.thText, styles.colRate]}>RATE (₹)</Text>
                  <Text style={[styles.thText, styles.colAmount]}>AMOUNT (₹)</Text>
                </View>

                {/* Table Rows */}
                {rows.map((r, idx) => (
                  <View
                    key={`inv-row-${idx}`}
                    style={[
                      styles.tableRow,
                      idx === rows.length - 1 && styles.tableRowLast,
                      r.isEmpty && styles.tableRowEmpty,
                    ]}
                  >
                    <Text style={[styles.tdText, styles.colSl]}>{r.slNo}</Text>
                    <Text style={[styles.tdText, styles.colDesc]} numberOfLines={1}>{r.description}</Text>
                    <Text style={[styles.tdText, styles.colQty]}>{r.qty}</Text>
                    <Text style={[styles.tdText, styles.colRate]}>{r.rate}</Text>
                    <Text style={[styles.tdText, styles.colAmount, styles.tdBold]}>{r.amount}</Text>
                  </View>
                ))}
              </View>

              {/* ═══ SUMMARY & TOTALS ═══ */}
              <View style={styles.summarySection}>
                {/* Left Thank You */}
                <View style={styles.thankYouCol}>
                  <Text style={styles.thankYouIcon}>🖩</Text>
                  <Text style={styles.thankYouText}>
                    Thank you for your support. Your contribution helps us serve better and build a healthier community.
                  </Text>
                </View>

                {/* Middle Words */}
                <View style={styles.wordsCol}>
                  <Text style={styles.wordsLabel}>
                    Amount in Words : <Text style={styles.wordsValue}>{amountWords}</Text>
                  </Text>
                </View>

                {/* Right Totals */}
                <View style={styles.totalsCol}>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalLbl}>SUB TOTAL</Text>
                    <Text style={styles.totalCurr}>₹</Text>
                    <Text style={styles.totalVal}>{formatINR(subtotal)}</Text>
                  </View>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalLbl}>DISCOUNT</Text>
                    <Text style={styles.totalCurr}>₹</Text>
                    <Text style={styles.totalVal}>{formatINR(discountAmt)}</Text>
                  </View>
                  <View style={[styles.totalsRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLbl}>TOTAL AMOUNT</Text>
                    <Text style={styles.grandTotalCurr}>₹</Text>
                    <Text style={styles.grandTotalVal}>{formatINR(totalAmount)}</Text>
                  </View>
                </View>
              </View>

              {/* ═══ SIGNATURES & DISCLAIMER ═══ */}
              <View style={styles.signRow}>
                <View style={styles.sigBlock}>
                  <View style={styles.sigSpace} />
                  <Text style={styles.sigTitle}>Authorized Signatory</Text>
                  <Text style={styles.sigSub}>(For Rudraksh Foundation)</Text>
                </View>

                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerStar}>✱</Text>
                  <Text style={styles.disclaimerMsg}>
                    <Text style={styles.disclaimerMsgRed}>Disclaimer : </Text>
                    The bill is issued for our official purpose only. If any inconvenience occur that will not be under the jurisdiction of BNS.
                  </Text>
                </View>

                <View style={styles.sigBlock}>
                  <View style={styles.sigSpace} />
                  <Text style={styles.sigTitle}>Receiver's Signature</Text>
                </View>
              </View>

              {/* ═══ FOOTER ═══ */}
              <View style={styles.footerRow}>
                <Text style={styles.footerBrand}>💚 We Care. We Serve. We Change Lives.</Text>
                <Text style={styles.footerPowered}>Powered by <Text style={{ fontWeight: '900' }}>HEKA</Text> ⚕️</Text>
              </View>

            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.actionButtonBar}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.printActionBtn]}
              onPress={() => printInvoice(bill)}
              activeOpacity={0.8}
            >
              <Text style={styles.printActionBtnText}>🖨️ Print Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.sharePdfActionBtn]}
              onPress={() => shareInvoicePdf(bill)}
              activeOpacity={0.8}
            >
              <Text style={styles.sharePdfActionBtnText}>📄 Share PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareTextActionBtn]}
              onPress={handleShareText}
              activeOpacity={0.8}
            >
              <Text style={styles.shareTextActionBtnText}>📤 Share Text</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  scrollContent: {
    padding: 10,
  },

  /* ═══ THE BILL SHEET ═══ */
  billFrame: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#01563f',
    borderRadius: 8,
    padding: 12,
    minWidth: 330,
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rfBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#01563f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  rfBadgeTop: {
    fontSize: 6,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  rfBadgeCenter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 20,
  },
  rfBadgeBottom: {
    fontSize: 5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  verticalSep: {
    width: 2,
    height: 48,
    backgroundColor: '#01563f',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandNameTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#01563f',
    lineHeight: 18,
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#01563f',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  headerRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cashMemoPill: {
    backgroundColor: '#01563f',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  cashMemoPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mobPhoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  greenDivider: {
    height: 1.5,
    backgroundColor: '#01563f',
    marginVertical: 8,
  },

  /* Office info & Bill Meta */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  officeInfoCol: {
    flex: 1.2,
    gap: 2,
  },
  infoLine: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 13,
  },
  infoBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  billMetaCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    backgroundColor: '#f8fafc',
  },
  metaFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metaFieldLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    width: 48,
  },
  metaFieldColon: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    marginRight: 4,
  },
  metaFieldVal: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.3,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusPendingBadge: {
    backgroundColor: '#fee2e2',
  },
  statusPaidBadge: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  statusPendingText: {
    color: '#dc2626',
  },
  statusPaidText: {
    color: '#16a34a',
  },

  /* Party Row (BILL TO & PAYMENT DETAILS) */
  partyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  billToBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#01563f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  billToHeader: {
    backgroundColor: '#01563f',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },
  billToHeaderText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  billToBody: {
    padding: 6,
    gap: 3,
  },
  partyField: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  partyLbl: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#475569',
    width: 52,
  },
  partyColon: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#475569',
    marginRight: 4,
  },
  partyVal: {
    fontSize: 8.5,
    color: '#0f172a',
    flex: 1,
  },
  partyBold: {
    fontWeight: '800',
  },
  partyUnderline: {
    textDecorationLine: 'underline',
  },
  paymentBox: {
    flex: 1.1,
    borderWidth: 1.5,
    borderColor: '#01563f',
    borderRadius: 4,
    padding: 6,
    justifyContent: 'space-between',
  },
  paymentBoxTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#01563f',
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkItemText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#334155',
  },
  wordsBlankContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  wordsBlankLbl: {
    fontSize: 8,
    fontWeight: '600',
    color: '#475569',
  },
  wordsBlankLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#64748b',
    marginLeft: 4,
  },

  /* Line Items Table */
  table: {
    borderWidth: 1.5,
    borderColor: '#01563f',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#01563f',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  thText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    alignItems: 'center',
    minHeight: 19,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowEmpty: {
    opacity: 0.45,
  },
  tdText: {
    fontSize: 8.5,
    color: '#0f172a',
  },
  tdBold: {
    fontWeight: '700',
  },

  /* Table Columns */
  colSl: { width: '8%', textAlign: 'center' },
  colDesc: { width: '52%', textAlign: 'left', paddingHorizontal: 2 },
  colQty: { width: '10%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right', paddingRight: 4 },
  colAmount: { width: '15%', textAlign: 'right' },

  /* Summary Section */
  summarySection: {
    flexDirection: 'row',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#01563f',
  },
  thankYouCol: {
    width: '30%',
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1.5,
    borderRightColor: '#01563f',
  },
  thankYouIcon: {
    fontSize: 14,
  },
  thankYouText: {
    fontSize: 6.5,
    lineHeight: 8.5,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  wordsCol: {
    width: '38%',
    padding: 6,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#01563f',
  },
  wordsLabel: {
    fontSize: 8,
    color: '#1e293b',
  },
  wordsValue: {
    fontWeight: '800',
    color: '#01563f',
  },
  totalsCol: {
    width: '32%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  totalLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: '#475569',
    width: '55%',
  },
  totalCurr: {
    fontSize: 8,
    fontWeight: '700',
    color: '#475569',
  },
  totalVal: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  grandTotalRow: {
    backgroundColor: '#01563f',
    borderBottomWidth: 0,
    paddingVertical: 3.5,
  },
  grandTotalLbl: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    width: '55%',
  },
  grandTotalCurr: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  grandTotalVal: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'right',
  },

  /* Signatures & Disclaimer */
  signRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sigBlock: {
    alignItems: 'center',
    width: '26%',
  },
  sigSpace: {
    height: 16,
  },
  sigTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  sigSub: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
  },
  disclaimerCard: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: '#fff7ed',
  },
  disclaimerStar: {
    fontSize: 10,
    color: '#ef4444',
  },
  disclaimerMsg: {
    fontSize: 6.5,
    lineHeight: 8.5,
    color: '#334155',
    flex: 1,
  },
  disclaimerMsgRed: {
    color: '#dc2626',
    fontWeight: '800',
  },

  /* Footer */
  footerRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#01563f',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerBrand: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#01563f',
  },
  footerDivider: {
    fontSize: 7.5,
    color: '#94a3b8',
  },
  footerMid: {
    fontSize: 7,
    color: '#475569',
  },
  footerPowered: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#01563f',
  },

  /* Action Buttons Bar */
  actionButtonBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printActionBtn: {
    backgroundColor: '#01563f',
  },
  printActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sharePdfActionBtn: {
    backgroundColor: '#0284c7',
  },
  sharePdfActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  shareTextActionBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  shareTextActionBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});

