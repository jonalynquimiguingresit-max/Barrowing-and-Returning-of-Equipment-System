"use client";

import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';

function IconForType(type) {
  if (type === 'success') return '✅';
  if (type === 'error') return '⚠️';
  if (type === 'info') return 'ℹ️';
  return '🔔';
}

export default function Notifications() {
  const { notifications, dismiss, pause, resume } = useNotification();
  if (!notifications || notifications.length === 0) return null;

  return (
    <div aria-live="polite" role="status" className="notifications-container fixed top-4 right-4 z-[9999] space-y-3 max-w-md w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          onMouseEnter={() => pause(n.id)}
          onMouseLeave={() => resume(n.id)}
          className="bg-white border border-gray-200 shadow-md rounded-lg p-3 flex items-start gap-3"
        >
          <div className={`flex-shrink-0 text-lg ${n.type === 'success' ? 'text-green-600' : n.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
            {IconForType(n.type)}
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-900">{n.message}</div>
          </div>
          <button aria-label="close" onClick={() => dismiss(n.id)} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
        </div>
      ))}
    </div>
  );
}
