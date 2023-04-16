const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const USER_EMAIL = "shashankkushwaha123@gmail.com";
const RESPONSE_MESSAGE =
  "Thank you for your email. I am currently on vacation and will not be able to respond until my return date.";

const authClient = new OAuth2Client({
  clientId:
    "309353338203-c19ooagfvcmhh492lh4967svoa2hga8t.apps.googleusercontent.com",
  clientSecret: "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",
  redirectUri: "https://developers.google.com/oauthplayground", // This is a placeholder redirect URI
});
("");

const gmail = google.gmail({
  version: "v1",
  auth: authClient,
});

async function authenticate() {
  // Generate URL for user consent
  const url = authClient.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  console.log(`Visit the URL to authorize your app: ${url}`);

  // Wait for user consent and retrieve the authorization code
  const authCode = await new Promise((resolve, reject) => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question("Enter the code from that page here: ", (code) => {
      readline.close();
      resolve(code);
    });
  });

  // Exchange authorization code for access and refresh tokens
  const { tokens } = await authClient.getToken(authCode);
  authClient.setCredentials(tokens);

  console.log(`Tokens received: ${JSON.stringify(tokens)}`);

  return tokens;
}

async function getUnrepliedThreads() {
  const response = await gmail.users.messages.list({
    userId: USER_EMAIL,
    q: "is:unread in:inbox",
  });

  const messages = response.data.messages || [];

  // Group messages by thread ID
  const threads = {};
  messages.forEach((message) => {
    const threadId = message.threadId;
    if (!threads[threadId]) {
      threads[threadId] = [];
    }
    threads[threadId].push(message);
  });

  // Filter out threads with replies by the user
  const unrepliedThreads = [];
  for (const threadId in threads) {
    const messages = threads[threadId];
    const lastMessage = messages[messages.length - 1];
    const isReplied = messages.some((message) => {
      return message.labelIds.includes("SENT");
    });
    if (!isReplied) {
      unrepliedThreads.push(lastMessage.threadId);
    }
  }

  return unrepliedThreads;
}

async function replyToThread(threadId) {
  // Send a response message
  const response = await gmail.users.messages.send({
    userId: USER_EMAIL,
    requestBody: {
      threadId,
      raw: Buffer.from(
        `To: ${USER_EMAIL}\nSubject: Automatic reply\n\n${RESPONSE_MESSAGE}`
      ).toString("base64"),
    },
  });
}

// Tag the message with
