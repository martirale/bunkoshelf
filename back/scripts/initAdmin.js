import db from "../db/database.js";
import bcrypt from "bcrypt";

export function createAdminIfNotExists() {
  // Check if an administrator user already exists
  db.all("SELECT * FROM users WHERE isAdmin = 1", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }

    if (rows.length === 0) {
      const hashed = bcrypt.hashSync("admin", 10);

      // Insert the admin user if it does not exist
      db.run(
        `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 1)`,
        ["admin", hashed],
        function (err) {
          if (err) {
            console.error(err);
            return;
          }
          console.log(
            "Usuario admin creado (usuario: admin / contraseña: admin)"
          );
        }
      );
    }
  });
}
