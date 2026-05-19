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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600">Complete record of all your equipment borrowing activities</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading History</h3>
              <p className="text-gray-600">Retrieving your transaction records...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading History</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transaction History</h3>
              <p className="text-gray-600">You haven't borrowed any equipment yet. Start by browsing available items.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden card-hover">
              {/* Desktop/table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Equipment
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Borrow Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Expected Return
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actual Return
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Days Borrowed
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Condition
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm">🔧</span>
                            </div>
                            <span className="font-semibold text-gray-900">{record.equipmentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.borrowDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.expectedReturnDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.actualReturnDate) || 'Not returned'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getDaysBorrowed(record.borrowDate, record.actualReturnDate || record.expectedReturnDate)} days
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.condition === 'good'
                                ? 'bg-green-100 text-green-800'
                                : record.condition === 'minor'
                                ? 'bg-yellow-100 text-yellow-800'
                                : record.condition === 'damaged'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {record.condition ? record.condition.charAt(0).toUpperCase() + record.condition.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'returned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {record.status === 'returned' ? 'Returned' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/card view */}
              <div className="md:hidden space-y-3 p-3">
                {records.map((record) => (
                  <div key={record.id} className="bg-white border rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm">🔧</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{record.equipmentName}</div>
                          <div className="text-xs text-gray-500">Borrowed: {formatDate(record.borrowDate)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{record.status === 'returned' ? 'Returned' : 'Active'}</div>
                        <div className="text-xs text-gray-500">{getDaysBorrowed(record.borrowDate, record.actualReturnDate || record.expectedReturnDate)} days</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div><strong>Expected:</strong> {formatDate(record.expectedReturnDate)}</div>
                      <div><strong>Actual:</strong> {record.actualReturnDate ? formatDate(record.actualReturnDate) : 'Not returned'}</div>
                      <div><strong>Condition:</strong> {record.condition ? record.condition.charAt(0).toUpperCase() + record.condition.slice(1) : 'N/A'}</div>
                      <div><strong>Days:</strong> {getDaysBorrowed(record.borrowDate, record.actualReturnDate || record.expectedReturnDate)} days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {records.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 card-hover">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 card-hover">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{records.filter(r => r.status === 'returned').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 card-hover">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🔄</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{records.filter(r => r.status === 'borrowed').length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
