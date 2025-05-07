import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import logoutRoutes from "./routes/logout.js";
import sessionRoutes from "./routes/session.js";
import usersRoutes from "./routes/users.js";

let prisma;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Create the admin user if it does not exist
async function createAdminIfNotExists() {
  try {
    const prismaClient = await getPrisma();

    const adminExists = await prismaClient.user.findUnique({
      where: { username: "bunko" },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await prismaClient.user.create({
        data: {
          username: "bunko",
          password: hashedPassword,
          isAdmin: true,
        },
      });
      console.log(
        "Usuario admin creado con username: bunko y password: admin123"
      );
    }
  } catch (err) {
    console.error("Error al crear el usuario admin:", err);
    process.exit(1);
  }
}

// Call the create function at startup
createAdminIfNotExists();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/users", usersRoutes);

// Test ping
app.get("/api/ping", (req, res) => {
  res.send("pong");
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
