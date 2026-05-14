# Firebase Setup Guide - Step by Step

This guide will walk you through setting up Firebase for the Equipment Borrowing System.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `Equipment-Borrowing-System`
4. Select your country/region
5. Click **"Create project"**
6. Wait for the project to be created (usually takes a few seconds)

---

## Step 2: Create a Web App

1. In the Firebase Console, click the **gear icon** (⚙️) → **Project settings**
2. Go to the **"Your apps"** section at the bottom
3. Click **"Add app"** (or Web icon </>)
4. Choose **"Web"** platform
5. Enter app nickname: `Equipment System Web`
6. Check "Also set up Firebase Hosting for this app" (optional)
7. Click **"Register app"**

---

## Step 3: Copy Firebase Configuration

After registering the app, you'll see the Firebase config code:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

**Copy each value** to your `.env.local` file in the format shown below.

---

## Step 4: Update Environment Variables

1. In your project folder, open `.env.local`
2. Fill in the values from Firebase Config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
```

**⚠️ Important:** Don't commit `.env.local` to GitHub (it's in `.gitignore`)

---

## Step 5: Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your region/location
5. Click **"Enable"**
6. Wait for the database to initialize

### Create Collections (Optional - will auto-create when needed)

Firestore will automatically create collections when you add data. However, you can pre-create them:

1. Click **"Start collection"** in Firestore
2. Create collection: `equipment`
3. Click **"Auto-generate ID"**, then add a test document
4. Repeat for `borrowRecords` collection

---

## Step 6: Enable Authentication

1. In Firebase Console, go to **"Authentication"** (left sidebar)
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"** on
5. Click **"Save"**

---

## Step 7: Set Firestore Security Rules

⚠️ **Important for Production**: Current rules are for testing. Here are safer production rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read equipment
    match /equipment/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }
    
    // Users can only manage their own borrow records
    match /borrowRecords/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read their own user profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 8: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. You should see the login page
4. Register with a test email/password
5. If successful, you'll be redirected to the dashboard

---

## Common Firebase Configuration

### Firebase Project Settings
- **Project ID:** Found in Project Settings
- **Region:** `us-central1` (default, can change)
- **Billing:** Firebase has a free tier, but enable billing for production

### Useful Firebase URLs
- **Firebase Console:** https://console.firebase.google.com
- **Your Project:** https://console.firebase.google.com/project/YOUR_PROJECT_ID
- **Authentication:** Project → Authentication → Users
- **Firestore:** Project → Firestore Database → Data

---

## Troubleshooting Firebase Setup

### ❌ "Firebase app not initialized"
- **Solution:** Check `.env.local` has all required variables
- Make sure `.env.local` is in the root `midtermproject` folder
- Restart the dev server after updating `.env.local`

### ❌ "Permission denied" errors
- **Solution:** Check Firestore security rules
- Make sure you're logged in (authenticated)
- Verify rules allow your operation

### ❌ Authentication not working
- **Solution:** Enable Email/Password provider in Firebase
- Make sure Authentication is enabled in Firebase Console
- Check browser console for error messages

### ❌ "Storage bucket not found"
- **Solution:** This is optional. Remove from `.env.local` if not using file uploads
- Or enable Firebase Storage if you need it

---

## Next Steps

1. ✅ Firebase project created
2. ✅ Web app registered
3. ✅ Configuration saved to `.env.local`
4. ✅ Firestore database enabled
5. ✅ Authentication enabled
6. ✅ Security rules configured

Now you can:
- Start the app: `npm run dev`
- Register new users
- Borrow equipment
- View history

---

## Firebase Admin Tasks

### View All Equipment
- Go to Firebase Console
- Firestore Database → `equipment` collection
- See all equipment items

### View All Borrow Records
- Firebase Console → Firestore Database
- Click `borrowRecords` collection
- See all borrowing transactions

### Delete Equipment
- Navigate to that document
- Click **"Delete document"**
- Confirm deletion

### Reset Database (Start Fresh)
- Firestore → Select collection → Delete all documents
- Or delete the entire collection

---

## Security Checklist

- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Only `NEXT_PUBLIC_*` variables exposed to browser
- ✅ Firestore rules restrict unauthorized access
- ✅ Authentication is required for sensitive operations
- ✅ Don't share Firebase credentials publicly

---

## Production Deployment Tips

Before deploying to production:

1. **Enable Billing** in Firebase (required for production)
2. **Restrict Security Rules** to allow only authorized users
3. **Set up backup** in Firebase Console
4. **Monitor Usage** to prevent unexpected costs
5. **Enable Email Verification** for authentication
6. **Test thoroughly** before going live

---

## Getting Help

- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Firestore Guide:** https://firebase.google.com/docs/firestore
- **Firebase Auth:** https://firebase.google.com/docs/auth

---

**Last Updated:** May 14, 2026  
**Project:** Equipment Borrowing and Returning System
