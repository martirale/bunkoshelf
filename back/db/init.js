import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const initDB = async () => {
  const db = await open({
    filename: "./src/db/bunkoshelf.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      isAdmin INTEGER DEFAULT 0
    );
  `);

  return db;
};
