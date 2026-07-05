import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URI;

// Status helpers
const statusColor = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
};
const paymentColor = {
    unpaid: "bg-gray-100 text-gray-600 border-gray-200",
    submitted: "bg-blue-100 text-blue-700 border-blue-200",
    verified: "bg-green-100 text-green-700 border-green-200",
};

export default function StudentPanel() {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState({
        accountName: "Rudraksh Foundation Health Care Training",
        bankName: "State Bank of India",
        accountNumber: "XXXX XXXX XXXX 1234",
        ifsc: "SBIN0001234",
        upiId: "rudraksh@sbi",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [txnId, setTxnId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState(null);

    const userData = (() => {
        try { return JSON.parse(localStorage.getItem("userData")); } catch { return null; }
    })();

    // Redirect if not a student
    useEffect(() => {
        if (!userData) { navigate("/login"); return; }
        if (userData.category !== "student") { navigate("/"); return; }

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Profile and Payment Settings in parallel
                const [profileRes, settingsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/students/my-profile?email=${encodeURIComponent(userData.email)}`),
                    axios.get(`${API_BASE_URL}/api/public/payment-settings`)
                ]);

                if (profileRes.data.success) {
                    setStudent(profileRes.data.data);
                }

                if (settingsRes.data.success && settingsRes.data.data && settingsRes.data.data.accountName) {
                    setPaymentInfo(settingsRes.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Could not load your profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!txnId.trim()) return;
        try {
            setSubmitting(true);
            setSubmitMsg(null);
            const res = await axios.post(`${API_BASE_URL}/api/students/submit-payment`, {
                studentId: student._id,
                transactionId: txnId.trim(),
            });
            setSubmitMsg({ type: "success", text: res.data.message });
            setStudent(prev => ({ ...prev, transactionId: txnId.trim(), paymentStatus: "submitted" }));
            setTxnId("");
        } catch (err) {
            setSubmitMsg({ type: "error", text: err.response?.data?.message || "Failed to submit. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = [
        { id: "profile", label: "My Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        { id: "center", label: "My Center", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
        { id: "bill", label: "Bill", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
        { id: "payment", label: "Payment", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    ];

    // ── Shared card style
    const card = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6";
    const label = "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1";
    const value = "text-sm font-medium text-gray-800";

    function InfoRow({ l, v }) {
        return (
            <div className="flex flex-col">
                <span className={label}>{l}</span>
                <span className={value}>{v || "—"}</span>
            </div>
        );
    }

    // ── LOADING ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-dmsans">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4B9B6E] border-t-transparent mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading your profile…</p>
                </div>
            </div>
        );
    }

    // ── ERROR ────────────────────────────────────────────────────────────────
    if (error || !student) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-dmsans px-4">
                <div className="text-center bg-white rounded-2xl shadow p-10 max-w-md w-full">
                    <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 text-sm mb-6">{error || "No student application found for your account. Please fill the admission form first."}</p>
                    <button onClick={() => navigate("/admission-form")} className="px-6 py-3 bg-[#4B9B6E] text-white font-bold rounded-xl hover:bg-[#3d825b] transition-all">
                        Fill Admission Form
                    </button>
                </div>
            </div>
        );
    }

    const course = student.courseId;
    const center = student.coachingCenterId;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-dmsans pb-16">

            {/* ── Header */}
            <div className="bg-gradient-to-r from-[#4B9B6E] to-[#3d825b] text-white px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg">
                            {student.fullName?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{student.fullName}</h1>
                            <p className="text-white/70 text-sm">{student.email}</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusColor[student.applicationStatus]}`}>
                                {student.applicationStatus === "approved" ? "✓ Approved" : student.applicationStatus === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${paymentColor[student.paymentStatus]}`}>
                                Payment: {student.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Approved Banner */}
            {student.applicationStatus === "approved" && (
                <div className="max-w-4xl mx-auto px-4 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-green-800">Your admission is approved! 🎉</p>
                            <p className="text-sm text-green-600">Your payment has been verified. Welcome aboard!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tabs */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all duration-200 whitespace-nowrap ${activeTab === t.id
                                ? "bg-[#4B9B6E] text-white shadow-md"
                                : "text-gray-500 hover:text-[#4B9B6E] hover:bg-[#4B9B6E]/5"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                            </svg>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content */}
                <div className="mt-6 space-y-4">

                    {/* ── MY PROFILE ─────────────────────────────────────────────────── */}
                    {activeTab === "profile" && (
                        <>
                            {/* Personal Info */}
                            <div className={card}>
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-[#4B9B6E] rounded-full"></span>Personal Information
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                    <InfoRow l="Full Name" v={student.fullName} />
                                    <InfoRow l="Date of Birth" v={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-IN") : ""} />
                                    <InfoRow l="Gender" v={student.gender} />
                                    <InfoRow l="Email" v={student.email} />
                                    <InfoRow l="Phone" v={student.phoneNumber} />
                                    <InfoRow l="Alternate Phone" v={student.alternatePhoneNumber} />
                                    <InfoRow l="Aadhar Number" v={student.aadharNumber} />
                                    <InfoRow l="Parent / Guardian" v={student.fatherOrMotherName} />
                                    <div className="col-span-2 sm:col-span-3">
                                        <InfoRow l="Permanent Address" v={student.permanentAddress} />
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            <div className={card}>
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>Education History
                                </h3>
                                {student.educations?.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                <tr>
                                                    {["Degree", "Institute", "Board", "Year", "Grade", "Stream"].map(h => (
                                                        <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {student.educations.map((e, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2.5 font-medium text-gray-800">{e.degreeOrClass}</td>
                                                        <td className="px-4 py-2.5 text-gray-600">{e.institute}</td>
                                                        <td className="px-4 py-2.5 text-gray-600">{e.boardOrUniversity}</td>
                                                        <td className="px-4 py-2.5 text-gray-600">{e.passingYear}</td>
                                                        <td className="px-4 py-2.5 text-gray-600">{e.marksOrGrade}</td>
                                                        <td className="px-4 py-2.5 text-gray-600">{e.stream}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No education records.</p>}
                            </div>

                            {/* Work Experience */}
                            {student.workExperiences?.length > 0 && (
                                <div className={card}>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>Work Experience
                                    </h3>
                                    <div className="space-y-3">
                                        {student.workExperiences.map((w, i) => (
                                            <div key={i} className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                                                <p className="font-bold text-gray-900">{w.designation}</p>
                                                <p className="text-sm text-gray-600">{w.companyName}</p>
                                                <p className="text-xs text-gray-500 mt-1">Reporting: {w.reportingPerson} {w.reportingContact && `(${w.reportingContact})`}</p>
                                                {w.jobResponsibilities && <p className="text-sm text-gray-600 mt-2 border-l-2 border-orange-300 pl-3">{w.jobResponsibilities}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── MY CENTER ──────────────────────────────────────────────────── */}
                    {activeTab === "center" && (
                        <div className={card}>
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#4B9B6E] rounded-full"></span>Assigned Coaching Center
                            </h3>
                            {center ? (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 p-5 bg-[#4B9B6E]/5 border border-[#4B9B6E]/20 rounded-2xl">
                                        <div className="w-14 h-14 bg-[#4B9B6E] rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-[#4B9B6E]">{center.name}</h4>
                                            <p className="text-sm text-gray-500">{center.address}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow l="Pincode" v={center.pincode} />
                                        <InfoRow l="Contact Number" v={center.mobileNumber} />
                                        <InfoRow l="Course" v={course?.courseName} />
                                        <InfoRow l="Duration" v={course?.duration} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Center details not available.</p>
                            )}
                        </div>
                    )}

                    {/* ── BILL ───────────────────────────────────────────────────────── */}
                    {activeTab === "bill" && (
                        <div className={card}>
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>Fee Invoice
                            </h3>
                            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                {/* Invoice header */}
                                <div className="bg-[#4B9B6E] px-6 py-4 text-white">
                                    <p className="text-xs uppercase tracking-widest font-medium opacity-80">INVOICE</p>
                                    <h4 className="text-xl font-bold mt-1">Rudraksh Foundation Health Care Training</h4>
                                </div>

                                {/* Invoice body */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={label}>Student Name</p>
                                            <p className={value + " text-base"}>{student.fullName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={label}>Application Status</p>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${statusColor[student.applicationStatus]}`}>
                                                {student.applicationStatus}
                                            </span>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow l="Course" v={course?.courseName} />
                                        <InfoRow l="Center" v={center?.name} />
                                        <InfoRow l="Duration" v={course?.duration} />
                                        <InfoRow l="Certificate" v={course?.certificateAvailable ? "Yes" : "No"} />
                                    </div>

                                    <hr className="border-gray-100" />

                                    <div className="flex justify-between items-center bg-green-50 rounded-xl px-5 py-4">
                                        <span className="text-sm font-semibold text-gray-600">Total Course Fee</span>
                                        <span className="text-3xl font-extrabold text-[#4B9B6E]">
                                            ₹{(student.courseFee || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className={label}>Payment Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${paymentColor[student.paymentStatus]}`}>
                                            {student.paymentStatus}
                                        </span>
                                    </div>

                                    {student.transactionId && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <p className={label}>Transaction ID (Submitted)</p>
                                            <p className="font-mono text-sm font-bold text-blue-800">{student.transactionId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PAYMENT ────────────────────────────────────────────────────── */}
                    {activeTab === "payment" && (
                        <div className="space-y-4">

                            {/* Already approved */}
                            {student.applicationStatus === "approved" ? (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                                    <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800">Payment Verified ✓</h3>
                                    <p className="text-green-600 mt-2">Your payment has been verified by the admin.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Account Details */}
                                    <div className={card}>
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-5 bg-[#4B9B6E] rounded-full"></span>Company Account Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className={label}>Account Name</p>
                                                    <p className={value}>{paymentInfo.accountName}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className={label}>Bank Name</p>
                                                    <p className={value}>{paymentInfo.bankName}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className={label}>Account Number</p>
                                                    <p className="font-mono text-sm font-bold text-gray-800">{paymentInfo.accountNumber}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <p className={label}>IFSC Code</p>
                                                    <p className="font-mono text-sm font-bold text-gray-800">{paymentInfo.ifsc}</p>
                                                </div>
                                            </div>

                                            {/* UPI + Total */}
                                            <div className="p-4 bg-[#4B9B6E]/5 border border-[#4B9B6E]/20 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className={label}>UPI ID</p>
                                                    <p className="font-mono font-bold text-[#4B9B6E] text-base">{paymentInfo.upiId}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={label}>Amount to Pay</p>
                                                    <p className="text-2xl font-extrabold text-[#4B9B6E]">₹{(student.courseFee || 0).toLocaleString("en-IN")}</p>
                                                </div>
                                            </div>

                                            {paymentInfo.notes && (
                                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                                    <p className={label}>Important Note</p>
                                                    <p className="text-sm text-amber-800">{paymentInfo.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div className={card + " text-center"}>
                                        <h3 className="font-bold text-gray-800 mb-4">Scan QR to Pay</h3>
                                        <div className="inline-flex flex-col items-center gap-3">
                                            <div className="w-48 h-48 border-4 border-[#4B9B6E] rounded-2xl flex items-center justify-center bg-gray-50 relative overflow-hidden">
                                                {paymentInfo.qrImageUrl ? (
                                                    <img src={paymentInfo.qrImageUrl} alt="Payment QR" className="w-full h-full object-contain" />
                                                ) : (
                                                    <svg className="w-40 h-40 text-[#4B9B6E]" viewBox="0 0 200 200" fill="currentColor">
                                                        <rect x="10" y="10" width="80" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="12" />
                                                        <rect x="30" y="30" width="40" height="40" rx="4" />
                                                        <rect x="110" y="10" width="80" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="12" />
                                                        <rect x="130" y="30" width="40" height="40" rx="4" />
                                                        <rect x="10" y="110" width="80" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="12" />
                                                        <rect x="30" y="130" width="40" height="40" rx="4" />
                                                        <rect x="110" y="110" width="20" height="20" rx="2" />
                                                        <rect x="140" y="110" width="20" height="20" rx="2" />
                                                        <rect x="170" y="110" width="20" height="20" rx="2" />
                                                        <rect x="110" y="140" width="20" height="20" rx="2" />
                                                        <rect x="170" y="140" width="20" height="20" rx="2" />
                                                        <rect x="110" y="170" width="80" height="20" rx="2" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">UPI: {paymentInfo.upiId}</p>
                                        </div>
                                    </div>

                                    {/* Transaction ID form */}
                                    <div className={card}>
                                        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                            <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>Submit Transaction ID
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-5">After completing the payment, enter the transaction / UTR ID below.</p>

                                        {student.paymentStatus === "submitted" && !submitMsg && (
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                                                ✓ Transaction ID <span className="font-mono font-bold">{student.transactionId}</span> already submitted. Waiting for admin verification.
                                            </div>
                                        )}

                                        {submitMsg && (
                                            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${submitMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                                                {submitMsg.text}
                                            </div>
                                        )}

                                        <form onSubmit={handlePaymentSubmit} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={txnId}
                                                onChange={e => setTxnId(e.target.value)}
                                                placeholder="Enter Transaction / UTR ID"
                                                className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4B9B6E]/30 focus:border-[#4B9B6E]"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={submitting || !txnId.trim()}
                                                className="px-6 py-3 bg-[#4B9B6E] text-white font-bold rounded-xl hover:bg-[#3d825b] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {submitting ? "Submitting…" : "Submit"}
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
