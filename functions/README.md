Firebase Cloud Function: scheduledDueReminders

This function scans `borrowRecords` and sends reminder notifications to borrowers when an item is within the configured threshold before its `expectedReturnDate`.

Setup & deploy

1. Install Firebase CLI and login:

   npm install -g firebase-tools
   firebase login

2. From this `functions` folder, install dependencies:

   cd functions
   npm install

3. Initialize functions (if you haven't already) in your project root and configure billing if required for scheduler:

   firebase init functions

4. Deploy the function:

   firebase deploy --only functions:scheduledDueReminders

5. Optionally set an environment variable to change threshold (hours):

   firebase functions:config:set reminders.threshold_hours="48"

Notes
- The function uses `functions.pubsub.schedule('every 1 hours')` and will run hourly.
- When deployed, the function will write notification documents to the top-level `notifications` collection and attempt to write a copy to `users/{userId}/notifications/{id}`.
- The function sets `reminderSentAt` on the `borrowRecords` document to avoid duplicate reminders.

If you want a Vercel cron alternative instead (HTTP endpoint called by Vercel cron), tell me and I will scaffold an API route instead.
