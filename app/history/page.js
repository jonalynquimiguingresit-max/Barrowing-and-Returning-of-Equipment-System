'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBorrowRecords } from '@/lib/useFirebase';

export default function HistoryPage() {
  const { user } = useAuthContext();
  const { records, loading, error } = useBorrowRecords(user?.uid);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const getDaysBorrowed = (borrowDate, returnDate) => {
    if (!borrowDate || !returnDate) return 'N/A';

    const bDate = borrowDate.toDate ? borrowDate.toDate() : new Date(borrowDate);
    const rDate = returnDate.toDate ? returnDate.toDate() : new Date(returnDate);

    return Math.ceil((rDate - bDate) / (1000 * 60 * 60 * 24));
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Transaction History</h1>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading transaction history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
          ) : records.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-700">No transaction history found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Borrow Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Expected Return
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actual Return
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Days Borrowed
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {record.equipmentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.borrowDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.expectedReturnDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.actualReturnDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getDaysBorrowed(record.borrowDate, record.actualReturnDate || record.expectedReturnDate)}{' '}
                          days
                        </td>
                        <td className="px-6 py-4 text-sm capitalize">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              record.condition === 'good'
                                ? 'bg-green-100 text-green-800'
                                : record.condition === 'minor'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {record.condition || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              record.status === 'returned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {record.status === 'returned' ? '✅ Returned' : '🔄 Borrowed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
