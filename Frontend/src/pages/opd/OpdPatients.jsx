import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OpdPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duplicatePatient, setDuplicatePatient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    address: ''
  });

  const userId = localStorage.getItem('userId');
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const hasPermission = (perm) => userPermissions.includes('*') || userPermissions.includes(perm);

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      const url = query ? `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/patients?search=${query}` : (import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients';
      const res = await axios.get(url, { headers });
      setPatients(res.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDuplicatePatient(null);
    setSubmitting(true);

    try {
      const headers = { 'x-user-id': userId };
      const res = await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients', formData, { headers });

      setSuccess('Patient registered successfully!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'Male',
        age: '',
        address: ''
      });
      fetchPatients(); // refresh list
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.patient) {
        setDuplicatePatient(err.response.data.patient);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Error registering patient. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Patients Registry</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Register new patients or look up existing clinical profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Register Patient Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">New Patient Registration</h3>
          
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
              {duplicatePatient && (
                <button
                  type="button"
                  onClick={() => navigate('/opd/appointments', { state: { patient: duplicatePatient } })}
                  className="mt-2 w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Use Existing Patient "{duplicatePatient.name}" — Book Appointment Instead
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                  placeholder="35"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Residential Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-sm text-gray-800 resize-none"
                placeholder="Street Address, City"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {submitting ? 'Registering...' : 'Register Patient'}
            </button>
          </form>
        </div>

        {/* Patients List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-teal-950 font-literata">Registered Patient Database</h3>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by name/phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 text-xs bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-64 text-gray-800"
              />
              <button 
                type="submit"
                className="px-3 py-2 bg-teal-50 text-[#0D9488] rounded-xl border border-teal-100 font-semibold text-xs hover:bg-teal-100/50 cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No registered patients found matching search query.</p>
              </div>
            ) : (
              <table className="w-full min-w-[560px] text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Age/Gender</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((pat) => (
                    <tr key={pat._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 pr-2">
                        <span className="font-semibold text-gray-900">{pat.name}</span>
                        {pat.email && <span className="block text-[10px] text-gray-400 mt-0.5">{pat.email}</span>}
                      </td>
                      <td className="py-3.5 pr-2 text-gray-600">
                        {pat.age} yrs / {pat.gender}
                      </td>
                      <td className="py-3.5 pr-2 font-mono text-xs text-gray-600">
                        {pat.phone}
                      </td>
                      <td className="py-3.5 text-right">
                        {hasPermission('manage_appointments') && (
                          <button
                            onClick={() => navigate('/opd/appointments', { state: { patient: pat } })}
                            className="bg-teal-50 text-[#0D9488] hover:bg-teal-100/50 font-bold py-1 px-3 rounded-lg border border-teal-100/50 text-xs transition-colors cursor-pointer"
                          >
                            Book Consult
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpdPatients;
