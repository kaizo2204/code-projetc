# Weekly Update Sender

This small helper sends a weekly email update to users listed in `users_emails.json`.

Files added:

- `send_weekly_updates.js` — Node script using `nodemailer` and `node-cron`.
- `package.json` — dependencies and start scripts.
- `.env.example` — example environment variables for SMTP and schedule.
- `users_emails.json` — sample file with users and emails.

Usage

1. Install dependencies:

```powershell
cd c:\Users\ralph\Downloads\trippings\memaproj
npm install
```

2. Create a `.env` file (copy from `.env.example`) and set your SMTP credentials.

3. Replace or generate `users_emails.json` with the exported emails from the app (admin -> Export Emails).

4. Run once:

```powershell
npm run send-once
```

5. Run continuously (scheduler):

```powershell
npm start
```

Windows scheduling recommendation

If you prefer Windows Task Scheduler instead of a long-running process, use the `--once` script and schedule it weekly. Create a task that runs `node c:\path\to\send_weekly_updates.js --once` and set the trigger to run weekly.

Security

- Keep SMTP credentials out of source control. Use environment variables or secret storage.

Notes

- The web app now supports storing an `email` property for users and includes an admin `Export Emails` button which downloads a `users_emails.json` file you can drop next to this script.
