import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve("back/db/data.sqlite");

const db = new Database(dbPath);

// Create table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    isAdmin INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
