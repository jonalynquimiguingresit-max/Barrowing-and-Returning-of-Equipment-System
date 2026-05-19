'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Subscribes to notifications for a user. If `isAdmin` is true, also subscribe
// to admin action notifications (type == 'action_required') so admins receive
// borrow approval requests even when the notification.userId isn't their uid.
export function useNotifications(userId, isAdmin = false) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const subsRef = useRef([]);

  useEffect(() => {
    // cleanup any existing subscriptions
    subsRef.current.forEach((u) => u());
    subsRef.current = [];

    if (!userId && !isAdmin) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const docsMap = new Map();

    const pushSnapshot = (snapshot) => {
      snapshot.docs.forEach((d) => {
        docsMap.set(d.id, { id: d.id, ...d.data() });
      });
      // produce sorted array by createdAt desc
      const arr = Array.from(docsMap.values()).sort((a, b) => {
        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tb - ta;
      });
      setNotifications(arr);
      setLoading(false);
    };

    // Subscribe to notifications targeted at the user
    if (userId) {
      const qUser = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const unsubUser = onSnapshot(
        qUser,
        (snap) => pushSnapshot(snap),
        (err) => {
          console.error('Failed to load user notifications:', err);
          setLoading(false);
        }
      );
      subsRef.current.push(unsubUser);
    }

    // If admin, also subscribe to action_required notifications (approval requests)
    if (isAdmin) {
      const qAdmin = query(
        collection(db, 'notifications'),
        where('type', '==', 'action_required'),
        orderBy('createdAt', 'desc')
      );
      const unsubAdmin = onSnapshot(
        qAdmin,
        (snap) => pushSnapshot(snap),
        (err) => {
          console.error('Failed to load admin notifications:', err);
          setLoading(false);
        }
      );
      subsRef.current.push(unsubAdmin);
    }

    return () => {
      subsRef.current.forEach((u) => u());
      subsRef.current = [];
    };
  }, [userId, isAdmin]);

  return { notifications, loading };
}
