'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBorrowRecords } from '@/lib/useFirebase';
import Link from 'next/link';

export default function MyBorrowsPage() {
  const { user } = useAuthContext();
  const { records, loading, error } = useBorrowRecords(user?.uid);

  const activeBorrows = records.filter((r) => r.status === 'borrowed');
  const returnedBorrows = records.filter((r) => r.status === 'returned');

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (expectedReturnDate) => {
    if (!expectedReturnDate) return false;
    const returnDate = expectedReturnDate.toDate
      ? expectedReturnDate.toDate()
      : new Date(expectedReturnDate);
    return returnDate < new Date();
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Borrowed Items</h1>
            <Link
              href="/borrow"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              + Borrow More
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading your borrowed items...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
          ) : (
            <>
              {/* Active Borrows */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  📦 Currently Borrowed ({activeBorrows.length})
                </h2>
                {activeBorrows.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-700">You have no active borrows</p>
                    <Link
                      href="/equipment"
                      className="text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Browse equipment →
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeBorrows.map((record) => (
                      <div
                        key={record.id}
                        className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                          isOverdue(record.expectedReturnDate)
                            ? 'border-red-500'
                            : 'border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {record.equipmentName}
                            </h3>
                            <p className="text-gray-600 text-sm">ID: {record.equipmentId}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              isOverdue(record.expectedReturnDate)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isOverdue(record.expectedReturnDate) ? '⚠️ Overdue' : '✅ On Time'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-600">Borrow Date</p>
                            <p className="font-semibold">{formatDate(record.borrowDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Due Date</p>
                            <p className="font-semibold">{formatDate(record.expectedReturnDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Days Left</p>
                            <p className="font-semibold">
                              {record.expectedReturnDate
                                ? Math.ceil(
                                    (new Date(
                                      record.expectedReturnDate.toDate
                                        ? record.expectedReturnDate.toDate()
                                        : record.expectedReturnDate
                                    ) -
                                      new Date()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-semibold capitalize">{record.status}</p>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {record.notes}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/return?borrow=${record.id}`}
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          Return Equipment
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Returned Borrows */}
              {returnedBorrows.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    ✅ Returned ({returnedBorrows.length})
                  </h2>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Equipment
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Borrowed
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Returned
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnedBorrows.map((record) => (
                          <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {record.equipmentName}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {formatDate(record.borrowDate)}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {formatDate(record.actualReturnDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
