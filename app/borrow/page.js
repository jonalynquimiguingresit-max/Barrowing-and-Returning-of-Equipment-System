'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEquipment } from '@/lib/useFirebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BorrowPage() {
  const { user } = useAuthContext();
  const { equipment } = useEquipment();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    equipmentId: searchParams.get('equipment') || '',
    borrowDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableEquipment = equipment.filter((e) => e.status === 'available');

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
    setLoading(true);

    try {
      if (!formData.equipmentId) {
        throw new Error('Please select equipment');
      }

      if (!formData.expectedReturnDate) {
        throw new Error('Please enter expected return date');
      }

      const selectedEquipment = equipment.find((e) => e.id === formData.equipmentId);
      if (!selectedEquipment) {
        throw new Error('Equipment not found');
      }

      // Add borrow record to Firestore
      await addDoc(collection(db, 'borrowRecords'), {
        userId: user.uid,
        userEmail: user.email,
        equipmentId: formData.equipmentId,
        equipmentName: selectedEquipment.name,
        borrowDate: new Date(formData.borrowDate),
        expectedReturnDate: new Date(formData.expectedReturnDate),
        actualReturnDate: null,
        status: 'borrowed',
        notes: formData.notes,
        createdAt: serverTimestamp(),
      });

      setSuccess('Equipment borrowed successfully! You can now manage your borrowed items.');
      setFormData({
        equipmentId: '',
        borrowDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: '',
        notes: '',
      });

      setTimeout(() => {
        router.push('/my-borrows');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to borrow equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Borrow Equipment</h1>

          <div className="bg-white rounded-lg shadow p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Equipment *
                </label>
                <select
                  name="equipmentId"
                  value={formData.equipmentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Choose Equipment --</option>
                  {availableEquipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Borrow Date
                </label>
                <input
                  type="date"
                  name="borrowDate"
                  value={formData.borrowDate}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Return Date *
                </label>
                <input
                  type="date"
                  name="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={handleChange}
                  required
                  min={formData.borrowDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Purpose (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe the purpose or any special requirements..."
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
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Processing...' : 'Borrow Equipment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
