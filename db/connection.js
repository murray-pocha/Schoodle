// PG database client/connection setup
require('dotenv').config();
const { Pool } = require('pg');

const dbParams = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};
console.log('DB_PASS:', process.env.DB_PASS);
const db = new Pool(dbParams);

db.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to the database successfully!');
  }
  release(); // Release the client back to the pool
});

module.exports = db;
