// Firebase Firestore Collections for Equipment Borrowing System

/*
COLLECTIONS STRUCTURE:

1. equipment (Store all equipment items)
   - id: auto-generated
   - name: string
   - description: string
   - category: string (e.g., "tools", "devices", "furniture")
   - quantity: number (total available)
   - borrowedCount: number
   - status: string ("available", "unavailable")
   - createdAt: timestamp
   - updatedAt: timestamp

2. users (Store user information)
   - uid: string (from Firebase Auth)
   - email: string
   - name: string
   - role: string ("admin", "user")
   - department: string
   - phone: string
   - createdAt: timestamp

3. borrowRecords (Store borrowing history)
   - id: auto-generated
   - userId: string (reference to users)
   - equipmentId: string (reference to equipment)
   - borrowDate: timestamp
   - expectedReturnDate: timestamp
   - actualReturnDate: timestamp (null if not returned)
   - status: string ("borrowed", "returned", "overdue")
   - notes: string
   - createdAt: timestamp

4. returnRecords (Store return transactions)
   - id: auto-generated
   - borrowRecordId: string (reference to borrowRecords)
   - userId: string (who returned it)
   - condition: string ("good", "damaged", "lost")
   - damageNotes: string
   - returnedAt: timestamp

Example usage in your components:
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

async function getEquipment() {
  const querySnapshot = await getDocs(collection(db, 'equipment'));
  const items = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() });
  });
  return items;
}
*/
