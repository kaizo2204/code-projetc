require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'users_emails.json');
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9 * * 1'; // default: every Monday at 09:00

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(u => u.email) : [];
  } catch (err) {
    console.error('Failed to read users file:', USERS_FILE, err.message);
    return [];
  }
}

function makeTransport() {
  if (!process.env.SMTP_HOST) {
    console.error('SMTP_HOST not set in environment. See .env.example');
    process.exit(1);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true') || false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function sendEmail(transporter, to, subject, text, html) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const msg = { from, to, subject, text, html };
  try {
    const info = await transporter.sendMail(msg);
    console.log('Sent to', to, 'messageId=', info.messageId);
  } catch (err) {
    console.error('Failed to send to', to, err && err.message ? err.message : err);
  }
}

async function sendWeekly() {
  const users = loadUsers();
  if (!users.length) {
    console.warn('No users with emails found in', USERS_FILE);
    return;
  }

  const transporter = makeTransport();

  const subject = process.env.EMAIL_SUBJECT || 'Your weekly expense tracker update';
  const plain = process.env.EMAIL_TEXT || 'Here is your weekly update from Expense & Income Tracker.';
  const html = process.env.EMAIL_HTML || `<p>Hello,</p><p>This is your weekly update from <strong>Expense & Income Tracker</strong>. Open the app to view the latest charts and transactions.</p><p>If you did not expect this message, please ignore it.</p>`;

  for (const u of users) {
    if (!u.email) continue;
    await sendEmail(transporter, u.email, subject, plain, html);
  }
}

function scheduleOrRunOnce() {
  const once = process.argv.includes('--once');
  if (once) {
    console.log('Sending weekly updates once now...');
    sendWeekly().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
    return;
  }

  console.log('Scheduling weekly updates with cron schedule:', CRON_SCHEDULE);
  cron.schedule(CRON_SCHEDULE, () => {
    console.log(new Date().toISOString(), 'Running scheduled weekly send...');
    sendWeekly().catch(err => console.error('sendWeekly error', err));
  }, { timezone: process.env.TZ || 'UTC' });

  console.log('Scheduler started. Press Ctrl+C to stop.');
}

scheduleOrRunOnce();
