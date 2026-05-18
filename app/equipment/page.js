'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useEquipment } from '@/lib/useFirebase';
import { useState } from 'react';
import Link from 'next/link';

export default function EquipmentPage() {
  const { equipment, loading, error } = useEquipment();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const availableCount = item.availableCount != null ? item.availableCount : (item.quantity || 1);
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'available'
        ? availableCount > 0
        : availableCount === 0;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Equipment Inventory</h1>
              <p className="text-gray-600">Browse and borrow available equipment</p>
            </div>
            <Link
              href="/borrow"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 btn-hover shadow-lg flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Borrow Equipment</span>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 card-hover">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Equipment
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, category, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                  <div className="absolute left-4 top-3.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="all">All Equipment</option>
                  <option value="available">✅ Available Only</option>
                  <option value="borrowed">🔄 Borrowed Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Equipment</h3>
              <p className="text-gray-600">Please wait while we fetch the latest inventory...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Equipment</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No Equipment Found' : 'No Equipment Available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Equipment will appear here once added to the system'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover group"
                >
                  {/* Equipment Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (item.availableCount != null ? item.availableCount : (item.quantity || 1)) > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {(item.availableCount != null ? item.availableCount : (item.quantity || 1)) > 0
                          ? 'Available'
                          : 'Borrowed'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-blue-600 font-medium capitalize">{item.category || 'General'}</p>
                  </div>

                  {/* Equipment Details */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description || 'No description available'}
                    </p>

                    <div className="mb-3 text-sm text-gray-700">
                      <strong>Quantity:</strong> {item.quantity || 1} · <strong>Available:</strong>{' '}
                      {item.availableCount != null ? item.availableCount : (item.quantity || 1)}
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      {((item.availableCount != null ? item.availableCount : (item.quantity || 1)) > 0) ? (
                        <Link
                          href={`/borrow?equipment=${item.id}`}
                          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 btn-hover shadow-md group-hover:shadow-lg"
                        >
                          <span>Borrow</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center space-x-2 bg-gray-100 text-gray-500 font-medium py-2 px-4 rounded-lg">
                          <span>Unavailable</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Summary */}
          {filteredEquipment.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Showing {filteredEquipment.length} of {equipment.length} equipment items
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
