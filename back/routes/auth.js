import express from "express";
import db from "../db/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Query the user by username
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, isAdmin: !!user.isAdmin },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1h" }
    );

    res.json({ token });
  });
});

export default router;
