# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "Equipment-Borrowing-System")
4. Accept the terms and create the project
5. Wait for the project to be created

## Step 2: Create a Web App

1. In Firebase Console, click the gear icon ⚙️ → Project Settings
2. Under "Your apps", click "Add app" → Web (</>)
3. Register your app with a nickname (e.g., "Equipment Borrowing Web")
4. Copy the Firebase config object

## Step 3: Add Firebase Config to Your Project

1. Create a `.env.local` file in your project root (copy from `.env.local.example`)
2. Paste the Firebase config values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

## Step 4: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your region
5. Click "Enable"

## Step 5: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

## Step 6: Create Firestore Collections (Optional - can be done via code)

You can either:
- Create collections manually in Firebase Console
- Use your app code to create documents which will auto-create collections

See `lib/firebaseCollections.md` for the recommended schema.

## Step 7: Set Up Rules (Important for Security)

1. In Firestore Database → Rules tab
2. Replace with appropriate security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow everyone to read equipment
    match /equipment/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }
    
    // Allow users to read/write their own borrow records
    match /borrowRecords/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow read: if request.auth.uid != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 8: Test Your Setup

Create a test file or use the existing page component:

```javascript
import { useEquipment } from '@/lib/useFirebase';

export default function Home() {
  const { equipment, loading, error } = useEquipment();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Equipment List</h1>
      {equipment.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Troubleshooting

- **"process.env is not defined"**: Make sure environment variables start with `NEXT_PUBLIC_` to be accessible in the browser
- **"Firebase app not initialized"**: Check that your `.env.local` file exists and has correct values
- **Authentication errors**: Enable Email/Password provider in Firebase Console
- **Firestore permission denied**: Update your Firestore security rules

## Files Created

- `lib/firebase.js` - Firebase initialization
- `lib/useFirebase.js` - Custom hooks for fetching data
- `lib/useAuth.js` - Authentication hook
- `lib/firebaseCollections.md` - Database schema reference
