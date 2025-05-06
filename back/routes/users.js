import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware para verificar si el usuario está logeado
const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Middleware para verificar si el usuario es admin
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin)
    return res.status(403).json({ error: "No autorizado" });
  next();
};

// GET todos los usuarios (solo admin)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  res.json(users);
});

// GET perfil del usuario autenticado
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  res.json(user);
});

// PUT actualizar perfil propio
router.put("/me/update", requireAuth, async (req, res) => {
  const { name, lastname, password } = req.body;
  const dataToUpdate = {
    name,
    lastname,
  };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    dataToUpdate.password = await bcrypt.hash(password, salt);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
});

// GET usuario por ID (solo admin)
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  res.json(user);
});

// PUT actualizar usuario por ID (solo admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const data = req.body;
  const updated = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data,
  });
  res.json(updated);
});

export default router;
