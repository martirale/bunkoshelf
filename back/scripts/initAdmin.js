import db from "../db/database.js";
import bcrypt from "bcrypt";

export function createAdminIfNotExists() {
  const row = db.prepare("SELECT * FROM users WHERE isAdmin = 1").get();

  if (!row) {
    const hashed = bcrypt.hashSync("admin", 10);

    db.prepare(
      `
      INSERT INTO users (username, password, isAdmin)
      VALUES (?, ?, 1)
    `
    ).run("admin", hashed);

    console.log("Usuario admin creado (usuario: admin / contraseña: admin)");
  }
}
