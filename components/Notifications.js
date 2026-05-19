"use client";

import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export default function Notifications() {
  const { notifications, dismiss } = useNotification();
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`max-w-sm w-full shadow-lg rounded-lg p-3 text-sm flex items-start justify-between space-x-3 transition-transform transform`}>
          <div className={`flex-1 mr-3 ${n.type === 'success' ? 'text-green-800 bg-green-50 border border-green-200' : n.type === 'error' ? 'text-red-800 bg-red-50 border border-red-200' : 'text-gray-900 bg-white border border-gray-200'}`} style={{ padding: '8px', borderRadius: '8px' }}>
            {n.message}
          </div>
          <button aria-label="close" onClick={() => dismiss(n.id)} className="text-gray-500 hover:text-gray-700 ml-2">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
