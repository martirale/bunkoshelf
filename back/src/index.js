import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend activo en el puerto ${PORT}`);
});
