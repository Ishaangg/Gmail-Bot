// syncEmails.js
const { listMessages, getMessage } = require('./gmailService');
const { extractEmailData } = require('./emailProcessor');
const db = require('./dbService');  // Import the SQLite db

async function syncEmails(tokens) {
  try {
    // List a batch of messages; adjust maxResults as needed
    const messagesData = await listMessages(tokens, { maxResults: 20 });
    if (!messagesData.messages) {
      console.log('No messages found.');
      return;
    }

    for (const message of messagesData.messages) {
      const messageId = message.id;
      try {
        const fullMessage = await getMessage(tokens, messageId);
        const emailData = extractEmailData(fullMessage);

        // Convert the email date string to a JavaScript Date object
        // then store as a string (e.g., ISO) in SQLite
        const receivedDate = emailData.date ? new Date(emailData.date).toISOString() : null;

        // For SQLite, we can do an "INSERT OR REPLACE" to mimic an upsert
        // If the row with the same "id" exists, it will be replaced
        const insertOrReplaceQuery = `
          INSERT OR REPLACE INTO emails (id, subject, sender, receiver, received_date, snippet, body)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // We'll use a small helper function to wrap db.run in a Promise
        await runSql(insertOrReplaceQuery, [
          messageId,
          emailData.subject,
          emailData.from,
          emailData.to,
          receivedDate,
          emailData.snippet,
          emailData.body
        ]);

        console.log(`Stored email ${messageId} in local SQLite DB.`);
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

// A small helper to run SQL queries with Promises instead of callbacks
function runSql(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes); // or this.lastID
      }
    });
  });
}


// // syncEmails.js
// const { listMessages, getMessage } = require('./gmailService');
// const { extractEmailData } = require('./emailProcessor');
// const pool = require('./dbService');  // Import the PostgreSQL pool

// async function syncEmails(tokens) {
//   try {
//     // List a batch of messages; adjust maxResults as needed
//     const messagesData = await listMessages(tokens, { maxResults: 15 });
//     if (!messagesData.messages) {
//       console.log('No messages found.');
//       return;
//     }

//     for (const message of messagesData.messages) {
//       const messageId = message.id;
//       try {
//         const fullMessage = await getMessage(tokens, messageId);
//         const emailData = extractEmailData(fullMessage);

//         // Convert the email date string to a JavaScript Date object.
//         // Depending on the format, you might need additional parsing.
//         const receivedDate = emailData.date ? new Date(emailData.date) : null;

//         // Prepare the SQL INSERT query with upsert behavior
//         const insertQuery = `
//   INSERT INTO emails (id, subject, sender, receiver, received_date, snippet, body)
//   VALUES ($1, $2, $3, $4, $5, $6, $7)
//   ON CONFLICT (id) DO UPDATE SET
//     subject = EXCLUDED.subject,
//     sender = EXCLUDED.sender,
//     receiver = EXCLUDED.receiver,
//     received_date = EXCLUDED.received_date,
//     snippet = EXCLUDED.snippet,
//     body = EXCLUDED.body;
// `;

// await pool.query(insertQuery, [
//   messageId,
//   emailData.subject,
//   emailData.from,
//   emailData.to, // Receiver from the "To" header
//   receivedDate, // JavaScript Date object from emailData.date
//   emailData.snippet,
//   emailData.body
// ]);


//         console.log(`Stored email ${messageId} in RDS.`);
//       } catch (innerError) {
//         console.error(`Error processing message ${messageId}:`, innerError);
//       }
//     }
//     console.log('Email sync complete!');
//   } catch (error) {
//     console.error('Error syncing emails:', error);
//   }
// }

// module.exports = { syncEmails };
