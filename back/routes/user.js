import express from "express";
import { initDB } from "../db/init.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/init-admin", async (req, res) => {
  const db = await initDB();
  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  const existing = await db.get(
    "SELECT * FROM users WHERE username = ?",
    ADMIN_USERNAME
  );
  if (existing) return res.status(400).json({ message: "Admin ya existe" });

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.run(
    "INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 1)",
    ADMIN_USERNAME,
    hashed
  );

  res.json({ message: "Admin creado con éxito" });
});

export default router;
