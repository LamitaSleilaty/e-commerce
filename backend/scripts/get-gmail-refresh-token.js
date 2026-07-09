require("dotenv").config();
const http = require("http");
const { google } = require("googleapis");

const PORT = 8945;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env first, then re-run this script.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log(`
1. In your Google Cloud OAuth client, add this exact Authorized redirect URI (then save):
   ${REDIRECT_URI}

2. Open this URL, sign in with the Gmail account you want to send FROM, and approve access:

${authUrl}
`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.end("Waiting for authorization...");
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No authorization code found in callback URL.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end("Authorization complete — you can close this tab and return to the terminal.");
    console.log("\nAdd this to backend/.env:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (err) {
    res.end(`Error exchanging code: ${err.message}`);
    console.error(err);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`Listening for the OAuth redirect on port ${PORT}...`);
});
