import sqlite3 from "sqlite3";
import path from "path";

// Path to the database file
const dbPath = path.resolve("back/db/data.sqlite"); // Verify that this is the correct path for your database file

// Create a new database instance
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  } else {
    console.log("Conexión con la base de datos establecida.");
  }
});

// Create the table if it does not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      isAdmin INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

export default db;
