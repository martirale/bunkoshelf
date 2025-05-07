import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let prisma;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const prismaClient = await getPrisma();

    const user = await prismaClient.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "180d", algorithm: "HS256" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 60 * 60 * 1000, // half-year
    });
    res.status(200).json({ message: "Login exitoso" });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
