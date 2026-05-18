# Equipment Borrowing System — Full Documentation

This document provides a comprehensive guide to the Equipment Borrowing System implemented in this repository. It consolidates setup, architecture, data model, security rules, key flows, deployment, and testing instructions.

---

## 1. Project Overview

Purpose: Provide an online system to manage equipment inventory and borrowing for users and admins. Features include:
- Equipment catalog with statuses (`available`, `borrowed`, `lost`)
- Borrowing workflow with expected return dates and notes
- Return workflow with condition reporting and damage notes
- Per-user borrow history and admin equipment management
- Authentication via Firebase Auth (Email/Password)
- Firestore for data persistence and Storage for assets

Target audience: Students, lab managers, administrators needing lightweight inventory/borrowing tracking.

## 2. Tech Stack

- Next.js (App router) with React
- Tailwind CSS for styling
- Firebase: Authentication, Firestore, Storage
- Vercel for deployment

## 3. Repository Structure (key files)

- app/ — Next.js app routes and pages
  - /borrow — borrow flow
  - /return — return flow
  - /my-borrows — user borrow dashboard
  - /equipment — equipment catalog
  - /admin — admin sections
- components/
  - Navigation.js — top navigation
  - ProtectedLayout.js — layout that requires authentication
- contexts/
  - AuthContext.js — React context for auth state
- lib/
  - firebase.js — Firebase initialization
  - useFirebase.js — hooks for `useEquipment()` and `useBorrowRecords()`
  - firebaseCollections.md — schema reference
- firestore.rules — Firestore security rules (added)
- TEST_CHECKLIST.md — manual test checklist (added)
- FULL_DOCUMENTATION.md — this file

## 4. Firestore Data Model

Collections used:

- `equipment` (documents):
  - Fields: `name`, `description`, `category`, `status` (available|borrowed|lost), `currentBorrower` (uid|null), `currentBorrowerEmail`, `updatedAt`, etc.

- `borrowRecords` (documents):
  - Fields: `userId`, `userEmail`, `equipmentId`, `equipmentName`, `borrowDate`, `expectedReturnDate`, `actualReturnDate`, `status` (borrowed|returned), `notes`, `condition`, `damageNotes`, `createdAt`, `updatedAt`.

- `users` (documents):
  - Fields: `role` (e.g. 'admin' or undefined/regular), profile fields as needed.

Refer to `lib/firebaseCollections.md` for additional suggestions.

## 5. Security Rules Summary

We provide `firestore.rules` that enforce the following policies:

- Admins (determined by a `users/{uid}.role == 'admin'` doc field) can manage equipment and borrowRecords freely.
- Authenticated users may create `borrowRecords` only for themselves with `status: 'borrowed'` and valid `equipmentId`.
- Equipment writes are restricted: either an admin performs writes, or a controlled transition is allowed:
  - Borrowing: `status` must move from `available` -> `borrowed` and the request must set `currentBorrower` to the requester's uid.
  - Returning: the current borrower may set `currentBorrower` -> `null` and `status` -> `available`.

Note: Rules are implemented to prevent arbitrary status changes by unauthenticated or unrelated users. If client-side writes are blocked by these rules, use a trusted server-side function (Cloud Function) to perform updates.

File: `firestore.rules` (in repo) contains full rule definitions.

## 6. Key Flows and Implementation Details

6.1 Borrow Flow (client)
- User selects equipment from `/borrow`.
- Client creates a `borrowRecords` document with `status: 'borrowed'`.
- Client updates the `equipment` document to `status: 'borrowed'` and sets `currentBorrower` to the user's uid.

Relevant files: [app/borrow/page.js](app/borrow/page.js)

6.2 Return Flow (client)
- User opens return form (link from `/my-borrows`).
- Client updates `borrowRecords` document: sets `actualReturnDate`, `status: 'returned'`, `condition`, `damageNotes`.
- Client updates `equipment` document to set `status: 'available'` (or `lost` if reported) and clears borrower fields.

Relevant files: [app/return/page.js](app/return/page.js)

6.3 My Borrows
- Uses `useBorrowRecords(user.uid)` to fetch borrow records filtered by `userId`.
- Renders active borrows and returned items on `/my-borrows`.

Relevant files: [app/my-borrows/page.js](app/my-borrows/page.js), [lib/useFirebase.js](lib/useFirebase.js)

6.4 Equipment List & Dashboard
- Equipment items use `status` to display availability.
- Dashboard computes stats by counting equipment statuses.

Relevant files: [app/equipment/page.js](app/equipment/page.js), [app/dashboard/page.js](app/dashboard/page.js)

## 7. Setup & Local Development

Prerequisites:
- Node.js 18+ (or the version supported by your Next.js setup)
- Firebase project and web app

Steps:
1. Copy environment variables into `.env.local` (create from `.env.local.example` if present):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

2. Install dependencies:

```bash
npm install
```

3. Run locally:

```bash
npm run dev
```

4. Open app at `http://localhost:3000`.

## 8. Deployment (Vercel)

1. Push to your Git remote.
2. Connect the repository to Vercel and set environment variables in the Vercel dashboard (same as `.env.local`).
3. Deploy via Vercel UI or CLI:

```bash
npx vercel --prod
```

Note: CI/CD will build the Next.js app; ensure environment variables are set for production.

## 9. Testing & Checklist

Run the manual verification steps in `TEST_CHECKLIST.md` to validate borrow/return flows and security rules.

Automated tests: This repository currently does not include automated test suites. Consider adding unit tests for hooks and integration tests for API flows.

## 10. Troubleshooting

- Firestore permission denied: Verify `firestore.rules` and that your authenticated user has the expected `users/{uid}` doc if admin checks are used.
- Missing environment variables: Ensure `NEXT_PUBLIC_...` variables are present in the environment.

## 11. Extensions & Next Steps

- Move critical state changes (equipment status updates) to a trusted server (Cloud Functions) to avoid relying on client-side writes and to ensure ACID-like consistency.
- Add email notifications for overdue items.
- Add scheduled Cloud Function to mark overdue items and alert admins.
- Add automated tests and CI checks.

## 12. Contribution Guide

- Fork the repo, create a branch, make changes, open a PR describing your changes.
- Ensure code follows the existing style and component patterns.

---

If you have the PDF template for "making of the documentation", please upload it and I will adapt this documentation to match its structure and formatting.
