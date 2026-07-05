import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPayments = () => {
    const [settings, setSettings] = useState({
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        upiId: '',
        notes: '',
        qrImageUrl: ''
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [approving, setApproving] = useState(false);
    const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' or 'settings'

    const API_BASE = import.meta.env.VITE_BACKEND_URI;
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) return;
        fetchSettings();
        fetchPendingPayments();
    }, [userId]);

    const fetchSettings = async () => {
        try {
            setSettingsLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/payment-settings`, {
                headers: { 'x-user-id': userId }
            });
            if (res.data.success && res.data.data) {
                setSettings(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching payment settings:", err);
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/students`, {
                headers: { 'x-user-id': userId }
            });
            if (res.data.success) {
                // Filter for students who have submitted payment but are not yet approved
                const pending = res.data.data.filter(s => s.paymentStatus === 'submitted' && s.applicationStatus !== 'approved');
                setStudents(pending);
            }
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        try {
            setSavingSettings(true);
            await axios.put(`${API_BASE}/api/admin/payment-settings`, settings, {
                headers: { 'x-user-id': userId }
            });
            alert("Payment settings updated successfully!");
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to save settings.");
        } finally {
            setSavingSettings(false);
        }
    };

    const approvePayment = async (id) => {
        if (!confirm("Are you sure you want to approve this payment?")) return;
        try {
            setApproving(true);
            await axios.put(`${API_BASE}/api/students/${id}/approve`, {}, {
                headers: { 'x-user-id': userId }
            });
            alert("Payment approved successfully!");
            fetchPendingPayments();
        } catch (err) {
            console.error("Error approving payment:", err);
            alert("Failed to approve payment.");
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-literata tracking-tight">Payment Management</h1>
                    <p className="text-gray-500 mt-1 font-dmsans">Manage bank details and verify student payments</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 gap-8">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`pb-4 px-2 text-sm font-semibold transition-all ${activeTab === 'approvals' ? 'border-b-2 border-[#4B9B6E] text-[#4B9B6E]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending Approvals ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 px-2 text-sm font-semibold transition-all ${activeTab === 'settings' ? 'border-b-2 border-[#4B9B6E] text-[#4B9B6E]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Bank Account Settings
                </button>
            </div>

            {activeTab === 'approvals' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading pending payments...</div>
                    ) : students.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="font-medium text-gray-600">No pending payment approvals</p>
                            <p className="text-sm mt-1">All submitted payments have been processed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Transaction ID</th>
                                        <th className="px-6 py-4">Submission Date</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 tracking-tight">{student.fullName}</span>
                                                    <span className="text-xs text-gray-500">{student.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{student.courseType || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">₹{(student.courseFee || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-bold">
                                                    {student.transactionId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(student.updatedAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => approvePayment(student._id)}
                                                    disabled={approving}
                                                    className="bg-[#4B9B6E] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-100 hover:bg-[#3d825b] transition-all disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Bank Account Details</h2>
                    {settingsLoading ? (
                        <div className="text-gray-400">Loading settings...</div>
                    ) : (
                        <form onSubmit={saveSettings} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Account Name</label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        value={settings.accountName}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g. Rudraksh Foundation"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={settings.bankName}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g. State Bank of India"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={settings.accountNumber}
                                        onChange={handleSettingsChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">IFSC Code</label>
                                    <input
                                        type="text"
                                        name="ifsc"
                                        value={settings.ifsc}
                                        onChange={handleSettingsChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">UPI ID</label>
                                    <input
                                        type="text"
                                        name="upiId"
                                        value={settings.upiId}
                                        onChange={handleSettingsChange}
                                        placeholder="e.g. name@upi"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">Additional Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={settings.notes}
                                        onChange={handleSettingsChange}
                                        rows="3"
                                        placeholder="Extra instructions for students..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4B9B6E] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="w-full bg-[#4B9B6E] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-[#3d825b] hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
                                >
                                    {savingSettings ? 'Saving...' : 'Update Bank Account Details'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
