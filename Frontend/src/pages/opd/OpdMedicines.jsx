import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OpdMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [editName, setEditName] = useState('');
  const [editStock, setEditStock] = useState('');
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userId = localStorage.getItem('userId');

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const headers = { 'x-user-id': userId };
      const res = await axios.get((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/medicines', { headers });
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [userId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.post((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001') + '/api/opd/medicines', { name, stock: parseInt(stock) || 0 }, { headers });
      setSuccess('Medicine added successfully!');
      setName('');
      setStock('');
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medicine.');
    }
  };

  const handleEditClick = (med) => {
    setEditingId(med._id);
    setEditName(med.name);
    setEditStock(med.stock);
  };

  const handleUpdateSubmit = async (e, id) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/medicines/${id}`, { name: editName, stock: parseInt(editStock) }, { headers });
      setSuccess('Medicine updated successfully!');
      setEditingId(null);
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating medicine.');
    }
  };

  const handleRestockSubmit = async (e, id) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.put(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/medicines/${id}/restock`, { quantity: parseInt(restockQty) }, { headers });
      setSuccess('Stock updated successfully!');
      setRestockId(null);
      setRestockQty('');
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating stock.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine from the catalogue?')) return;
    setError('');
    setSuccess('');

    try {
      const headers = { 'x-user-id': userId };
      await axios.delete(`${import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001'}/api/opd/medicines/${id}`, { headers });
      setSuccess('Medicine deleted successfully!');
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting medicine.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-950 font-literata tracking-tight">Pharmacy Stock</h1>
        <p className="text-gray-500 mt-1 font-dmsans">Manage medicines list and retail price settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Medicine Form */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Add New Medicine</h3>

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
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Medicine Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="Paracetamol 500mg"
              />
            </div>


            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Opening Stock (Units)</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-gray-800"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
            >
              Add Medicine to stock
            </button>
          </form>
        </div>

        {/* Medicines List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-teal-950 mb-6 font-literata">Pharmacy Medicine Catalog List</h3>

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
            ) : medicines.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No medicines registered in stock yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[560px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Medicine Name</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => (
                    <tr key={med._id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                      {editingId === med._id ? (
                        <td colSpan="3" className="py-2">
                          <form onSubmit={(e) => handleUpdateSubmit(e, med._id)} className="flex flex-wrap gap-2 items-center w-full">
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
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-20 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
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
                      ) : restockId === med._id ? (
                        <td colSpan="3" className="py-2">
                          <form onSubmit={(e) => handleRestockSubmit(e, med._id)} className="flex flex-wrap gap-2 items-center w-full">
                            <span className="flex-1 min-w-[150px] text-xs text-gray-600">Add stock for <strong>{med.name}</strong> (current: {med.stock})</span>
                            <input
                              type="number"
                              required
                              min="1"
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              className="w-24 px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs"
                              placeholder="Qty"
                            />
                            <button
                              type="submit"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1 px-2.5 rounded-lg text-xs cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setRestockId(null)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1 px-2.5 rounded-lg text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="py-3.5 pr-2 font-semibold text-gray-900 whitespace-nowrap">
                            {med.name}
                          </td>
                          <td className="py-3.5 pr-2 whitespace-nowrap">
                            <span className={`font-mono font-semibold ${med.stock <= 0 ? 'text-red-500' : med.stock < 10 ? 'text-orange-500' : 'text-gray-700'}`}>
                              {med.stock}
                            </span>
                          </td>
                          <td className="py-3.5 text-right flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => setRestockId(med._id)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => handleEditClick(med)}
                              className="text-teal-600 hover:text-teal-800 text-xs font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(med._id)}
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
    </div>
  );
};

export default OpdMedicines;
