# Quick Manual Test Checklist

Follow these steps to manually verify borrow/return flows and security rules.

1. Prepare
   - Ensure `.env.local` contains valid `NEXT_PUBLIC_FIREBASE_*` values and you're signed into Firebase in the browser.
   - Ensure a `users` document exists for your test accounts with `role: 'admin'` for admin user.

2. Borrow flow (regular user)
   - Sign in as a normal user (non-admin).
   - Go to `/equipment` and pick an item currently shown as `Available`.
   - Use the borrow form to borrow the item (choose an expected return date).
   - Expected results:
     - A new document is created in `borrowRecords` with `userId` == your uid and `status` == 'borrowed'.
     - The `equipment` document is updated: `status` == 'borrowed', `currentBorrower` == your uid.

3. My Borrows page
   - Visit `/my-borrows`.
   - Expected results:
     - The borrowed item appears under "Currently Borrowed".
     - Due date, borrow date, and the Return button are visible.

4. Return flow (owner)
   - From `/my-borrows`, click return and complete the return form.
   - Expected results:
     - The `borrowRecords` document is updated with `status` == 'returned' and `actualReturnDate` set.
     - The `equipment` document is updated: `status` == 'available', `currentBorrower` cleared.

5. Security checks (FireStore rules)
   - As a non-admin, try to directly modify an `equipment` document to set `status` to 'borrowed' for an item you do NOT own — it should be denied.
   - As the current borrower, modifying your borrowed equipment to mark it returned (`currentBorrower` -> null, `status` -> 'available') should be allowed.
   - As a non-owner, updating someone else's `borrowRecords` should be denied.
   - As an admin (user document role: 'admin'), verify you can update equipment freely and read/update any borrowRecords.

6. Notes
   - The rules expect a `users/{uid}` doc with a `role` field for admin checks.
   - If rules block legitimate client updates, consider moving status updates into a trusted server (Cloud Function) that runs with admin privileges.
