const { listMessages, getMessage } = require('./gmailService');
const { extractEmailData } = require('./emailProcessor');
const redisClient = require('./redisClient');

async function syncEmails(tokens) {
  try {
    // List a batch of messages; adjust maxResults as needed
    const messagesData = await listMessages(tokens, { maxResults: 15 });
    if (!messagesData.messages) {
      console.log('No messages found.');
      return;
    }

    for (const message of messagesData.messages) {
      const messageId = message.id;
      try {
        const fullMessage = await getMessage(tokens, messageId);
        const emailData = extractEmailData(fullMessage);

        // Create a Redis key for each email
        const redisKey = `email:${messageId}`;

        // Store the data as a hash in Redis
        // Using hSet, which in node-redis v4 returns a promise.
        await redisClient.hSet(redisKey, emailData);

        console.log(`Stored email ${messageId} in Redis.`);
      } catch (innerError) {
        console.error(`Error processing message ${messageId}:`, innerError);
      }
    }
    console.log('Email sync complete!');
  } catch (error) {
    console.error('Error syncing emails:', error);
  }
}

module.exports = { syncEmails };
