import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({ message: "Logout exitoso" });
});

export default router;
