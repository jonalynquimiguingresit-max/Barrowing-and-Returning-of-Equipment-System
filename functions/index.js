const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin SDK (the environment will provide credentials when deployed)
try {
  admin.initializeApp();
} catch (e) {
  // already initialized in some environments
}

const db = admin.firestore();

// Threshold hours before due date to send reminder (can be overridden with env var)
const THRESHOLD_HOURS = parseInt(process.env.REMINDER_THRESHOLD_HOURS || '48', 10);

// Scheduled function: runs every hour and sends reminders for items due within threshold
exports.scheduledDueReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('Running scheduledDueReminders', new Date().toISOString());
    const now = admin.firestore.Timestamp.now();
    const thresholdTs = admin.firestore.Timestamp.fromMillis(now.toMillis() + THRESHOLD_HOURS * 60 * 60 * 1000);

    try {
      // Query borrowRecords where status == 'borrowed' and expectedReturnDate <= threshold
      const q = db.collection('borrowRecords')
        .where('status', '==', 'borrowed')
        .where('expectedReturnDate', '<=', thresholdTs);

      const snap = await q.get();
      console.log(`Found ${snap.size} potentially near-due records`);
      const writes = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const id = docSnap.id;

        // Skip if reminderSentAt already present
        if (data.reminderSentAt) {
          continue;
        }

        const dueTs = data.expectedReturnDate;
        const dueDate = dueTs && dueTs.toDate ? dueTs.toDate() : null;
        const message = `Reminder: your borrowed item "${data.equipmentName}" is due on ${dueDate ? dueDate.toLocaleString() : 'soon'}. Please return or request an extension.`;

        // Create notification document
        const payload = {
          userId: data.userId || null,
          message,
          type: 'info',
          relatedId: id,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const notifRef = await db.collection('notifications').add(payload);
        // also write to user subcollection if possible
        if (data.userId) {
          try {
            await db.collection('users').doc(data.userId).collection('notifications').doc(notifRef.id).set({ ...payload, createdAt: admin.firestore.FieldValue.serverTimestamp() });
          } catch (err) {
            console.warn('Failed to write user subcollection notification:', err);
          }
        }

        // mark reminderSentAt on borrow record to avoid duplicates
        writes.push(db.collection('borrowRecords').doc(id).update({ reminderSentAt: admin.firestore.FieldValue.serverTimestamp() }));
      }

      if (writes.length > 0) await Promise.all(writes);
      console.log('scheduledDueReminders completed');
    } catch (err) {
      console.error('Error running scheduledDueReminders', err);
    }

    return null;
  });
