import bcrypt from "bcryptjs";
import { createUserRecord, hasAdminUser } from "./users";

export async function ensureDefaultAdmin(): Promise<boolean> {
  const adminExists = await hasAdminUser();

  if (adminExists) {
    return false;
  }

  await createUserRecord({
    username: "bunko",
    password: await bcrypt.hash("admin123", 10),
    isAdmin: true,
    role: "ADMIN",
    name: "Bunko",
    lastname: "Shelf",
  });

  console.info("✅ Usuario admin creado: bunko / admin123");
  return true;
}
