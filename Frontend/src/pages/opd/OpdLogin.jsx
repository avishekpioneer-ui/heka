import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OpdLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5001/api/opd/auth/login', formData);

            // Store credentials in localStorage
            localStorage.setItem('userId', response.data.user.id);
            localStorage.setItem('userName', response.data.user.name);
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('userCategory', response.data.user.category);
            localStorage.setItem('userRoleName', response.data.user.roleName);
            localStorage.setItem('userPermissions', JSON.stringify(response.data.user.permissions));

            // Redirect to OPD dashboard
            navigate('/opd');
        } catch (error) {
            console.error('OPD Login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please verify credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4 font-dmsans relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#0D9488]/15 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-t from-[#0D9488]/15 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-teal-50/50 p-6 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600 mb-4 border border-teal-100/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Heka OPD Login</h1>
                        <p className="text-gray-500 mt-2 text-sm">Sign in to manage patient workflows and operations</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all outline-none text-sm text-gray-800"
                                placeholder="staff@hospital.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all outline-none text-sm text-gray-800"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-teal-100 hover:shadow-lg hover:shadow-teal-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying Portal Access...
                                </span>
                            ) : 'Sign In to OPD Portal'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-50">
                            <p className="text-xs text-teal-800 font-bold mb-2 uppercase tracking-wide">Demo Accounts</p>
                            <div className="flex flex-col gap-1.5 text-xs text-gray-600 font-mono">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                    <span className="font-semibold">Super Admin:</span>
                                    <span className="break-all">admin@heka.com / admin123</span>
                                </div>
                                <div className="text-[10px] text-teal-600 mt-1 italic leading-normal">
                                    Note: Custom staff credentials (receptionist, doctor, pharmacist, etc.) can be generated inside the Roles & Staff management view once logged in as Super Admin.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-teal-800/80 text-sm mt-8">
                    &copy; {new Date().getFullYear()} Heka Health OPD Management Module
                </p>
            </div>
        </div>
    );
};

export default OpdLogin;
