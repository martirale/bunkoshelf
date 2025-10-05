import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
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

      console.log(`
🛠️ Usuario admin creado automáticamente:
   ➤ username: bunko
   ➤ password: admin123
`);

      return Response.json({
        created: true,
        message: "Usuario admin creado con éxito.",
      });
    }

    return Response.json({
      created: false,
      message: "El usuario admin ya existe.",
    });
  } catch (error) {
    console.error("Error al crear el usuario admin:", error);
    return new Response("Error interno al inicializar admin", { status: 500 });
  }
}
