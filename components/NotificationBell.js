'use client';

import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/useNotifications';

export default function NotificationBell() {
  const { user } = useAuthContext();
  const { notifications } = useNotifications(user?.uid);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center p-2 rounded-full text-white hover:bg-white hover:bg-opacity-15 transition-all duration-200"
      aria-label="Notifications"
    >
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-red-500 text-white text-[0.65rem] font-semibold px-1.5">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
