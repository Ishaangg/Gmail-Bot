const express = require('express');
const session = require('express-session');
const { listMessages } = require('./gmailService'); // Already available functions
const { syncEmails } = require('./syncEmails'); // module for syncing emails

const app = express();

// Use sessions to temporarily store tokens for each user
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Your OAuth 2.0 credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Create an OAuth2 client instance using googleapis
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Endpoint to start OAuth (redirect from home)
app.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/gmail.readonly'
  });
  res.redirect(authUrl);
});

// OAuth callback endpoint
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('No authorization code provided.');
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens in session for later use (or store them in your DB)
    req.session.tokens = tokens;

    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Immediately sync emails into Redis (only snippet, subject, and body)
    await syncEmails(tokens);

    // After successful exchange and syncing, redirect to the chatbot interface
    res.redirect('/chatbot');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.send('Error exchanging code for tokens.');
  }
});

// Endpoint to list email data from Redis (for testing)
app.get('/stored-emails', async (req, res) => {
  // This endpoint would retrieve keys from Redis.
  // For simplicity, we'll assume your client or a separate module handles this.
  res.send('Check your Redis database to see the stored emails.');
});

// Chatbot page endpoint
app.get('/chatbot', (req, res) => {
  if (!req.session.tokens) {
    return res.redirect('/');
  }
  res.send('<h1>Thank you for giving access!</h1><p>Your data is in safe hands.</p>');
});

// Example endpoint to list the user's email message IDs using Gmail API (for testing)
app.get('/emails', async (req, res) => {
  if (!req.session.tokens) {
    return res.redirect('/');
  }
  try {
    const data = await listMessages(req.session.tokens, { maxResults: 10 });
    res.json(data);
  } catch (error) {
    res.status(500).send('Error retrieving emails');
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

