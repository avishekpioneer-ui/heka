import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'];

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const OpdAccounts = () => {
  const userId = localStorage.getItem('userId');
  const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001';

  // Navigation / Date States
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'overview'

  // Payroll States
  const [salariesData, setSalariesData] = useState({ totals: {}, salaries: [], unGeneratedCount: 0, allGenerated: false });
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollFilterStatus, setPayrollFilterStatus] = useState('ALL');

  // Financial Summary States
  const [financialSummary, setFinancialSummary] = useState(null);

  // Modals
  const [activePaymentModal, setActivePaymentModal] = useState(null); // staff record object
  const [activeHistoryModal, setActiveHistoryModal] = useState(null); // staff record object
  const [activeEditAmountModal, setActiveEditAmountModal] = useState(null); // staff record object

  // Part Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Edit Month Salary & DOJ Form State
  const [monthSalaryAmount, setMonthSalaryAmount] = useState('');
  const [editStaffDoj, setEditStaffDoj] = useState('');
  const [updatePermanentBase, setUpdatePermanentBase] = useState(false);
  const [salaryAmountSubmitting, setSalaryAmountSubmitting] = useState(false);
  const [salaryAmountError, setSalaryAmountError] = useState('');

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (m === 1) {
      setSelectedMonth(`${y - 1}-12`);
    } else {
      const prevM = m - 1;
      setSelectedMonth(`${y}-${prevM < 10 ? '0' + prevM : prevM}`);
    }
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (m === 12) {
      setSelectedMonth(`${y + 1}-01`);
    } else {
      const nextM = m + 1;
      setSelectedMonth(`${y}-${nextM < 10 ? '0' + nextM : nextM}`);
    }
  };

  // Fetch Payroll Data
  const fetchSalaries = async () => {
    try {
      setLoadingPayroll(true);
      const res = await axios.get(`${backendUrl}/api/opd/accounts/salaries?month=${selectedMonth}`, {
        headers: { 'x-user-id': userId }
      });
      setSalariesData(res.data);
    } catch (err) {
      console.error('Error fetching salaries:', err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  // Fetch Financial Summary
  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/opd/accounts/summary?month=${selectedMonth}`, {
        headers: { 'x-user-id': userId }
      });
      setFinancialSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSalaries();
      fetchSummary();
    }
  }, [selectedMonth, userId]);

  // Admin click: Generate Salaries for Month
  const handleGenerateSalaries = async (targetStaffId = null) => {
    try {
      setGeneratingPayroll(true);
      const payload = { month: selectedMonth };
      if (targetStaffId) {
        payload.staffId = targetStaffId;
      }

      await axios.post(`${backendUrl}/api/opd/accounts/salaries/generate`, payload, {
        headers: { 'x-user-id': userId }
      });

      await fetchSalaries();
      await fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate salaries');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  // Open Edit Month Salary & DOJ Modal
  const openEditAmountModal = (staffItem) => {
    setActiveEditAmountModal(staffItem);
    setMonthSalaryAmount(staffItem.salary.baseSalary || staffItem.staff.baseSalary || 0);
    const dojDate = staffItem.staff.doj ? new Date(staffItem.staff.doj).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    setEditStaffDoj(dojDate);
    setUpdatePermanentBase(false);
    setSalaryAmountError('');
  };

  // Admin submit: Change Salary for any specific month & Date of Joining
  const handleSaveMonthSalaryAmount = async (e) => {
    e.preventDefault();
    if (!monthSalaryAmount || Number(monthSalaryAmount) < 0) {
      setSalaryAmountError('Please enter a valid salary amount.');
      return;
    }

    try {
      setSalaryAmountSubmitting(true);
      setSalaryAmountError('');

      // 1. Update Staff DOJ (and optionally permanent base salary)
      if (editStaffDoj) {
        await axios.put(
          `${backendUrl}/api/opd/accounts/staff/${activeEditAmountModal.staff._id}/profile`,
          {
            doj: editStaffDoj,
            baseSalary: updatePermanentBase ? parseFloat(monthSalaryAmount) : undefined
          },
          { headers: { 'x-user-id': userId } }
        );
      }

      // 2. Update or Generate Salary for this specific month
      if (activeEditAmountModal.isGenerated && activeEditAmountModal.salary._id) {
        // Update existing month salary
        await axios.put(
          `${backendUrl}/api/opd/accounts/salaries/${activeEditAmountModal.salary._id}/amount`,
          {
            amount: parseFloat(monthSalaryAmount),
            updatePermanentBase
          },
          { headers: { 'x-user-id': userId } }
        );
      } else {
        // Not generated yet: first generate for this staff, then update amount
        await axios.post(
          `${backendUrl}/api/opd/accounts/salaries/generate`,
          { month: selectedMonth, staffId: activeEditAmountModal.staff._id },
          { headers: { 'x-user-id': userId } }
        );

        // Update amount for this month
        const genSalaryRes = await axios.get(`${backendUrl}/api/opd/accounts/salaries?month=${selectedMonth}`, {
          headers: { 'x-user-id': userId }
        });
        const createdStaffSal = genSalaryRes.data?.salaries?.find(s => s.staff._id === activeEditAmountModal.staff._id);
        if (createdStaffSal?.salary?._id) {
          await axios.put(
            `${backendUrl}/api/opd/accounts/salaries/${createdStaffSal.salary._id}/amount`,
            { amount: parseFloat(monthSalaryAmount), updatePermanentBase },
            { headers: { 'x-user-id': userId } }
          );
        }
      }

      setActiveEditAmountModal(null);
      fetchSalaries();
      fetchSummary();
    } catch (err) {
      setSalaryAmountError(err.response?.data?.message || 'Failed to update salary amount.');
    } finally {
      setSalaryAmountSubmitting(false);
    }
  };

  // Open Part Payment Modal
  const openPaymentModal = (staffItem) => {
    setActivePaymentModal(staffItem);
    const existingParts = staffItem.salary?.payments?.length || 0;
    const defaultPartNumber = existingParts + 1;
    const remaining = staffItem.salary?.remainingBalance || 0;

    setPayAmount(remaining > 0 ? remaining.toString() : '');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMode('UPI');
    setPayRef('');
    setPayNote(`Part ${defaultPartNumber} Payment`);
    setPaymentError('');
    setPaymentSuccess('');
  };

  // Submit Part Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      setPaymentError('Please enter a valid payment amount greater than zero.');
      return;
    }

    try {
      setPaymentSubmitting(true);
      setPaymentError('');
      setPaymentSuccess('');

      await axios.post(
        `${backendUrl}/api/opd/accounts/salaries/payment`,
        {
          staffId: activePaymentModal.staff._id,
          month: selectedMonth,
          amount: parseFloat(payAmount),
          paymentDate: payDate,
          paymentMode: payMode,
          transactionId: payRef,
          notes: payNote
        },
        { headers: { 'x-user-id': userId } }
      );

      setPaymentSuccess('Installment payment recorded successfully!');
      setTimeout(() => {
        setActivePaymentModal(null);
        fetchSalaries();
        fetchSummary();
      }, 600);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record installment payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Delete an installment
  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to remove this installment record?')) return;
    try {
      await axios.delete(`${backendUrl}/api/opd/accounts/salaries/payment/${paymentId}`, {
        headers: { 'x-user-id': userId }
      });
      fetchSalaries();
      fetchSummary();
      if (activeHistoryModal) {
        setActiveHistoryModal((prev) => ({
          ...prev,
          salary: {
            ...prev.salary,
            payments: (prev.salary?.payments || []).filter((p) => p._id !== paymentId)
          }
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove installment');
    }
  };

  // Filtered Payroll list
  const filteredSalaries = useMemo(() => {
    return (salariesData.salaries || []).filter((item) => {
      const matchSearch =
        item.staff.name.toLowerCase().includes(payrollSearch.toLowerCase()) ||
        item.staff.roleName.toLowerCase().includes(payrollSearch.toLowerCase()) ||
        item.staff.email.toLowerCase().includes(payrollSearch.toLowerCase());

      const status = item.isGenerated ? item.salary.status.toUpperCase() : 'NOT GENERATED';
      const matchStatus =
        payrollFilterStatus === 'ALL' || status === payrollFilterStatus;

      return matchSearch && matchStatus;
    });
  }, [salariesData, payrollSearch, payrollFilterStatus]);

  return (
    <div className="min-h-full flex flex-col font-dmsans">
      {/* Top Header & Month Navigation */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-20 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-2 rounded-xl bg-teal-50 text-teal-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight font-literata">
                Accounts & Staff Payroll Ledger
              </h1>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Salary commences from Date of Joining (DOJ). Generate payroll per month with custom salary adjustments.
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-gray-200/80 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 hover:bg-white rounded-xl transition text-gray-600 hover:text-teal-700 shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="px-4 py-1 text-center min-w-[170px]">
              <span className="block text-xs uppercase font-bold tracking-wider text-teal-700">Billing Period</span>
              <span className="text-sm font-bold text-gray-900">{formatMonthDisplay(selectedMonth)}</span>
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 hover:bg-white rounded-xl transition text-gray-600 hover:text-teal-700 shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {selectedMonth !== currentMonthStr && (
              <button
                onClick={() => setSelectedMonth(currentMonthStr)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition shadow-sm cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-4 mt-6 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'payroll'
                ? 'text-teal-600 border-b-2 border-teal-500 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>👥 Staff Salaries & Installments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
              {salariesData.salaries?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-teal-600 border-b-2 border-teal-500 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📊 Revenue & Payroll Overview</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl mx-auto w-full flex-1">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Net Payroll */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Payroll Due</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold">Base ± Carry</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-literata">
              {formatINR(salariesData.totals?.totalPayable || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Generated payable for {formatMonthDisplay(selectedMonth)}</p>
          </div>

          {/* Total Paid in Installments */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Salary Disbursed</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">Parts Paid</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-literata">
              {formatINR(salariesData.totals?.totalPaid || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Paid across all parts this month</p>
          </div>

          {/* Pending / Arrears */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-md transition">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Balance</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-semibold">Carry Next Mo.</span>
            </div>
            <div className="text-2xl font-bold text-amber-600 font-literata">
              {formatINR(salariesData.totals?.totalPending || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Will carry forward to next month</p>
          </div>
        </div>

        {/* Action Callout: Generate Payroll for this Month */}
        {salariesData.unGeneratedCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-500/20">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-bold text-teal-950">
                  Payroll for {formatMonthDisplay(selectedMonth)} Ready to Generate
                </h4>
                <p className="text-xs text-teal-800">
                  {salariesData.unGeneratedCount} eligible staff member(s) joined on or before this month are pending salary initialization.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleGenerateSalaries()}
              disabled={generatingPayroll}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {generatingPayroll ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Payroll...</span>
                </>
              ) : (
                <>
                  <span>⚡ Generate Salaries for {formatMonthDisplay(selectedMonth)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 1: STAFF SALARY & INSTALLMENT PAYMENTS */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            {/* Action Bar & Filters */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <input
                    type="text"
                    value={payrollSearch}
                    onChange={(e) => setPayrollSearch(e.target.value)}
                    placeholder="Search staff name or role..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <span className="text-gray-400">Filter:</span>
                  {['ALL', 'NOT GENERATED', 'PENDING', 'PARTIALLY PAID', 'PAID', 'OVERPAID'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setPayrollFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        payrollFilterStatus === st
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500 font-medium">
                💡 <span className="font-semibold text-gray-700">Custom Salary:</span> Click the pencil ✏️ next to any month's salary to change the amount for that specific month.
              </div>
            </div>

            {/* Salaries Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] overflow-hidden">
              {loadingPayroll ? (
                <div className="py-20 text-center text-teal-600">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-sm font-semibold">Calculating salaries, DOJ eligibility & carry-overs...</p>
                </div>
              ) : filteredSalaries.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <span className="text-4xl block mb-2">🧑‍⚕️</span>
                  <p className="text-base font-semibold text-gray-700">No staff members eligible for {formatMonthDisplay(selectedMonth)}.</p>
                  <p className="text-xs text-gray-500 mt-1">Staff salary commences only from their Date of Joining (DOJ) month onwards.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-3.5 px-4">Staff Member</th>
                        <th className="py-3.5 px-4">Salary ({formatMonthDisplay(selectedMonth)})</th>
                        <th className="py-3.5 px-4">Previous Carry-Over</th>
                        <th className="py-3.5 px-4">Net Payable</th>
                        <th className="py-3.5 px-4">Disbursed (Parts)</th>
                        <th className="py-3.5 px-4">Remaining Balance</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredSalaries.map((item) => {
                        const { staff, salary, isGenerated } = item;
                        const payments = salary.payments || [];
                        const carry = salary.carriedOverBalance || 0;
                        const isUnderpaidCarry = carry > 0;
                        const dojFormatted = staff.doj ? new Date(staff.doj).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                        return (
                          <tr key={staff._id} className="hover:bg-teal-50/20 transition group">
                            {/* Staff Name & Info */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900">{staff.name}</div>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  staff.isDoctor ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {staff.roleName}
                                </span>
                                <span className="text-[11px] text-gray-400">DOJ: {dojFormatted}</span>
                              </div>
                            </td>

                            {/* Month Salary (with inline edit) */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">{formatINR(salary.baseSalary)}</span>
                                <button
                                  onClick={() => openEditAmountModal(item)}
                                  title={`Change salary amount for ${formatMonthDisplay(selectedMonth)}`}
                                  className="p-1 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-400 block mt-0.5">Click ✏️ to adjust</span>
                            </td>

                            {/* Carried Over Balance */}
                            <td className="py-4 px-4">
                              {carry === 0 ? (
                                <span className="inline-flex items-center text-xs text-gray-400 font-medium">
                                  ₹0 (Settled)
                                </span>
                              ) : isUnderpaidCarry ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                    +{formatINR(carry)}
                                  </span>
                                  <span className="block text-[10px] text-amber-800/80 font-medium mt-0.5">
                                    Unpaid Arrears Added
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                                    -{formatINR(Math.abs(carry))}
                                  </span>
                                  <span className="block text-[10px] text-purple-800/80 font-medium mt-0.5">
                                    Advance Deducted
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Net Payable with Formula */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900 text-base">{formatINR(salary.netPayable)}</div>
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {salary.baseSalary}
                                {carry > 0 ? ` + ${carry}` : carry < 0 ? ` - ${Math.abs(carry)}` : ''}
                              </div>
                            </td>

                            {/* Disbursed (Parts) */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-emerald-600">{formatINR(salary.totalPaid)}</div>
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <span className="font-semibold text-gray-700">{payments.length}</span>
                                <span>{payments.length === 1 ? 'part paid' : 'parts paid'}</span>
                              </div>
                            </td>

                            {/* Remaining Balance */}
                            <td className="py-4 px-4">
                              {salary.remainingBalance > 0 ? (
                                <span className="font-bold text-amber-600">{formatINR(salary.remainingBalance)} Due</span>
                              ) : salary.remainingBalance < 0 ? (
                                <span className="font-bold text-purple-600">Overpaid {formatINR(Math.abs(salary.remainingBalance))}</span>
                              ) : (
                                <span className="font-bold text-emerald-600">₹0 (Paid in Full)</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {!isGenerated ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  Not Generated
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                    salary.status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : salary.status === 'Partially Paid'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : salary.status === 'Overpaid'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {salary.status}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isGenerated ? (
                                  <button
                                    onClick={() => handleGenerateSalaries(staff._id)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition cursor-pointer flex items-center gap-1"
                                  >
                                    <span>⚡ Generate</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openPaymentModal(item)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-500 text-white hover:bg-teal-600 shadow-sm transition cursor-pointer flex items-center gap-1"
                                    >
                                      <span>+ Pay Part</span>
                                    </button>

                                    <button
                                      onClick={() => setActiveHistoryModal(item)}
                                      className="p-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-gray-700 hover:bg-slate-200 hover:text-teal-700 transition cursor-pointer"
                                      title="View Installment History & Slip"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FINANCIAL OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* OPD Revenue Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Cash Inflow</span>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">Revenue</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 font-literata mt-2">
                    {formatINR(financialSummary?.revenue?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    From <span className="font-semibold text-gray-700">{financialSummary?.revenue?.invoicesCount || 0}</span> settled patient invoices.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span>✓ Billed via OPD System</span>
                </div>
              </div>

              {/* Total Payroll Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Payroll Disbursed</span>
                    <span className="p-2 bg-teal-50 text-teal-600 rounded-xl text-xs font-semibold">Staff Salaries</span>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 font-literata mt-2">
                    {formatINR(financialSummary?.payroll?.totalSalariesPaid || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Disbursed across <span className="font-semibold text-gray-700">{financialSummary?.payroll?.paymentsCount || 0}</span> installments this month.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-teal-600 font-semibold flex items-center gap-1">
                  <span>↓ Total payroll disbursed</span>
                </div>
              </div>

              {/* Net Surplus Card */}
              <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-teal-300 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Net Operating Surplus</span>
                    <span className="px-2 py-1 bg-teal-800/80 rounded-lg text-xs font-bold">Inflow - Payroll</span>
                  </div>
                  <div className={`text-3xl font-bold font-literata mt-2 ${
                    (financialSummary?.netSummary?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formatINR(financialSummary?.netSummary?.netProfit || 0)}
                  </div>
                  <p className="text-xs text-teal-200/70 mt-2">
                    Net cash balance after paying staff salary installments for {formatMonthDisplay(selectedMonth)}.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-teal-800/60 text-xs text-teal-200">
                  Status: <span className="font-bold text-white">
                    {(financialSummary?.netSummary?.netProfit || 0) >= 0 ? 'Profitable (Net Positive)' : 'Deficit (Net Negative)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD PART SALARY PAYMENT                        */}
      {/* ======================================================== */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-literata">
                  Add Salary Installment (Part Payment)
                </h3>
                <p className="text-xs text-gray-500">
                  {activePaymentModal.staff.name} ({activePaymentModal.staff.roleName}) — {formatMonthDisplay(selectedMonth)}
                </p>
              </div>
              <button
                onClick={() => setActivePaymentModal(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Salary Ledger Summary */}
            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-gray-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Base Salary:</span>
                <span className="font-bold text-gray-800 text-sm">
                  {formatINR(activePaymentModal.salary.baseSalary)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Previous Carryover:</span>
                <span className={`font-bold text-sm ${
                  activePaymentModal.salary.carriedOverBalance > 0
                    ? 'text-amber-600'
                    : activePaymentModal.salary.carriedOverBalance < 0
                    ? 'text-purple-600'
                    : 'text-gray-600'
                }`}>
                  {activePaymentModal.salary.carriedOverBalance > 0 ? '+' : ''}
                  {formatINR(activePaymentModal.salary.carriedOverBalance)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Net Payable This Month:</span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatINR(activePaymentModal.salary.netPayable)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Already Paid:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatINR(activePaymentModal.salary.totalPaid)}
                </span>
              </div>
            </div>

            {/* Live Remaining Preview */}
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between text-xs">
              <span className="text-teal-800 font-semibold">Remaining Due Before Payment:</span>
              <span className="text-teal-900 font-bold text-sm">
                {formatINR(activePaymentModal.salary.remainingBalance)}
              </span>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
                {paymentError}
              </div>
            )}
            {paymentSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold">
                {paymentSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Payment Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-base"
                    placeholder="e.g. 4000"
                  />
                </div>
                {/* Quick amount shortcuts */}
                {activePaymentModal.salary.remainingBalance > 0 && (
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(activePaymentModal.salary.remainingBalance.toString())}
                      className="text-[11px] text-teal-600 font-semibold hover:underline cursor-pointer"
                    >
                      Fill Full Remaining ({formatINR(activePaymentModal.salary.remainingBalance)})
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setPayAmount((activePaymentModal.salary.remainingBalance / 2).toString())}
                      className="text-[11px] text-teal-600 font-semibold hover:underline cursor-pointer"
                    >
                      Half ({formatINR(activePaymentModal.salary.remainingBalance / 2)})
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Installment Title / Note
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Part 1 - 1st to 15th advance"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Transaction / Cheque / UTR ID (Optional)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-9988277261"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActivePaymentModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  {paymentSubmitting ? 'Recording...' : 'Confirm & Record Installment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INSTALLMENT HISTORY & SALARY SLIP               */}
      {/* ======================================================== */}
      {activeHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-literata">
                  Staff Salary Slip & Installment History
                </h3>
                <p className="text-xs text-gray-500">
                  {activeHistoryModal.staff.name} • {formatMonthDisplay(selectedMonth)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-gray-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  🖨️ Print Slip
                </button>
                <button
                  onClick={() => setActiveHistoryModal(null)}
                  className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {/* Slip Header Box */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-teal-800">Staff Details</span>
                  <div className="text-base font-bold text-gray-900">{activeHistoryModal.staff.name}</div>
                  <div className="text-xs text-gray-600">{activeHistoryModal.staff.roleName}</div>
                  <div className="text-xs text-gray-400">{activeHistoryModal.staff.email}</div>
                  <div className="text-[10px] text-teal-700 mt-1">DOJ: {new Date(activeHistoryModal.staff.doj).toLocaleDateString('en-IN')}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-teal-800">Month Ledger</span>
                  <div className="text-sm font-bold text-gray-900 font-mono">
                    Net Payable: {formatINR(activeHistoryModal.salary.netPayable)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Base: {formatINR(activeHistoryModal.salary.baseSalary)} | Carry: {activeHistoryModal.salary.carriedOverBalance > 0 ? '+' : ''}{formatINR(activeHistoryModal.salary.carriedOverBalance)}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 mt-1">
                    Total Paid: {formatINR(activeHistoryModal.salary.totalPaid)}
                  </div>
                </div>
              </div>

              {/* Installments Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Part-by-Part Payments Recorded
                </h4>

                {(!activeHistoryModal.salary?.payments || activeHistoryModal.salary.payments.length === 0) ? (
                  <div className="p-6 text-center text-gray-400 bg-slate-50 rounded-2xl border border-gray-100 text-xs">
                    No installments paid yet for this month.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-gray-500 font-bold uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Part #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Notes / Ref</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeHistoryModal.salary.payments.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-teal-700">
                              Part {p.partNumber}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-gray-700">
                                {p.paymentMode}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              <div>{p.notes || '—'}</div>
                              {p.transactionId && <div className="text-[10px] text-gray-400 font-mono">{p.transactionId}</div>}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600">
                              {formatINR(p.amount)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeletePayment(p._id)}
                                className="text-red-500 hover:text-red-700 cursor-pointer text-xs"
                                title="Delete this installment"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Carryover Impact Preview */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900">
                <span className="font-bold block mb-1">🔮 Next Month Carry-Over Impact:</span>
                {activeHistoryModal.salary.remainingBalance > 0 ? (
                  <p>
                    Remaining balance of <strong>{formatINR(activeHistoryModal.salary.remainingBalance)}</strong> will carry forward as <strong>+{formatINR(activeHistoryModal.salary.remainingBalance)} unpaid arrears</strong> to next month's salary.
                  </p>
                ) : activeHistoryModal.salary.remainingBalance < 0 ? (
                  <p>
                    Overpayment of <strong>{formatINR(Math.abs(activeHistoryModal.salary.remainingBalance))}</strong> will carry forward as <strong>-{formatINR(Math.abs(activeHistoryModal.salary.remainingBalance))} advance deduction</strong> in next month's salary.
                  </p>
                ) : (
                  <p>Salary for this month is fully settled with ₹0 carry-over.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setActiveHistoryModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CHANGE SALARY AMOUNT FOR ANY SPECIFIC MONTH     */}
      {/* ======================================================== */}
      {activeEditAmountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 font-literata mb-1">
              Adjust Salary for {formatMonthDisplay(selectedMonth)}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Set custom salary amount for <strong>{activeEditAmountModal.staff.name}</strong> for {formatMonthDisplay(selectedMonth)}.
            </p>

            {salaryAmountError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
                {salaryAmountError}
              </div>
            )}

            <form onSubmit={handleSaveMonthSalaryAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Salary for {formatMonthDisplay(selectedMonth)} (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={monthSalaryAmount}
                    onChange={(e) => setMonthSalaryAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-base text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. 10000"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Net Payable will automatically become: <strong>{formatINR(parseFloat(monthSalaryAmount || 0) + (activeEditAmountModal.salary.carriedOverBalance || 0))}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Date of Joining (DOJ)
                </label>
                <input
                  type="date"
                  value={editStaffDoj}
                  onChange={(e) => setEditStaffDoj(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Staff salary begins only from their DOJ month onwards.
                </span>
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={updatePermanentBase}
                  onChange={(e) => setUpdatePermanentBase(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-0.5 cursor-pointer"
                />
                <span>Also update permanent default base salary for future months</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveEditAmountModal(null)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={salaryAmountSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm"
                >
                  {salaryAmountSubmitting ? 'Updating...' : 'Save Amount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdAccounts;
