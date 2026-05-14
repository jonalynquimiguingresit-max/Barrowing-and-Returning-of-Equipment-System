'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout, loading } = useAuthContext();
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
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">⚙️ Equipment System</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              Dashboard
            </Link>
            <Link
              href="/equipment"
              className="hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              Equipment
            </Link>
            <Link
              href="/my-borrows"
              className="hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              My Borrows
            </Link>
            <Link
              href="/history"
              className="hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              History
            </Link>
            <span className="text-sm text-blue-100">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition font-semibold"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/dashboard"
              className="block hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              Dashboard
            </Link>
            <Link
              href="/equipment"
              className="block hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              Equipment
            </Link>
            <Link
              href="/my-borrows"
              className="block hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              My Borrows
            </Link>
            <Link
              href="/history"
              className="block hover:bg-blue-700 px-3 py-2 rounded transition"
            >
              History
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition font-semibold"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
