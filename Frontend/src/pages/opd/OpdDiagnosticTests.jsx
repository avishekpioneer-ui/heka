import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdDiagnosticTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Test ordering / scheduling states
  const [patients, setPatients] = useState([]);
  const [testOrders, setTestOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderPatientId, setOrderPatientId] = useState('');
  const [orderTestId, setOrderTestId] = useState('');
  const [orderScheduledDate, setOrderScheduledDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  const userId = localStorage.getItem('userId');

  const fetchTests = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests', { headers });
      setTests(res.data);
    } catch (err) {
      console.error('Error fetching tests catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderData = async () => {
    try {
      setOrderLoading(true);
      const headers = { 'x-user-id': userId };
      const patientsRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/patients', { headers });
      setPatients(patientsRes.data);
      const ordersRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/test-orders', { headers });
      setTestOrders(ordersRes.data);
    } catch (err) {
      console.error('Error fetching test orders:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchOrderData();
  }, [userId]);

  // Live-refresh the scheduled tests board when any staff member orders or updates a test.
  useOpdSocketEvent('opd:testorder', fetchOrderData);

  const handleOrderTestSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    setOrderSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/test-orders', {
        patientId: orderPatientId,
        testId: orderTestId,
        scheduledDate: orderScheduledDate || null,
        notes: orderNotes
      }, { headers });

      setOrderSuccess('Diagnostic test scheduled and a Pending test bill was generated!');
      setOrderPatientId('');
      setOrderTestId('');
      setOrderScheduledDate('');
      setOrderNotes('');
      fetchOrderData();
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Error scheduling test.');
    }
  };

  const handleOrderStatusChange = async (id, status) => {
    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/test-orders/${id}/status`, { status }, { headers });
      fetchOrderData();
    } catch (err) {
      console.error('Error updating test order status:', err);
      alert('Error updating test order status');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests', { name, price: parseFloat(price) }, { headers });
      setSuccess('Test added successfully!');
      setName('');
      setPrice('');
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding test.');
    }
  };

  const handleEditClick = (test) => {
    setEditingId(test._id);
    setEditName(test.name);
    setEditPrice(test.price);
  };

  const handleUpdateSubmit = async (e, id) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/tests/${id}`, { name: editName, price: parseFloat(editPrice) }, { headers });
      setSuccess('Test updated successfully!');
      setEditingId(null);
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating test.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('Are you sure you want to delete this test from the catalog?')) return;
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/tests/${id}`, { headers });
      setSuccess('Test deleted successfully!');
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting test.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Diagnostics Catalog</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Manage laboratory diagnostic checkups and pricing rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Test Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Add Diagnostic Test</h3>

          {success && !editingId && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          {error && !editingId && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Test Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="Complete Blood Count (CBC)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="25"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
            >
              Add Test to Catalog
            </button>
          </form>
        </div>

        {/* Tests List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Diagnostic Test Catalog List</h3>

          {success && editingId && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          {error && editingId && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No diagnostic tests cataloged yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[420px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Test Name</th>
                    <th className="pb-3">Rate/Price</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      {editingId === test._id ? (
                        <td colSpan="3" className="py-2">
                          <form onSubmit={(e) => handleUpdateSubmit(e, test._id)} className="flex flex-wrap gap-2 items-center w-full">
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 min-w-[120px] px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                            />
                            <input
                              type="number"
                              required
                              min="0"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                            />
                            <button
                              type="submit"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1 px-2.5 rounded-lg text-xs cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1 px-2.5 rounded-lg text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="py-3.5 pr-2 font-semibold text-gray-900 whitespace-nowrap">
                            {test.name}
                          </td>
                          <td className="py-3.5 pr-2 font-mono text-teal-800 font-semibold whitespace-nowrap">
                            ₹{test.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 text-right flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(test)}
                              className="text-teal-600 hover:text-teal-800 text-xs font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(test._id)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Test Ordering / Scheduling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Schedule Test For Patient</h3>

          {orderSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold">
              {orderSuccess}
            </div>
          )}
          {orderError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {orderError}
            </div>
          )}

          <form onSubmit={handleOrderTestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Patient *</label>
              <select
                required
                value={orderPatientId}
                onChange={(e) => setOrderPatientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Diagnostic Test *</label>
              <select
                required
                value={orderTestId}
                onChange={(e) => setOrderTestId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800"
              >
                <option value="">-- Choose Test --</option>
                {tests.map(t => (
                  <option key={t._id} value={t._id}>{t.name} (₹{t.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Scheduled Date</label>
              <input
                type="date"
                value={orderScheduledDate}
                onChange={(e) => setOrderScheduledDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800 resize-none"
                placeholder="Fasting required, etc."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
            >
              Schedule Test
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Scheduled / Pending Tests</h3>

          <div className="flex-1 overflow-x-auto">
            {orderLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : testOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No diagnostic tests scheduled yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px] text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Test</th>
                    <th className="pb-3">Scheduled</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testOrders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 pr-2 font-semibold text-gray-900">{order.patientId?.name}</td>
                      <td className="py-3.5 pr-2 text-gray-700">{order.testName}</td>
                      <td className="py-3.5 pr-2 text-gray-600 text-xs">
                        {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'Reported' ? 'bg-green-50 text-green-700' :
                          order.status === 'Collected' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right flex flex-wrap justify-end gap-1.5">
                        {order.status === 'Ordered' && (
                          <button
                            onClick={() => handleOrderStatusChange(order._id, 'Collected')}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs py-1 px-2.5 rounded-lg border border-blue-100 cursor-pointer font-semibold"
                          >
                            Mark Collected
                          </button>
                        )}
                        {order.status === 'Collected' && (
                          <button
                            onClick={() => handleOrderStatusChange(order._id, 'Reported')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 text-xs py-1 px-2.5 rounded-lg border border-green-100 cursor-pointer font-semibold"
                          >
                            Mark Reported
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

export default OpdDiagnosticTests;
