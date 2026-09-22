import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOpdSocketEvent } from './useOpdSocket';

const OpdDiagnosticTests = () => {
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Pagination & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [code, setCode] = useState('');
  const [editCode, setEditCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Test orders list states
  const [testOrders, setTestOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(true);

  const userId = localStorage.getItem('userId');

  const fetchTests = async (targetPage = 1, query = searchQuery, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const headers = { 'x-user-id': userId };
      const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests', {
        headers,
        params: {
          page: targetPage,
          limit,
          search: query.trim() || undefined
        }
      });
      if (res.data && res.data.tests) {
        const newTests = res.data.tests;
        if (append) {
          setTests(prev => {
            const existingIds = new Set(prev.map(t => t._id));
            const filtered = newTests.filter(t => !existingIds.has(t._id));
            return [...prev, ...filtered];
          });
        } else {
          setTests(newTests);
        }
        setTotalTests(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.page || targetPage);
      } else if (Array.isArray(res.data)) {
        setTests(res.data);
        setTotalTests(res.data.length);
        setTotalPages(1);
        setPage(1);
      }
    } catch (err) {
      console.error('Error fetching tests catalog:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60 && !loading && !loadingMore && page < totalPages) {
      fetchTests(page + 1, searchQuery, true);
    }
  };

  const fetchAllTests = async () => {
    try {
      const headers = { 'x-user-id': userId };
      const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/tests?all=true', { headers });
      setAllTests(Array.isArray(res.data) ? res.data : res.data?.tests || []);
    } catch (err) {
      console.error('Error fetching all tests catalog:', err);
    }
  };

  const fetchOrderData = async () => {
    try {
      setOrderLoading(true);
      const headers = { 'x-user-id': userId };
      const ordersRes = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/test-orders', { headers });
      setTestOrders(ordersRes.data);
    } catch (err) {
      console.error('Error fetching test orders:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTests(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  useEffect(() => {
    fetchAllTests();
    fetchOrderData();
  }, [userId]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      fetchTests(newPage, searchQuery);
    }
  };

  // Live-refresh the test orders board when any staff member updates a test order.
  useOpdSocketEvent('opd:testorder', fetchOrderData);

  // Date selection modal state for Collect Sample & Submit to Lab
  const [dateModal, setDateModal] = useState({
    isOpen: false,
    orderId: null,
    title: '',
    action: '', // 'COLLECT' | 'SUBMIT_LAB'
    date: new Date().toISOString().substring(0, 10),
  });

  const handleOrderStatusChange = async (id, status, extraData = {}) => {
    try {
      const headers = { 'x-user-id': userId };
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/test-orders/${id}/status`,
        { status, ...extraData },
        { headers }
      );
      fetchOrderData();
    } catch (err) {
      console.error('Error updating test order status:', err);
      alert('Error updating test order status');
    }
  };

  const openCollectDialog = (order) => {
    setDateModal({
      isOpen: true,
      orderId: order._id,
      title: `Collect Sample for ${order.testName}`,
      action: 'COLLECT',
      date: new Date().toISOString().substring(0, 10),
    });
  };

  const openSubmitLabDialog = (order) => {
    setDateModal({
      isOpen: true,
      orderId: order._id,
      title: `Submit ${order.testName} to Lab`,
      action: 'SUBMIT_LAB',
      date: new Date().toISOString().substring(0, 10),
    });
  };

  const handleConfirmDateModal = async (e) => {
    e.preventDefault();
    if (!dateModal.orderId) return;
    if (dateModal.action === 'COLLECT') {
      await handleOrderStatusChange(dateModal.orderId, 'Collected', { sampleCollectedDate: dateModal.date });
    } else if (dateModal.action === 'SUBMIT_LAB') {
      await handleOrderStatusChange(dateModal.orderId, 'Submitted to Lab', { labSubmittedDate: dateModal.date });
    }
    setDateModal({ isOpen: false, orderId: null, title: '', action: '', date: '' });
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
      fetchAllTests();
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
      fetchAllTests();
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
      fetchAllTests();
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-teal-950 font-literata">Diagnostic Test Catalog List</h3>
              <p className="text-xs text-gray-500">
                {totalTests > 0 ? `Showing ${tests.length} of ${totalTests} tests` : 'No diagnostic tests found'}
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by test name, code, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 pr-8 bg-slate-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

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

          <div className="flex-1 overflow-x-auto max-h-[550px] overflow-y-auto pr-1" onScroll={handleScroll}>
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
                <thead className="sticky top-0 bg-white z-10">
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
                          <td className="py-3.5 pr-2 font-semibold text-gray-900">
                            {test.code && (
                              <span className="inline-block mr-2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded">
                                {test.code}
                              </span>
                            )}
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

            {/* Scroll Down Pagination Footer */}
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-teal-600 font-semibold">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                <span>Loading more tests...</span>
              </div>
            )}

            {!loadingMore && page < totalPages && (
              <div className="text-center py-2.5">
                <button
                  type="button"
                  onClick={() => fetchTests(page + 1, searchQuery, true)}
                  className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-colors border border-teal-200"
                >
                  Scroll down or click to load more ({tests.length} of {totalTests})
                </button>
              </div>
            )}

            {!loadingMore && page >= totalPages && tests.length > 0 && (
              <div className="text-center py-2.5 text-xs text-gray-400 font-medium">
                ✓ All {totalTests} tests loaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Test Orders List */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <div>
            <h3 className="text-lg font-bold text-teal-950 font-literata">Diagnostic Test Orders</h3>
            <p className="text-xs text-gray-500 mt-0.5">Patient investigations queued from consultations and billing.</p>
          </div>
          {testOrders.length > 0 && (
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full w-fit">
              {testOrders.length} {testOrders.length === 1 ? 'Order' : 'Orders'} Total
            </span>
          )}

        </div>

        <div className="flex-1 overflow-x-auto">
          {orderLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : testOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No diagnostic test orders queued.</p>
              <p className="text-gray-400 text-xs mt-1">Test orders appear here when prescribed during consultation or billed.</p>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Test</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testOrders.map((order) => (
                  <tr key={order._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 pr-2 font-semibold text-gray-900">{order.patientId?.name || 'Walk-in'}</td>
                    <td className="py-3.5 pr-2 text-gray-700 font-medium">{order.testName}</td>
                    <td className="py-3.5 pr-2 text-gray-600 text-xs">
                      <div>📅 {order.scheduledDate || order.createdAt ? new Date(order.scheduledDate || order.createdAt).toLocaleDateString() : '—'}</div>
                      {order.sampleCollectedDate && (
                        <div className="text-blue-600 font-semibold text-[11px] mt-0.5">
                          🧪 Sample: {new Date(order.sampleCollectedDate).toLocaleDateString()}
                        </div>
                      )}
                      {order.labSubmittedDate && (
                        <div className="text-purple-600 font-semibold text-[11px] mt-0.5">
                          📤 Lab: {new Date(order.labSubmittedDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-gray-500 text-xs max-w-[200px] truncate">
                      {order.notes || '—'}
                    </td>
                    <td className="py-3.5 pr-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        order.status === 'Reported' || order.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        order.status === 'Submitted to Lab' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        order.status === 'Collected' || order.status === 'Sample Collected' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right flex flex-wrap justify-end gap-1.5">
                      {order.status === 'Ordered' && (
                        <button
                          onClick={() => openCollectDialog(order)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs py-1 px-2.5 rounded-lg border border-blue-100 cursor-pointer font-semibold"
                        >
                          🧪 Collect Sample
                        </button>
                      )}
                      {(order.status === 'Collected' || order.status === 'Sample Collected') && (
                        <>
                          <button
                            onClick={() => openSubmitLabDialog(order)}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs py-1 px-2.5 rounded-lg border border-purple-100 cursor-pointer font-semibold"
                          >
                            📤 Submit to Lab
                          </button>
                          <button
                            onClick={() => handleOrderStatusChange(order._id, 'Reported')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 text-xs py-1 px-2.5 rounded-lg border border-green-100 cursor-pointer font-semibold"
                          >
                            Mark Reported
                          </button>
                        </>
                      )}
                      {order.status === 'Submitted to Lab' && (
                        <button
                          onClick={() => handleOrderStatusChange(order._id, 'Reported')}
                          className="bg-green-50 text-green-700 hover:bg-green-100 text-xs py-1 px-2.5 rounded-lg border border-green-100 cursor-pointer font-semibold"
                        >
                          ✓ Mark Reported
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

      {/* Date Selection Modal */}
      {dateModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-fadeIn">
            <h4 className="text-base font-bold text-gray-900 mb-2">{dateModal.title}</h4>
            <p className="text-xs text-gray-500 mb-4">
              {dateModal.action === 'COLLECT'
                ? 'Specify the date when the diagnostic sample was collected from the patient.'
                : 'Specify the date when the sample was handed over / submitted to the pathology lab.'}
            </p>
            <form onSubmit={handleConfirmDateModal}>
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={dateModal.date}
                  onChange={(e) => setDateModal((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDateModal({ isOpen: false, orderId: null, title: '', action: '', date: '' })}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-sm"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdDiagnosticTests;
