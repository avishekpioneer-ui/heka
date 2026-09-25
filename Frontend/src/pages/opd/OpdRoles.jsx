import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PERMISSION_ACTIONS = [
  { id: 'read', label: 'Read' },
  { id: 'add', label: 'Add' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
];

const PERMISSION_MODULES = [
  { id: 'patients', name: 'Patients', icon: '🧑‍🤝‍🧑' },
  { id: 'appointments', name: 'Appointments', icon: '📅' },
  { id: 'consultations', name: 'Consultations', icon: '💬' },
  { id: 'medicines', name: 'Pharmacy Stock', icon: '💊' },
  { id: 'tests', name: 'Diagnostics', icon: '🧪' },
  { id: 'billing', name: 'Billing', icon: '🧾' },
  { id: 'reports', name: 'Revenue & Reports', icon: '📊' },
  { id: 'roles', name: 'Staff & Roles', icon: '🛡️' },
  { id: 'reminders', name: 'Reminders', icon: '🔔' },
  { id: 'accounts', name: 'Accounts & Payroll', icon: '💳' },
];

const LEGACY_MAP = {
  manage_patients: ['patients:read', 'patients:add', 'patients:edit', 'patients:delete'],
  manage_appointments: ['appointments:read', 'appointments:add', 'appointments:edit', 'appointments:delete'],
  manage_consultations: ['consultations:read', 'consultations:add', 'consultations:edit', 'consultations:delete'],
  manage_medicines: ['medicines:read', 'medicines:add', 'medicines:edit', 'medicines:delete'],
  manage_tests: ['tests:read', 'tests:add', 'tests:edit', 'tests:delete'],
  manage_billing: ['billing:read', 'billing:add', 'billing:edit', 'billing:delete'],
  manage_reports: ['reports:read', 'reports:add', 'reports:edit', 'reports:delete'],
  manage_roles: ['roles:read', 'roles:add', 'roles:edit', 'roles:delete'],
  manage_accounts: ['accounts:read', 'accounts:add', 'accounts:edit', 'accounts:delete'],
};


const OpdRoles = () => {
  const [roles, setRoles] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role Form States (used for both create and edit)
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [roleSuccess, setRoleSuccess] = useState('');
  const [roleError, setRoleError] = useState('');

  // New Staff Form States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [staffIsDoctor, setStaffIsDoctor] = useState(false);
  const [staffFees, setStaffFees] = useState('50');
  const [staffBaseSalary, setStaffBaseSalary] = useState('10000');
  const [staffDoj, setStaffDoj] = useState(new Date().toISOString().slice(0, 10));
  const [staffUpdatePermanentBase, setStaffUpdatePermanentBase] = useState(true);

  const [staffSuccess, setStaffSuccess] = useState('');
  const [staffError, setStaffError] = useState('');

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffRoleId, setEditStaffRoleId] = useState('');
  const [editStaffIsDoctor, setEditStaffIsDoctor] = useState(false);
  const [editStaffFees, setEditStaffFees] = useState('50');
  const [editStaffBaseSalary, setEditStaffBaseSalary] = useState('10000');
  const [editStaffDoj, setEditStaffDoj] = useState('');
  const [editStaffUpdatePermanentBase, setEditStaffUpdatePermanentBase] = useState(true);
  const [editStaffError, setEditStaffError] = useState('');
  const [editStaffSuccess, setEditStaffSuccess] = useState('');
  const [editStaffLoading, setEditStaffLoading] = useState(false);

  const userId = localStorage.getItem('userId');

  const selectedRole = roles.find(r => r._id === staffRoleId);
  const isDoctorSelected = staffIsDoctor || (selectedRole && selectedRole.name.toLowerCase().includes('doctor'));

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

  const handleToggleAction = (moduleId, actionId) => {
    const permKey = `${moduleId}:${actionId}`;
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleToggleModuleAll = (moduleId) => {
    const modulePerms = PERMISSION_ACTIONS.map((a) => `${moduleId}:${a.id}`);
    const hasAll = modulePerms.every((p) => selectedPermissions.includes(p));
    if (hasAll) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])));
    }
  };

  const handleSelectAllPerms = () => {
    const all = [
      'access_opd',
      ...PERMISSION_MODULES.flatMap((m) => PERMISSION_ACTIONS.map((a) => `${m.id}:${a.id}`)),
    ];
    setSelectedPermissions(all);
  };

  const handleClearAllPerms = () => {
    setSelectedPermissions(['access_opd']);
  };

  const handleEditRoleClick = (role) => {
    setEditingRoleId(role._id);
    setRoleName(role.name);

    let perms = Array.isArray(role.permissions) ? [...role.permissions] : [];
    let expanded = [];
    for (const p of perms) {
      if (LEGACY_MAP[p]) {
        expanded.push(...LEGACY_MAP[p]);
      } else {
        expanded.push(p);
      }
    }
    setSelectedPermissions(Array.from(new Set(expanded)));
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
        isDoctor: staffIsDoctor,
        fees: isDoctorSelected ? parseFloat(staffFees || 0) : 0,
        baseSalary: parseFloat(staffBaseSalary || 0),
        doj: staffDoj,
        updatePermanentBase: staffUpdatePermanentBase
      }, { headers });

      setStaffSuccess('Staff account created successfully!');
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRoleId('');
      setStaffIsDoctor(false);
      setStaffFees('50');
      setStaffBaseSalary('10000');
      setStaffDoj(new Date().toISOString().slice(0, 10));
      setStaffUpdatePermanentBase(true);
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

  const handleOpenEditStaff = (st) => {
    setEditingStaff(st);
    setEditStaffName(st.name || '');
    setEditStaffEmail(st.email || '');
    setEditStaffPassword('');
    const rId = st.role?._id || (typeof st.role === 'string' ? st.role : '');
    setEditStaffRoleId(rId || (roles[0]?._id || ''));
    setEditStaffIsDoctor(!!st.isDoctor);
    setEditStaffFees(st.fees !== undefined ? String(st.fees) : '50');
    setEditStaffBaseSalary(st.baseSalary !== undefined ? String(st.baseSalary) : '10000');
    setEditStaffDoj(st.doj ? new Date(st.doj).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditStaffUpdatePermanentBase(true);
    setEditStaffError('');
    setEditStaffSuccess('');
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditStaffError('');
    setEditStaffSuccess('');

    try {
      setEditStaffLoading(true);
      const headers = { 'x-user-id': userId };
      const payload = {
        name: editStaffName,
        email: editStaffEmail,
        roleId: editStaffRoleId,
        isDoctor: editStaffIsDoctor,
        fees: parseFloat(editStaffFees || 0),
        baseSalary: parseFloat(editStaffBaseSalary || 0),
        doj: editStaffDoj,
        updatePermanentBase: editStaffUpdatePermanentBase
      };
      if (editStaffPassword && editStaffPassword.trim()) {
        payload.password = editStaffPassword.trim();
      }

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/staff/staff/${editingStaff._id}`,
        payload,
        { headers }
      );

      setEditStaffSuccess('Staff details updated successfully!');
      setTimeout(() => {
        setEditingStaff(null);
        fetchData();
      }, 500);
    } catch (err) {
      setEditStaffError(err.response?.data?.message || 'Error updating staff details.');
    } finally {
      setEditStaffLoading(false);
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-600 uppercase">
                  Assign Permissions Matrix *
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="text-teal-600 font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllPerms}
                    className="text-gray-500 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Permission Matrix Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden bg-slate-50/50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 text-gray-600 font-semibold border-b border-gray-200/60">
                      <th className="py-2 px-3">Module</th>
                      <th className="py-2 px-2 text-center text-sky-700">Read</th>
                      <th className="py-2 px-2 text-center text-emerald-700">Add</th>
                      <th className="py-2 px-2 text-center text-amber-700">Edit</th>
                      <th className="py-2 px-2 text-center text-rose-700">Delete</th>
                      <th className="py-2 px-2 text-right">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {PERMISSION_MODULES.map((mod) => {
                      const moduleActions = PERMISSION_ACTIONS.map((a) => `${mod.id}:${a.id}`);
                      const isAll = moduleActions.every((p) => selectedPermissions.includes(p));

                      return (
                        <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-medium text-gray-800 flex items-center gap-1.5 whitespace-nowrap">
                            <span>{mod.icon}</span>
                            <span>{mod.name}</span>
                          </td>
                          {PERMISSION_ACTIONS.map((act) => {
                            const permKey = `${mod.id}:${act.id}`;
                            const isChecked = selectedPermissions.includes(permKey);
                            return (
                              <td key={act.id} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleAction(mod.id, act.id)}
                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer h-3.5 w-3.5"
                                />
                              </td>
                            );
                          })}
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleModuleAll(mod.id)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                                isAll
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                              }`}
                            >
                              {isAll ? '✓ All' : 'All'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                    {r.name !== "Doctor" && (
                      <button
                        onClick={() => handleDeleteRole(r._id)}
                        className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-[10px]"
                      >
                        ×
                      </button>
                    )}
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

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Base Monthly Salary (₹)</label>
              <input
                type="number"
                min="0"
                value={staffBaseSalary}
                onChange={(e) => setStaffBaseSalary(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="e.g. 10000"
              />
              <label className="flex items-center gap-2.5 cursor-pointer mt-2.5 text-xs font-medium text-slate-600 select-none bg-slate-50 border border-gray-100 rounded-xl px-3 py-2">
                <input
                  type="checkbox"
                  checked={staffUpdatePermanentBase}
                  onChange={(e) => setStaffUpdatePermanentBase(e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                />
                <span>Also update permanent default base salary for future months</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Date of Joining (DOJ) *</label>
              <input
                type="date"
                required
                value={staffDoj}
                onChange={(e) => setStaffDoj(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Staff salary begins from their Date of Joining month onwards.</span>
            </div>

            {isDoctorSelected && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Consultation Fees (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={staffFees}
                  onChange={(e) => setStaffFees(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                  placeholder="e.g. 100"
                />
              </div>
            )}

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
            <table className="w-full min-w-[640px] text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Staff Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Role Profile</th>
                  <th className="pb-3">Base Salary</th>
                  <th className="pb-3">Date of Joining</th>
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
                      {(st.isDoctor || st.role?.name?.toLowerCase().includes('doctor')) && st.fees > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">
                          Fees: ₹{st.fees}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 font-semibold text-slate-800 text-xs">
                      ₹{st.baseSalary ? Number(st.baseSalary).toLocaleString('en-IN') : 0}
                    </td>
                    <td className="py-3.5 pr-2 text-xs text-slate-500 font-mono">
                      {st.doj ? new Date(st.doj).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEditStaff(st)}
                        className="text-teal-600 hover:text-teal-800 text-xs font-bold cursor-pointer transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(st._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-7 relative overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-teal-950 font-literata">Edit Staff Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update credentials, role assignment, DOJ, and base salary</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {editStaffSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                {editStaffSuccess}
              </div>
            )}
            {editStaffError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {editStaffError}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty to keep current password"
                  value={editStaffPassword}
                  onChange={(e) => setEditStaffPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Role Profile *</label>
                  <select
                    value={editStaffRoleId}
                    onChange={(e) => {
                      setEditStaffRoleId(e.target.value);
                      const chosen = roles.find(r => r._id === e.target.value);
                      if (chosen && chosen.name.toLowerCase().includes('doctor')) {
                        setEditStaffIsDoctor(true);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editStaffBaseSalary}
                    onChange={(e) => setEditStaffBaseSalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <label className="flex items-center gap-2.5 cursor-pointer mt-2.5 text-xs font-medium text-slate-600 select-none bg-slate-50 border border-gray-100 rounded-xl px-3 py-2">
                    <input
                      type="checkbox"
                      checked={editStaffUpdatePermanentBase}
                      onChange={(e) => setEditStaffUpdatePermanentBase(e.target.checked)}
                      className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                    />
                    <span>Also update permanent default base salary for future months</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date of Joining (DOJ)</label>
                  <input
                    type="date"
                    value={editStaffDoj}
                    onChange={(e) => setEditStaffDoj(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {editStaffIsDoctor && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editStaffFees}
                      onChange={(e) => setEditStaffFees(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsDoctor"
                  checked={editStaffIsDoctor}
                  onChange={(e) => setEditStaffIsDoctor(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="editIsDoctor" className="text-xs text-gray-700 cursor-pointer font-medium">
                  Designate as Doctor (can be assigned OPD appointments)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStaffLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
                >
                  {editStaffLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdRoles;
