'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminEquipmentPage() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 1,
    status: 'available',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check admin access
  if (authLoading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Admin Panel</h3>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center card-hover max-w-xl">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
            <p className="text-gray-600 mb-4">This section is restricted to administrator accounts only.</p>
            <p className="text-gray-600 mb-8">
              Register with <span className="font-semibold">admin@school.local</span> or <span className="font-semibold">superadmin@school.local</span> and password <span className="font-semibold">Admin@123</span> to enable admin privileges.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg"
              >
                Create Admin Account
              </Link>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'equipment'));
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setEquipment(items);
    } catch (err) {
      setError('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update existing equipment with quantity adjustments
        const docRef = doc(db, 'equipment', editingId);
        const snap = await getDoc(docRef);
        const existing = snap.exists() ? snap.data() : {};
        const oldQuantity = existing.quantity ? parseInt(existing.quantity) : 1;
        const oldAvailable = existing.availableCount != null ? parseInt(existing.availableCount) : oldQuantity;
        const newQuantity = parseInt(formData.quantity);
        const delta = newQuantity - oldQuantity;
        let newAvailable = oldAvailable + delta;
        if (newAvailable > newQuantity) newAvailable = newQuantity;
        if (newAvailable < 0) newAvailable = 0;

        await updateDoc(docRef, {
          ...formData,
          quantity: newQuantity,
          availableCount: newAvailable,
          status: newAvailable > 0 ? 'available' : 'borrowed',
          updatedAt: serverTimestamp(),
        });
        setSuccess('Equipment updated successfully!');
        notify({ type: 'success', message: 'Equipment updated successfully!' });
      } else {
        // Add new equipment
        const qty = parseInt(formData.quantity);
        await addDoc(collection(db, 'equipment'), {
          ...formData,
          quantity: qty,
          availableCount: qty,
          status: qty > 0 ? 'available' : 'borrowed',
          createdAt: serverTimestamp(),
        });
        setSuccess('Equipment added successfully!');
        notify({ type: 'success', message: 'Equipment added successfully!' });
      }

      setFormData({
        name: '',
        category: '',
        description: '',
        quantity: 1,
        status: 'available',
      });
      setEditingId(null);
      setShowForm(false);
      loadEquipment();
    } catch (err) {
      setError(err.message || 'Failed to save equipment');
      notify({ type: 'error', message: err.message || 'Failed to save equipment' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteDoc(doc(db, 'equipment', id));
        setSuccess('Equipment deleted successfully!');
        notify({ type: 'success', message: 'Equipment deleted successfully!' });
        loadEquipment();
      } catch (err) {
        setError('Failed to delete equipment');
        notify({ type: 'error', message: 'Failed to delete equipment' });
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      status: item.status || 'available',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  return (
    <ProtectedLayout requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Equipment Management</h1>
              </div>
              <p className="text-gray-600">Admin panel for managing equipment inventory</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadEquipment}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    category: '',
                    description: '',
                    quantity: 1,
                    status: 'available',
                  });
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg flex items-center space-x-2"
              >
                <span>{showForm ? '✕' : '➕'}</span>
                <span>{showForm ? 'Cancel' : 'Add Equipment'}</span>
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., Laptop, Projector"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="borrowed">Borrowed</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {editingId ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </form>
            </div>
          )}

          {/* Equipment List */}
          {(success || error) && (
            <div className="mb-6">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-600">Loading equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="p-6 text-center text-gray-600">No equipment found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.quantity || 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.availableCount != null ? item.availableCount : (item.quantity || 1)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              item.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'borrowed'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 font-semibold"
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

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">
              <strong>Note:</strong> This is a basic admin panel. In production, add role-based access
              control to restrict this page to admin users only.
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
