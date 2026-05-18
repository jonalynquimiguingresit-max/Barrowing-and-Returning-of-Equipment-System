'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEquipment } from '@/lib/useFirebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BorrowForm() {
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

      // Mark equipment as borrowed and set current borrower info
      try {
        const equipmentRef = doc(db, 'equipment', formData.equipmentId);
        await updateDoc(equipmentRef, {
          status: 'borrowed',
          currentBorrower: user.uid,
          currentBorrowerEmail: user.email,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        // Non-fatal: log but allow borrow record creation to succeed
        console.error('Failed to update equipment status:', err);
      }

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Borrow Equipment</h1>
            <p className="text-gray-600">Fill out the form below to borrow equipment</p>
          </div>

          {/* Borrow Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 card-hover">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Equipment Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Equipment *
                </label>
                <div className="relative">
                  <select
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="">-- Choose Equipment --</option>
                    {availableEquipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-4 top-3.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="absolute right-4 top-3.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Borrow Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="borrowDate"
                      value={formData.borrowDate}
                      onChange={handleChange}
                      disabled
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute left-4 top-3.5 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Expected Return Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="expectedReturnDate"
                      value={formData.expectedReturnDate}
                      onChange={handleChange}
                      required
                      min={formData.borrowDate}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                    <div className="absolute left-4 top-3.5 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Notes / Purpose (Optional)
                </label>
                <div className="relative">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe the purpose or any special requirements..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  />
                  <div className="absolute left-4 top-3.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 btn-hover shadow-lg disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>📝</span>
                    <span>Borrow Equipment</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

export default function BorrowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BorrowForm />
    </Suspense>
  );
}
