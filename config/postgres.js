const { Pool } = require('pg');
const { neon } = require('@neondatabase/serverless');

class DatabaseConnection {
  constructor() {
    this.sql = neon(process.env.DATABASE_URL);
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async connect() {
    try {
      await this.pool.query('SELECT NOW()');
      console.log('Successfully connected to the database');
    } catch (error) {
      console.error('Error connecting to the database', error);
      throw error;
    }
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

const dbConnection = new DatabaseConnection();

module.exports = {
  connectDB: () => dbConnection.connect(),
  query: (text, params) => dbConnection.query(text, params),
  closeDB: () => dbConnection.close(),
};