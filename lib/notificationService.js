import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function sendUserNotification(userId, message, type = 'info', relatedId = null) {
  if (!userId) return null;
  const payload = {
    userId,
    message,
    type,
    relatedId: relatedId || null,
    isRead: false,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'notifications'), payload);
  const id = ref.id;
  try {
    // also write a copy inside the user's notifications subcollection for robustness
    await setDoc(doc(db, 'users', userId, 'notifications', id), { ...payload, createdAt: serverTimestamp() });
  } catch (err) {
    // best-effort; log and continue
    console.warn('Failed to write user subcollection notification:', err);
  }
  return id;
}

export async function sendNotificationToAdmins(message, type = 'action_required', relatedId = null) {
  const usersQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
  let querySnapshot = await getDocs(usersQuery);
  let adminDocs = querySnapshot.docs;

  if (adminDocs.length === 0) {
    // Fallback to known admin email addresses if role-based admin documents are missing.
    const adminEmails = ['admin@school.local', 'superadmin@school.local'];
    const fallbackQuery = query(collection(db, 'users'), where('email', 'in', adminEmails));
    const fallbackSnapshot = await getDocs(fallbackQuery);
    adminDocs = fallbackSnapshot.docs;
  }

  if (adminDocs.length === 0) {
    console.warn('No admin users found to notify');
    return;
  }

  const writes = [];
  adminDocs.forEach((docItem) => {
    const adminId = docItem.id;
    writes.push(sendUserNotification(adminId, message, type, relatedId));
  });
  await Promise.all(writes);
}

export async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { isRead: true });
}

export async function markAllNotificationsRead(userId) {
  if (!userId) return;
  const notifQuery = query(collection(db, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
  const querySnapshot = await getDocs(notifQuery);
  const writes = [];
  querySnapshot.forEach((docItem) => {
    const ref = doc(db, 'notifications', docItem.id);
    writes.push(updateDoc(ref, { isRead: true }));
  });
  await Promise.all(writes);
}

export async function getBorrowRequestById(requestId) {
  if (!requestId) return null;
  const requestRef = doc(db, 'borrowRecords', requestId);
  const result = await getDoc(requestRef);
  return result.exists() ? { id: result.id, ...result.data() } : null;
}
