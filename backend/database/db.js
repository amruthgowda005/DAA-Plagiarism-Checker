/**
 * database/db.js - SQLite Database Configuration
 * Initializes and manages the SQLite database connection
 * Tables: users, documents, reports
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'plagiarism_checker.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db;

/**
 * Get the database instance (singleton)
 */
const getDB = () => {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
};

/**
 * Initialize all database tables
 */
const initDatabase = async () => {
  const database = getDB();

  // ── Users Table ────────────────────────────────────────────────────────────
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      full_name   TEXT    NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Documents Table ────────────────────────────────────────────────────────
  database.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      filename      TEXT    NOT NULL,
      original_name TEXT    NOT NULL,
      file_type     TEXT    NOT NULL,
      file_size     INTEGER NOT NULL,
      extracted_text TEXT   NOT NULL,
      word_count    INTEGER NOT NULL,
      upload_path   TEXT    NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── Reports Table ──────────────────────────────────────────────────────────
  database.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             INTEGER NOT NULL,
      doc1_id             INTEGER NOT NULL,
      doc2_id             INTEGER NOT NULL,
      doc1_name           TEXT    NOT NULL,
      doc2_name           TEXT    NOT NULL,
      similarity_score    REAL    NOT NULL,
      plagiarism_percent  REAL    NOT NULL,
      matched_chunks      INTEGER NOT NULL,
      total_chunks        INTEGER NOT NULL,
      execution_time_ms   REAL    NOT NULL,
      recursive_calls     INTEGER NOT NULL,
      tree_depth          INTEGER NOT NULL,
      algorithm_data      TEXT    NOT NULL,
      status              TEXT    DEFAULT 'completed',
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (doc1_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (doc2_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  console.log('📦 Database tables created/verified');
  return database;
};

module.exports = { getDB, initDatabase };
