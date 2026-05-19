'use client';

import React, { useEffect, useState, useRef } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { sendUserNotification } from '@/lib/notificationService';

export default function AdminDueManager() {
  const { user, isAdmin } = useAuthContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const subsRef = useRef(null);

  // threshold in milliseconds (default 48 hours)
  const THRESHOLD_MS = 48 * 60 * 60 * 1000;

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);

    const q = query(
      collection(db, 'borrowRecords'),
      where('status', '==', 'borrowed'),
      orderBy('expectedReturnDate', 'asc')
    );

    subsRef.current = onSnapshot(q, async (snap) => {
      const now = Date.now();
      const near = [];
      for (const d of snap.docs) {
        const data = { id: d.id, ...d.data() };
        // normalize Timestamp -> millis
        const due = data.expectedReturnDate && data.expectedReturnDate.toMillis ? data.expectedReturnDate.toMillis() : (data.expectedReturnDate || 0);
        const msToDue = due - now;
        if (msToDue <= THRESHOLD_MS) {
          near.push({ ...data, msToDue });
          // if reminder not yet sent, send one now
          if (!data.reminderSentAt) {
            try {
              await sendUserNotification(data.userId, `Reminder: your borrowed item \"${data.equipmentName}\" is due soon (${new Date(due).toLocaleString()}). Please return or request an extension.`, 'info', d.id);
              // mark reminderSentAt to avoid duplicates
              await updateDoc(doc(db, 'borrowRecords', d.id), { reminderSentAt: serverTimestamp() });
            } catch (err) {
              console.error('Failed to send due reminder for', d.id, err);
            }
          }
        }
      }
      setItems(near);
      setLoading(false);
    }, (err) => {
      console.error('Failed to subscribe to borrowRecords for due items', err);
      setLoading(false);
    });

    return () => {
      if (subsRef.current) subsRef.current();
    };
  }, [isAdmin]);

  const sendReminder = async (record) => {
    try {
      await sendUserNotification(record.userId, `Reminder: your borrowed item \"${record.equipmentName}\" is due on ${new Date(record.expectedReturnDate.toMillis()).toLocaleString()}.`, 'info', record.id);
      await updateDoc(doc(db, 'borrowRecords', record.id), { reminderSentAt: serverTimestamp() });
    } catch (err) {
      console.error('Failed to send manual reminder', err);
    }
  };

  const extendDue = async (record, days = 2) => {
    try {
      const old = record.expectedReturnDate.toMillis();
      const next = new Date(old + days * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'borrowRecords', record.id), { expectedReturnDate: next, updatedAt: serverTimestamp(), reminderSentAt: null });
      await sendUserNotification(record.userId, `The due date for \"${record.equipmentName}\" has been extended to ${next.toLocaleString()}.`, 'info', record.id);
    } catch (err) {
      console.error('Failed to extend due date', err);
    }
  };

  const markReturned = async (record) => {
    try {
      await updateDoc(doc(db, 'borrowRecords', record.id), { status: 'returned', actualReturnDate: serverTimestamp(), updatedAt: serverTimestamp() });
      await sendUserNotification(record.userId, `Thank you — your return for \"${record.equipmentName}\" has been recorded.`, 'success', record.id);
    } catch (err) {
      console.error('Failed to mark returned', err);
    }
  };

  if (!isAdmin) return (
    <ProtectedLayout>
      <div className="p-8">Access denied</div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Near-due Borrowed Items</h1>
            <div className="text-sm text-gray-600">Threshold: {Math.round(THRESHOLD_MS / (1000*60*60))} hours</div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6">No borrowed items are nearing their due date.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.id} className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{it.equipmentName}</div>
                    <div className="text-sm text-gray-600">Borrower: {it.userEmail || it.userName}</div>
                    <div className="text-sm text-gray-600">Due: {new Date(it.expectedReturnDate.toMillis()).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{it.msToDue <= 0 ? 'Overdue' : `${Math.ceil(it.msToDue / (1000*60))} minutes remaining`}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => sendReminder(it)} className="px-3 py-2 bg-blue-600 text-white rounded-full">Send reminder</button>
                    <button onClick={() => extendDue(it, 2)} className="px-3 py-2 bg-yellow-500 text-white rounded-full">Extend 2d</button>
                    <button onClick={() => markReturned(it)} className="px-3 py-2 bg-green-600 text-white rounded-full">Mark returned</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
