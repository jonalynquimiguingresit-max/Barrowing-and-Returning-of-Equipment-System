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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Borrowed Items</h1>
              <p className="text-gray-600">Manage your equipment borrowing history</p>
            </div>
            <Link
              href="/borrow"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Borrow More</span>
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Borrows</h3>
              <p className="text-gray-600">Please wait while we fetch your borrowing history...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Borrows</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Active Borrows */}
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Currently Borrowed ({activeBorrows.length})
                  </h2>
                </div>

                {activeBorrows.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center card-hover">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Borrows</h3>
                    <p className="text-gray-600 mb-4">You don't have any equipment currently borrowed</p>
                    <Link
                      href="/equipment"
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 btn-hover shadow-md"
                    >
                      <span>Browse Equipment</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeBorrows.map((record) => (
                      <div
                        key={record.id}
                        className={`bg-white rounded-2xl shadow-lg overflow-hidden card-hover border-l-4 ${
                          isOverdue(record.expectedReturnDate)
                            ? 'border-red-500'
                            : 'border-blue-500'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <span className="text-2xl">🔧</span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isOverdue(record.expectedReturnDate)
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {isOverdue(record.expectedReturnDate) ? '⚠️ Overdue' : '✅ On Time'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{record.equipmentName}</h3>
                          <p className="text-gray-600 text-sm">ID: {record.equipmentId}</p>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Borrow Date</p>
                              <p className="font-semibold text-gray-900">{formatDate(record.borrowDate)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Due Date</p>
                              <p className="font-semibold text-gray-900">{formatDate(record.expectedReturnDate)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Days Left</p>
                              <p className="font-semibold text-gray-900">
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
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                              <p className="font-semibold text-gray-900 capitalize">{record.status}</p>
                            </div>
                          </div>

                          {record.notes && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Notes:</strong> {record.notes}
                              </p>
                            </div>
                          )}

                          <Link
                            href={`/return?borrow=${record.id}`}
                            className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 btn-hover shadow-lg"
                          >
                            <span>↩️</span>
                            <span>Return Equipment</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Returned Borrows */}
              {returnedBorrows.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Returned Items ({returnedBorrows.length})
                    </h2>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              Equipment
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              Borrowed Date
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              Returned Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnedBorrows.map((record) => (
                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">🔧</span>
                                  </div>
                                  <span className="font-medium text-gray-900">{record.equipmentName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(record.borrowDate)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(record.actualReturnDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
