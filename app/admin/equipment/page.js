'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
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

  // Function to set up admin user (temporary - remove after setup)
  const setupAdminUser = async () => {
    try {
      const adminEmail = 'admin@school.local';
      const adminPassword = 'Admin@123';

      // Show setup instructions
      const instructions = `
ADMIN ACCOUNT SETUP:

1. Go to the registration page
2. Register with:
   Email: ${adminEmail}
   Password: ${adminPassword}

3. After registration, this account will be created as a regular user
4. To make it admin, you need to manually update the user document in Firestore:

   - Go to Firebase Console → Firestore Database
   - Find the users collection
   - Find the document with email: ${adminEmail}
   - Add/update the 'role' field to: "admin"

5. Then refresh this page and you'll have admin access.

Alternatively, you can promote any existing user to admin by updating their role field in Firestore.
      `;

      alert(instructions);
    } catch (error) {
      console.error('Error setting up admin:', error);
    }
  };

  // Check admin access
  if (authLoading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">You don't have permission to access the admin panel.</p>
            <div className="space-y-4">
              <button
                onClick={setupAdminUser}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition mr-4"
              >
                Setup Admin Account
              </button>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition inline-block"
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
        // Update existing equipment
        const docRef = doc(db, 'equipment', editingId);
        await updateDoc(docRef, {
          ...formData,
          quantity: parseInt(formData.quantity),
          updatedAt: serverTimestamp(),
        });
        setSuccess('Equipment updated successfully!');
      } else {
        // Add new equipment
        await addDoc(collection(db, 'equipment'), {
          ...formData,
          quantity: parseInt(formData.quantity),
          createdAt: serverTimestamp(),
        });
        setSuccess('Equipment added successfully!');
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
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteDoc(doc(db, 'equipment', id));
        setSuccess('Equipment deleted successfully!');
        loadEquipment();
      } catch (err) {
        setError('Failed to delete equipment');
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
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Admin - Equipment Management</h1>
            <div className="space-x-4">
              <button
                onClick={loadEquipment}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Refresh
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
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {showForm ? 'Cancel' : '+ Add Equipment'}
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
