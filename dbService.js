

// dbService.js
const sqlite3 = require('sqlite3').verbose();

// This opens (or creates) the local SQLite database file named "emails.db"
const db = new sqlite3.Database('emails.db', (err) => {
  if (err) {
    console.error('Could not open SQLite database:', err);
  } else {
    console.log('Connected to the local SQLite database.');
  }
});

// Optionally, create a table if it doesn’t exist
// (Adjust columns to match your needs)
db.run(`
  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    subject TEXT,
    sender TEXT,
    receiver TEXT,
    received_date TEXT,
    snippet TEXT,
    body TEXT
  )
`);

module.exports = db;


// // dbService.js
// const { Pool } = require('pg');

// // Use environment variables for security in production. For testing, you can hardcode.
// const pool = new Pool({
//   host: process.env.DB_HOST || 'database-1.cvqo884uac74.us-east-1.rds.amazonaws.com',
//   port: process.env.DB_PORT || 5432, // default PostgreSQL port
//   user: process.env.DB_USER || 'postgres',  // e.g., postgres
//   password: process.env.DB_PASSWORD || 'edsfds',
//   database: process.env.DB_NAME || 'postgres',  // e.g., postgres or your custom db
//   ssl: {
//     rejectUnauthorized: false  // For testing only; in production, use proper CA certificates
//   }
// });

// module.exports = pool;


