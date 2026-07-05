import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AVAILABLE_PERMISSIONS = [
  { id: 'access_opd', label: 'Access OPD Portal / View Dashboard' },
  { id: 'manage_patients', label: 'Register & View Patients' },
  { id: 'manage_appointments', label: 'Book & View Appointments' },
  { id: 'manage_consultations', label: 'Doctor Workspaces & Clinical Prescriptions' },
  { id: 'manage_tests', label: 'Manage Diagnostics & Test Price catalogs' },
  { id: 'manage_medicines', label: 'Manage Pharmacy stock & Medicine price catalogs' },
  { id: 'manage_billing', label: 'Generate bills, invoices, checkouts, and record payments' },
  { id: 'manage_roles', label: 'Configure Custom roles, permissions, and Staff logins' }
];

const OpdRoles = () => {
  const [roles, setRoles] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role Form States (used for both create and edit)
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // New Staff Form States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [staffIsDoctor, setStaffIsDoctor] = useState(false);

  const [roleSuccess, setRoleSuccess] = useState('');
  const [roleError, setRoleError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [staffError, setStaffError] = useState('');

  const userId = localStorage.getItem('userId');

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      
      const rolesRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/staff/roles', { headers });
      setRoles(rolesRes.data);

      const staffRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/staff/staff', { headers });
      setStaffList(staffRes.data);
    } catch (err) {
      console.error('Error loading roles settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handlePermissionToggle = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setRoleError('');
    setRoleSuccess('');

    try {
      const headers = { 'x-user-id': userId };

      if (editingRoleId) {
        await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/staff/roles/${editingRoleId}`, {
          name: roleName,
          permissions: selectedPermissions
        }, { headers });
        setRoleSuccess('Role updated successfully!');
      } else {
        await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/staff/roles', {
          name: roleName,
          permissions: selectedPermissions
        }, { headers });
        setRoleSuccess('Custom role created successfully!');
      }

      setEditingRoleId(null);
      setRoleName('');
      setSelectedPermissions([]);
      fetchData();
    } catch (err) {
      setRoleError(err.response?.data?.message || 'Error saving role.');
    }
  };

  const handleEditRoleClick = (role) => {
    setEditingRoleId(role._id);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setRoleError('');
    setRoleSuccess('');
  };

  const handleCancelEditRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setSelectedPermissions([]);
    setRoleError('');
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/staff/staff', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        roleId: staffRoleId,
        isDoctor: staffIsDoctor
      }, { headers });

      setStaffSuccess('Staff account created successfully!');
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRoleId('');
      setStaffIsDoctor(false);
      fetchData();
    } catch (err) {
      setStaffError(err.response?.data?.message || 'Error creating staff login.');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to remove this staff account?')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/staff/staff/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert('Error deleting staff member');
    }
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('Are you sure you want to delete this role? Any staff linked to this role will lose permissions.')) return;
    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/staff/roles/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert('Error deleting role');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Access Control & Staff Logins</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Create customized roles, adjust permissions matrices, and register staff credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">
            {editingRoleId ? 'Edit Access Role' : 'Create Custom Access Role'}
          </h3>

          {roleSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {roleSuccess}
            </div>
          )}
          {roleError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {roleError}
            </div>
          )}

          <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Role Name *</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="e.g. Pharmacy Assistant"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Assign Permissions *</label>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => handlePermissionToggle(perm.id)}
                      className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
              >
                {editingRoleId ? 'Update Role' : 'Save Custom Role'}
              </button>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={handleCancelEditRole}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-5 rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* List of current roles */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-xs uppercase font-bold text-gray-400 mb-4">Configured Roles</h4>
            {loading ? (
              <p className="text-xs text-gray-400">Loading roles...</p>
            ) : roles.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No custom roles created. Please configure one above.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <div key={r._id} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-gray-700">
                    <span><strong>{r.name}</strong> ({r.permissions.length} perms)</span>
                    <button
                      onClick={() => handleEditRoleClick(r)}
                      className="text-teal-600 font-bold hover:text-teal-800 cursor-pointer text-[10px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(r._id)}
                      className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Credentials Creator Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Register OPD Staff Account</h3>

          {staffSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {staffSuccess}
            </div>
          )}
          {staffError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {staffError}
            </div>
          )}

          <form onSubmit={handleRegisterStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Staff Full Name *</label>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Login Email Address *</label>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="jane@hospital.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Login Password *</label>
              <input
                type="password"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Assign Role *</label>
              <select
                required
                value={staffRoleId}
                onChange={(e) => setStaffRoleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
              >
                <option value="">-- Choose Role Profile --</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
              <input
                type="checkbox"
                checked={staffIsDoctor}
                onChange={(e) => setStaffIsDoctor(e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span>Force-list as Doctor (optional — staff assigned a role named "Doctor" already appear in the appointment doctor selector automatically)</span>
            </label>

            <button
              type="submit"
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
            >
              Create Staff Account
            </button>
          </form>
        </div>
      </div>

      {/* Staff accounts List table */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Registered OPD Staff Logins</h3>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : staffList.length === 0 ? (
          <p className="text-center text-gray-400 py-10 bg-slate-50 border border-dashed border-slate-100 rounded-xl text-sm">
            No registered staff users found. Create staff logins using the form above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Staff Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Role Profile</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((st) => (
                  <tr key={st._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 pr-2 font-semibold text-gray-900">{st.name}</td>
                    <td className="py-3.5 pr-2 font-mono text-xs text-gray-600">{st.email}</td>
                    <td className="py-3.5 pr-2">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100/50">
                        {st.role?.name || 'No Role'}
                      </span>
                      {st.isDoctor && (
                        <span className="ml-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/50">
                          Doctor
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteStaff(st._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                      >
                        Delete Login
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdRoles;
