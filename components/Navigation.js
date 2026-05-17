'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout, loading, isAdmin } = useAuthContext();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return <div className="bg-blue-600 h-16"></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-200">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">EquipTrack</span>
              <div className="text-xs text-blue-100 opacity-75">Management System</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-25 hover:text-blue-900 transition-all duration-200 font-medium"
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/equipment"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-25 hover:text-blue-900 transition-all duration-200 font-medium"
            >
              <span>🔧</span>
              <span>Equipment</span>
            </Link>
            <Link
              href="/my-borrows"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-25 hover:text-blue-900 transition-all duration-200 font-medium"
            >
              <span>📋</span>
              <span>My Borrows</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-25 hover:text-blue-900 transition-all duration-200 font-medium"
            >
              <span>📊</span>
              <span>History</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/equipment"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-blue-900 transition-all duration-200 font-semibold shadow-md"
              >
                <span>⚡</span>
                <span>Admin Panel</span>
              </Link>
            )}

            <div className="ml-4 pl-4 border-l border-white border-opacity-20">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{user?.email?.split('@')[0]}</div>
                  <div className="text-xs text-blue-100 opacity-75">
                    {isAdmin ? 'Administrator' : 'User'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md btn-hover"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/equipment"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>🔧</span>
              <span>Equipment</span>
            </Link>
            <Link
              href="/my-borrows"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📋</span>
              <span>My Borrows</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📊</span>
              <span>History</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/equipment"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-blue-900 transition-all duration-200 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>⚡</span>
                <span>Admin Panel</span>
              </Link>
            )}

            <div className="border-t border-white border-opacity-20 mt-4 pt-4">
              <div className="px-4 py-2">
                <div className="text-sm font-medium">{user?.email?.split('@')[0]}</div>
                <div className="text-xs text-blue-100 opacity-75">
                  {isAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left bg-red-500 hover:bg-red-600 px-4 py-3 rounded-lg transition-all duration-200 font-medium mt-2"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
