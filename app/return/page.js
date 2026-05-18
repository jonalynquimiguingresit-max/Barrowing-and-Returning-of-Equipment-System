'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function ReturnForm() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const borrowId = searchParams.get('borrow');

  const [borrowRecord, setBorrowRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    condition: 'good',
    damageNotes: '',
  });

  useEffect(() => {
    const fetchBorrowRecord = async () => {
      try {
        if (!borrowId) {
          setError('No borrow record specified');
          setLoading(false);
          return;
        }

        // Query Firestore for the borrow record
        const q = query(
          collection(db, 'borrowRecords'),
          where('__name__', '==', borrowId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Borrow record not found');
        } else {
          const record = querySnapshot.docs[0];
          setBorrowRecord({ id: record.id, ...record.data() });
        }
      } catch (err) {
        console.error('Error fetching borrow record:', err);
        setError('Failed to load borrow record');
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowRecord();
  }, [borrowId]);

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
    setSubmitting(true);

    try {
      if (!borrowRecord) {
        throw new Error('No borrow record loaded');
      }

      // Update the borrow record
      const borrowDocRef = doc(db, 'borrowRecords', borrowRecord.id);
      await updateDoc(borrowDocRef, {
        actualReturnDate: new Date(formData.returnDate),
        status: 'returned',
        condition: formData.condition,
        damageNotes: formData.damageNotes,
        updatedAt: serverTimestamp(),
      });

      // Update equipment available count and status on return
      try {
        const equipmentRef = doc(db, 'equipment', borrowRecord.equipmentId);
        const snap = await getDoc(equipmentRef);
        const data = snap.exists() ? snap.data() : {};
        const qty = data.quantity != null ? parseInt(data.quantity) : 1;
        const oldAvailable = data.availableCount != null ? parseInt(data.availableCount) : 0;
        // On return, increase available count by 1 but do not exceed total quantity
        let newAvailable = oldAvailable + 1;
        if (newAvailable > qty) newAvailable = qty;
        const equipmentStatus = formData.condition === 'lost' ? 'lost' : (newAvailable > 0 ? 'available' : 'borrowed');
        const updatePayload = {
          availableCount: newAvailable,
          status: equipmentStatus,
          updatedAt: serverTimestamp(),
        };
        if (qty === 1) {
          updatePayload.currentBorrower = null;
          updatePayload.currentBorrowerEmail = null;
        }
        await updateDoc(equipmentRef, updatePayload);
      } catch (err) {
        console.error('Failed to update equipment status on return:', err);
      }

      setSuccess('Equipment returned successfully! Thank you!');
      setTimeout(() => {
        router.push('/my-borrows');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to return equipment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Return Form</h3>
            <p className="text-gray-600">Please wait while we load the equipment details...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-6">
              <span className="text-4xl">↩️</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Return Equipment</h1>
            <p className="text-gray-600">Complete the return process for your borrowed item</p>
          </div>

          {error ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center card-hover">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Equipment</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : borrowRecord ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
              {/* Equipment Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{borrowRecord.equipmentName}</h2>
                    <p className="text-gray-600">Equipment Return Form</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-70 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Borrow Date</p>
                    <p className="font-semibold text-gray-900">
                      {borrowRecord.borrowDate?.toDate
                        ? borrowRecord.borrowDate.toDate().toLocaleDateString()
                        : new Date(borrowRecord.borrowDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-70 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Return</p>
                    <p className="font-semibold text-gray-900">
                      {borrowRecord.expectedReturnDate?.toDate
                        ? borrowRecord.expectedReturnDate.toDate().toLocaleDateString()
                        : new Date(borrowRecord.expectedReturnDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Form */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Return Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Return Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                      <div className="absolute left-4 top-3.5 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Equipment Condition *
                    </label>
                    <div className="relative">
                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                      >
                        <option value="good">Good - No damage</option>
                        <option value="minor">Minor - Minor wear/damage</option>
                        <option value="damaged">Damaged - Significant damage</option>
                        <option value="lost">Lost - Equipment lost</option>
                      </select>
                      <div className="absolute left-4 top-3.5 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute right-4 top-3.5 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Damage Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Damage Notes (if any)
                    </label>
                    <div className="relative">
                      <textarea
                        name="damageNotes"
                        value={formData.damageNotes}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe any damage or issues with the equipment..."
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
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 btn-hover shadow-lg disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing Return...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>↩️</span>
                        <span>Return Equipment</span>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedLayout>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReturnForm />
    </Suspense>
  );
}
