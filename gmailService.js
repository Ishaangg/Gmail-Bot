const { google } = require('googleapis');

// Your OAuth 2.0 credentials (should match your main app credentials)
const CLIENT_ID = '';
const CLIENT_SECRET = '';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

/**
 * Create an OAuth2 client and set credentials (tokens)
 * @param {Object} tokens - The tokens object with access_token (and optionally refresh_token)
 * @returns {OAuth2Client} Authenticated OAuth2 client
 */
function createOAuthClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

/**
 * Create a Gmail API client using the tokens
 * @param {Object} tokens - The tokens object
 * @returns {gmail_v1.Gmail} Gmail API client instance
 */
function createGmailClient(tokens) {
  const authClient = createOAuthClient(tokens);
  return google.gmail({ version: 'v1', auth: authClient });
}

/**
 * List messages in the user's Gmail account
 * @param {Object} tokens - The tokens object
 * @param {Object} [options={}] - Additional query options (e.g., maxResults, q for search)
 * @returns {Promise<Object>} Response data containing messages list
 */
async function listMessages(tokens, options = {}) {
  try {
    const gmail = createGmailClient(tokens);
    const res = await gmail.users.messages.list({
      userId: 'me',
      ...options
    });
    console.log('listMessages response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error listing messages:', error);
    throw error;
  }
}

/**
 * Get a specific message's details
 * @param {Object} tokens - The tokens object
 * @param {string} messageId - The ID of the Gmail message
 * @returns {Promise<Object>} Response data with message details
 */
async function getMessage(tokens, messageId) {
  try {
    const gmail = createGmailClient(tokens);
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    return res.data;
  } catch (error) {
    console.error(`Error retrieving message ${messageId}:`, error);
    throw error;
  }
}

module.exports = { createGmailClient, listMessages, getMessage };
