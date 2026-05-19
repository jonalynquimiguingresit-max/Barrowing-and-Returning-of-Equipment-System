 'use client';

import { useState, useEffect } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/useNotifications';
import { deleteNotification, sendUserNotification, markNotificationRead, markAllNotificationsRead } from '@/lib/notificationService';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';

export default function NotificationsPage() {
  const { user, isAdmin } = useAuthContext();
  const { notifications, loading } = useNotifications(user?.uid, isAdmin);
  const [processing, setProcessing] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
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

  const handleMarkRead = async (notification) => {
    if (!notification?.id || notification.isRead) return;
    setMarkingId(notification.id);
    try {
      await markNotificationRead(notification.id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid || notifications.length === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(user.uid);
      notify({ type: 'success', message: 'All notifications marked as read.' });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      notify({ type: 'error', message: 'Unable to mark all notifications as read.' });
    } finally {
      setMarkingAll(false);
    }
  };

  // Remove stale action_required notifications whose related borrow request is no longer pending
  useEffect(() => {
    if (loading || !notifications || notifications.length === 0) return;
    const cleanup = async () => {
      for (const notification of notifications) {
        try {
          if (!notification.relatedId) continue;
          if (notification.type !== 'action_required') continue;
          const borrowDocRef = doc(db, 'borrowRecords', notification.relatedId);
          const borrowSnapshot = await getDoc(borrowDocRef);
          if (!borrowSnapshot.exists()) {
            // related record missing -> remove notification
            await deleteNotification(notification.id);
            continue;
          }
          const borrowData = borrowSnapshot.data();
          if (borrowData.status !== 'requested') {
            // no longer pending, remove the action notification
            await deleteNotification(notification.id);
          }
        } catch (err) {
          console.error('Failed to cleanup stale notification', notification?.id, err);
        }
      }
    };
    cleanup();
  }, [notifications, loading]);

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
      await deleteNotification(notification.id);
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
      await deleteNotification(notification.id);
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
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll || processing}
                className="self-start inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 transition disabled:opacity-50"
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
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
                  onClick={(e) => {
                    if (e.target.closest('button')) return;
                    handleMarkRead(notification);
                  }}
                  className={`cursor-pointer bg-white rounded-3xl border p-5 shadow-sm transition-all duration-200 ${notification.isRead ? 'border-gray-200' : 'border-blue-400 ring-1 ring-blue-100'}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '⚠️' : notification.type === 'action_required' ? '🛎️' : '🔔'}</span>
                        <p className="text-base font-semibold text-gray-900 truncate whitespace-normal break-words">{notification.message}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{notification.type.replace(/_/g, ' ')}</span>
                        <span>{new Date(notification.createdAt?.toDate ? notification.createdAt.toDate() : notification.createdAt).toLocaleString()}</span>
                        {!notification.isRead && <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-800">Unread</span>}
                      </div>
                    </div>
                    {notification.type === 'action_required' && isAdmin && (
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleApprove(notification)}
                          disabled={processing}
                          className="inline-flex justify-center items-center px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 w-full sm:w-auto"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(notification)}
                          disabled={processing}
                          className="inline-flex justify-center items-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 w-full sm:w-auto"
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
