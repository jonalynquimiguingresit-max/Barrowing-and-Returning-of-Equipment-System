'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ReturnPage() {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Loading return form...</p>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Return Equipment</h1>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : borrowRecord ? (
            <div className="bg-white rounded-lg shadow p-8">
              {/* Equipment Info */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Equipment Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Equipment Name</p>
                    <p className="text-lg font-semibold">{borrowRecord.equipmentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Borrow Date</p>
                    <p className="text-lg font-semibold">
                      {borrowRecord.borrowDate?.toDate
                        ? borrowRecord.borrowDate.toDate().toLocaleDateString()
                        : new Date(borrowRecord.borrowDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Expected Return Date</p>
                    <p className="text-lg font-semibold">
                      {borrowRecord.expectedReturnDate?.toDate
                        ? borrowRecord.expectedReturnDate.toDate().toLocaleDateString()
                        : new Date(borrowRecord.expectedReturnDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-lg font-semibold capitalize">{borrowRecord.status}</p>
                  </div>
                </div>
              </div>

              {/* Return Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Condition *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="good">Good - No damage</option>
                    <option value="minor">Minor - Minor wear/damage</option>
                    <option value="damaged">Damaged - Significant damage</option>
                    <option value="lost">Lost - Equipment lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Damage Notes (if any)
                  </label>
                  <textarea
                    name="damageNotes"
                    value={formData.damageNotes}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe any damage or issues with the equipment..."
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
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {submitting ? 'Processing...' : 'Return Equipment'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedLayout>
  );
}
