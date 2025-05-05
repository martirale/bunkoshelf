import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import { createAdminIfNotExists } from "./scripts/initAdmin.js";

// Cargar variables de entorno
dotenv.config();

// Inicializar la app
const app = express();
app.use(express.json()); // Parsear JSON en body

// Rutas de autenticación
app.use("/auth", authRoutes);

// Inicializar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  createAdminIfNotExists(); // Crear admin si no existe
  console.log(`Backend listo en http://localhost:${PORT}`);
});
