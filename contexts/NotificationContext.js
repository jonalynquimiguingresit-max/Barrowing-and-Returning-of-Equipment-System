"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef({});

  const notify = useCallback(({ type = 'info', message = '', duration = 5000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    setNotifications((prev) => [...prev, { id, type, message }]);

    if (duration > 0) {
      timers.current[id] = {
        timeout: setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          delete timers.current[id];
        }, duration),
        remaining: duration,
        start: Date.now(),
      };
    }

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id].timeout);
      delete timers.current[id];
    }
  }, []);

  const pause = useCallback((id) => {
    const t = timers.current[id];
    if (!t) return;
    // calculate remaining
    const elapsed = Date.now() - (t.start || Date.now());
    const remaining = (t.remaining || 0) - elapsed;
    clearTimeout(t.timeout);
    timers.current[id] = { ...t, remaining: remaining > 0 ? remaining : 0 };
  }, []);

  const resume = useCallback((id) => {
    const t = timers.current[id];
    if (!t || !t.remaining) return;
    timers.current[id] = {
      timeout: setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        delete timers.current[id];
      }, t.remaining),
      remaining: t.remaining,
      start: Date.now(),
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, pause, resume }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
