import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { queryOne } from "./query.mjs";

export async function ensureDefaultAdmin() {
  const admin = await queryOne(
    `
      SELECT id
      FROM users
      WHERE is_admin = TRUE
      LIMIT 1
    `
  );

  if (admin) {
    return false;
  }

  await queryOne(
    `
      INSERT INTO users (
        id,
        username,
        password,
        is_admin,
        role,
        name,
        lastname
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      createId(),
      "bunko",
      await bcrypt.hash("admin123", 10),
      true,
      "ADMIN",
      "Bunko",
      "Shelf",
    ]
  );

  console.info("✅ Usuario admin creado: bunko / admin123");
  return true;
}
