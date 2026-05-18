'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEquipment } from '@/lib/useFirebase';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { equipment, loading, error } = useEquipment();

  const stats = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === 'available').length,
    borrowed: equipment.reduce((sum, e) => {
      const qty = e.quantity != null ? parseInt(e.quantity) : 1;
      const available = e.availableCount != null ? parseInt(e.availableCount) : qty;
      return sum + Math.max(0, qty - available);
    }, 0),
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg p-8 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.email?.split('@')[0]}! 👋
                  </h1>
                  <p className="text-lg text-gray-600">Here's what's happening with your equipment today</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 card-hover border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Equipment</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">{stats.total}</p>
                  <p className="text-sm text-gray-600 mt-1">Items in inventory</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 card-hover border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Available</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">{stats.available}</p>
                  <p className="text-sm text-gray-600 mt-1">Ready to borrow</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 card-hover border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Currently Borrowed</p>
                  <p className="text-4xl font-bold text-orange-600 mt-2">{stats.borrowed}</p>
                  <p className="text-sm text-gray-600 mt-1">In use</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🔄</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 card-hover">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/equipment"
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 btn-hover shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🔧</span>
                  <span>View All Equipment</span>
                </div>
              </Link>
              <Link
                href="/borrow"
                className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 btn-hover shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📝</span>
                  <span>Borrow Equipment</span>
                </div>
              </Link>
              <Link
                href="/my-borrows"
                className="group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 btn-hover shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📋</span>
                  <span>My Borrowed Items</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Equipment List Preview */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3">🔧</span>
                    Recent Equipment
                  </h2>
                  <p className="text-gray-600 mt-1">Latest additions to your inventory</p>
                </div>
                <Link
                  href="/equipment"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View all
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading equipment...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium">Error loading equipment</p>
                <p className="text-gray-600 text-sm mt-1">{error}</p>
              </div>
            ) : equipment.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 font-medium">No equipment available</p>
                <p className="text-gray-500 text-sm mt-1">Add some equipment to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Equipment
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Category
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {equipment.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-8 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-lg">🔧</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.description?.substring(0, 40)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                              item.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {item.status === 'available' ? '✅ Available' : '🔄 Borrowed'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          {item.status === 'available' ? (
                            <Link
                              href={`/borrow?equipment=${item.id}`}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150"
                            >
                              Borrow
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500">Unavailable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
