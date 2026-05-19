/*
Local integration test for notification and approval flow.

Requirements:
- Set `GOOGLE_APPLICATION_CREDENTIALS` env var to a Firebase service account JSON file with Firestore access.
- Ensure `FIREBASE_PROJECT_ID` is set in the env or present in the service account.

Run:
  npm install firebase-admin --no-save
  npm run test:notifications

This script will:
- Ensure an admin user exists in `users` collection
- Ensure a borrower user exists
- Create an example `borrowRecords` document with status 'requested'
- Create `notifications` documents for admin users (action_required)
- Simulate admin approving the request: update borrowRecords to 'borrowed', decrement equipment availability (if exists), and create borrower notification
*/

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file.');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (e) {
  // already initialized in some environments
}

const db = admin.firestore();

async function ensureUser(email, role = 'user') {
  const usersRef = db.collection('users');
  const query = await usersRef.where('email', '==', email).limit(1).get();
  if (!query.empty) {
    const doc = query.docs[0];
    await doc.ref.update({ role });
    return { id: doc.id, ...doc.data() };
  }
  const id = uuidv4();
  const data = { uid: id, email, name: email.split('@')[0], role, createdAt: admin.firestore.FieldValue.serverTimestamp() };
  await usersRef.doc(id).set(data);
  return { id, ...data };
}

async function run() {
  console.log('Starting notification flow test...');

  const adminUser = await ensureUser('admin@school.local', 'admin');
  const borrowerUser = await ensureUser('borrower@example.com', 'user');

  console.log('Ensured users:', adminUser.email, borrowerUser.email);

  // create a sample equipment doc if not present
  const equipmentRef = db.collection('equipment').limit(1);
  const equipSnapshot = await equipmentRef.get();
  let equipmentId = null;
  if (equipSnapshot.empty) {
    const newEquipRef = db.collection('equipment').doc();
    await newEquipRef.set({ name: 'Test Camera', category: 'Camera', quantity: 1, availableCount: 1, status: 'available', createdAt: admin.firestore.FieldValue.serverTimestamp() });
    equipmentId = newEquipRef.id;
    console.log('Created sample equipment', equipmentId);
  } else {
    equipmentId = equipSnapshot.docs[0].id;
    console.log('Using existing equipment', equipmentId);
  }

  // create borrow request
  const borrowRef = db.collection('borrowRecords').doc();
  const borrowData = {
    userId: borrowerUser.id,
    userEmail: borrowerUser.email,
    equipmentId: equipmentId,
    equipmentName: 'Test Camera',
    borrowDate: admin.firestore.Timestamp.now(),
    expectedReturnDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)),
    actualReturnDate: null,
    status: 'requested',
    notes: 'Integration test request',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await borrowRef.set(borrowData);
  console.log('Created borrow request', borrowRef.id);

  // create notifications for all admins
  const adminDocs = await db.collection('users').where('role', '==', 'admin').get();
  if (adminDocs.empty) {
    console.warn('No admin documents found; aborting admin notification creation');
  } else {
    const batch = db.batch();
    adminDocs.forEach((d) => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: d.id,
        message: `Borrow request for \"${borrowData.equipmentName}\" by ${borrowData.userEmail} requires approval.`,
        type: 'action_required',
        relatedId: borrowRef.id,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    console.log('Created admin notifications for request.');
  }

  // Simulate admin approving the request
  console.log('Simulating admin approval...');
  // decrement equipment availableCount if exists
  const equipmentDoc = await db.collection('equipment').doc(equipmentId).get();
  if (equipmentDoc.exists) {
    const eq = equipmentDoc.data();
    const available = eq.availableCount != null ? eq.availableCount : (eq.quantity || 1);
    if (available > 0) {
      await equipmentDoc.ref.update({ availableCount: available - 1, status: available - 1 > 0 ? 'available' : 'borrowed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log('Updated equipment availability.');
    } else {
      console.warn('Equipment not available to decrement');
    }
  }

  await db.collection('borrowRecords').doc(borrowRef.id).update({ status: 'borrowed', approvedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('Borrow request status updated to borrowed');

  // notify borrower
  const borrowerNotifRef = db.collection('notifications').doc();
  await borrowerNotifRef.set({
    userId: borrowerUser.id,
    message: 'Your equipment borrowing request has been approved.',
    type: 'success',
    relatedId: borrowRef.id,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Sent borrower approval notification.');

  console.log('Integration test completed.');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
