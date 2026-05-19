 'use client';

import { useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/useNotifications';
import { markNotificationRead, sendUserNotification } from '@/lib/notificationService';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';

export default function NotificationsPage() {
  const { user, isAdmin } = useAuthContext();
  const { notifications, loading } = useNotifications(user?.uid, isAdmin);
  const [processing, setProcessing] = useState(false);
  const { notify } = useNotification();

  const createActionNotification = async (borrowReq, approved) => {
    const message = approved
      ? 'Your equipment borrowing request has been approved.'
      : 'Your equipment borrowing request has been rejected.';
    try {
      const notifId = await sendUserNotification(borrowReq.userId, message, approved ? 'success' : 'error', borrowReq.id);
      if (!notifId) throw new Error('sendUserNotification returned no id');
      return notifId;
    } catch (err) {
      console.error('Failed to send borrower notification:', err);
      // notify admin in UI that borrower notification failed
      try {
        notify({ type: 'error', message: 'Failed to notify borrower about this decision.' });
      } catch (e) {
        console.error('Notification UI unavailable:', e);
      }
      throw err;
    }
  };

  const handleApprove = async (notification) => {
    if (!notification.relatedId || processing) return;
    setProcessing(true);
    try {
      const borrowDocRef = doc(db, 'borrowRecords', notification.relatedId);
      const borrowSnapshot = await getDoc(borrowDocRef);
      if (!borrowSnapshot.exists()) {
        throw new Error('Borrow request not found');
      }
      const borrowData = borrowSnapshot.data();
      if (borrowData.status !== 'requested') {
        throw new Error('Request is no longer pending');
      }

      const equipmentRef = doc(db, 'equipment', borrowData.equipmentId);
      const equipmentSnapshot = await getDoc(equipmentRef);
      if (!equipmentSnapshot.exists()) {
        throw new Error('Related equipment not found');
      }
      const equipmentData = equipmentSnapshot.data();
      const qty = equipmentData.quantity != null ? parseInt(equipmentData.quantity) : 1;
      const available = equipmentData.availableCount != null ? parseInt(equipmentData.availableCount) : qty;
      if (available <= 0) {
        throw new Error('Equipment is no longer available');
      }
      const newAvailable = available - 1;
      const newStatus = newAvailable > 0 ? 'available' : 'borrowed';
      const updatePayload = {
        availableCount: newAvailable,
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (qty === 1) {
        updatePayload.currentBorrower = borrowData.userId;
        updatePayload.currentBorrowerEmail = borrowData.userEmail;
      }
      await updateDoc(equipmentRef, updatePayload);
      await updateDoc(borrowDocRef, {
        status: 'borrowed',
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
      });
      await createActionNotification({ ...borrowData, id: borrowSnapshot.id }, true);
      await markNotificationRead(notification.id);
      notify({ type: 'success', message: 'Borrowing request approved successfully.' });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (notification) => {
    if (!notification.relatedId || processing) return;
    setProcessing(true);
    try {
      const borrowDocRef = doc(db, 'borrowRecords', notification.relatedId);
      const borrowSnapshot = await getDoc(borrowDocRef);
      if (!borrowSnapshot.exists()) {
        throw new Error('Borrow request not found');
      }
      const borrowData = borrowSnapshot.data();
      if (borrowData.status !== 'requested') {
        throw new Error('Request is no longer pending');
      }
      await updateDoc(borrowDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedAt: serverTimestamp(),
      });
      await createActionNotification({ ...borrowData, id: borrowSnapshot.id }, false);
      await markNotificationRead(notification.id);
      notify({ type: 'success', message: 'Borrowing request rejected successfully.' });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to reject request');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">Your system notifications are listed below.</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Notifications</h3>
              <p className="text-gray-600">Please wait while we fetch your notification feed...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center card-hover">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications Yet</h3>
              <p className="text-gray-600">You will see reminders and approvals here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm transition-all duration-200 ${notification.isRead ? 'border-gray-200' : 'border-blue-400 ring-1 ring-blue-100'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '⚠️' : notification.type === 'action_required' ? '🛎️' : '🔔'}</span>
                        <p className="text-base font-semibold text-gray-900">{notification.message}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{notification.type.replace(/_/g, ' ')}</span>
                        <span>{new Date(notification.createdAt?.toDate ? notification.createdAt.toDate() : notification.createdAt).toLocaleString()}</span>
                        {!notification.isRead && <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-800">Unread</span>}
                      </div>
                    </div>
                    {notification.type === 'action_required' && isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(notification)}
                          disabled={processing}
                          className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(notification)}
                          disabled={processing}
                          className="inline-flex items-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
