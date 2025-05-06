import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/check", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { isAdmin } = decoded;

    res.json({ isAuthenticated: true, isAdmin });
  } catch (err) {
    return res.status(401).json({ isAuthenticated: false });
  }
});

export default router;
