const { google } = require("googleapis");

function encodeMessage(message) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRawMessage({ to, subject, html }) {
  const messageParts = [
    `From: ${process.env.GMAIL_SENDER_EMAIL}`,
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    html,
  ];
  return encodeMessage(messageParts.join("\n"));
}

/**
 * Sends an email through the Gmail API using the GMAIL_SENDER_EMAIL account,
 * authorized via a one-time OAuth2 grant (see scripts/get-gmail-refresh-token.js).
 * Failures are logged but never thrown — email delivery should never block
 * the calling request (registration, etc.).
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
    console.warn(`[email] Gmail API not configured, skipping send to ${to}`);
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: buildRawMessage({ to, subject, html }) },
    });
  } catch (err) {
    console.error("[email] Failed to send via Gmail API:", err.message);
  }
}

module.exports = { sendEmail };
