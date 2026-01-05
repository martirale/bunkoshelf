"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function initAdmin() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await prisma.user.create({
        data: {
          username: "bunko",
          password: hashedPassword,
          isAdmin: true,
          name: "Bunko",
          lastname: "Shelf",
        },
      });

      const message = "✅ Usuario admin creado: bunko / admin123";
      console.error(message);

      return {
        created: true,
        message: "Usuario admin creado con éxito.",
      };
    }

    const message = "ℹ️ Usuario admin ya existe";
    console.error(message);

    return {
      created: false,
      message: "El usuario admin ya existe.",
    };
  } catch (error) {
    console.error("❌ Error al crear el usuario admin:", error);
    return { error: "Error interno al inicializar admin", status: 500 };
  }
}
