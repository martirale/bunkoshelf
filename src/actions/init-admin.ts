"use server";

import { connection } from "next/server";
import { ensureDefaultAdmin } from "@/lib/db/bootstrap";

export async function initAdmin() {
  await connection();
  try {
    const created = await ensureDefaultAdmin();

    if (created) {
      return {
        created: true,
        message: "Usuario admin creado con éxito.",
      };
    }

    console.info("ℹ️ Usuario admin ya existe");

    return {
      created: false,
      message: "El usuario admin ya existe.",
    };
  } catch (error) {
    console.error("❌ Error al crear el usuario admin:", error);
    return { error: "Error interno al inicializar admin", status: 500 };
  }
}
