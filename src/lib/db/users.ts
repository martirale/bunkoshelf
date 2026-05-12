import { query, queryOne } from "./query";
import type { PublicUser, UserRow } from "./types";
import type { Role } from "@/lib/types/auth";

function mapUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    isAdmin: row.is_admin,
    role: row.role,
    name: row.name,
    lastname: row.lastname,
    birthYear: row.birth_year,
  };
}

export interface UserWithPassword extends PublicUser {
  password: string;
}

export function mapUserWithPassword(row: UserRow): UserWithPassword {
  return {
    ...mapUser(row),
    password: row.password,
  };
}

export async function findUserByUsername(
  username: string
): Promise<UserWithPassword | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, created_at, username, password, is_admin, role, name, lastname, birth_year
      FROM users
      WHERE username = $1
      LIMIT 1
    `,
    [username]
  );

  return row ? mapUserWithPassword(row) : null;
}

export async function findUserSessionById(id: string): Promise<PublicUser | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, created_at, username, password, is_admin, role, name, lastname, birth_year
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return row ? mapUser(row) : null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const rows = await query<UserRow>(`
    SELECT id, created_at, username, password, is_admin, role, name, lastname, birth_year
    FROM users
    ORDER BY COALESCE(name, username) ASC, username ASC
  `);

  return rows.map(mapUser);
}

export async function usernameExists(
  username: string,
  excludeId?: string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE username = $1
        AND ($2::text IS NULL OR id <> $2)
      LIMIT 1
    `,
    [username, excludeId ?? null]
  );

  return !!row;
}

export async function hasAdminUser(): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE is_admin = TRUE
      LIMIT 1
    `
  );

  return !!row;
}

export interface CreateUserInput {
  username: string;
  password: string;
  name?: string | null;
  lastname?: string | null;
  birthYear?: number | null;
  isAdmin?: boolean;
  role?: Role;
}

export async function createUserRecord(
  input: CreateUserInput
): Promise<PublicUser> {
  const row = await queryOne<UserRow>(
    `
      INSERT INTO users (
        id,
        username,
        password,
        is_admin,
        role,
        name,
        lastname,
        birth_year
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at, username, password, is_admin, role, name, lastname, birth_year
    `,
    [
      crypto.randomUUID(),
      input.username,
      input.password,
      input.isAdmin ?? false,
      input.role ?? "MEMBER",
      input.name ?? null,
      input.lastname ?? null,
      input.birthYear ?? null,
    ]
  );

  if (!row) {
    throw new Error("Failed to create user");
  }

  return mapUser(row);
}

export async function updateUserRecord(
  id: string,
  input: {
    username?: string;
    password?: string;
    name?: string | null;
    lastname?: string | null;
    birthYear?: number | null;
    isAdmin?: boolean;
    role?: Role;
  }
): Promise<PublicUser | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if (input.username !== undefined) {
    values.push(input.username);
    assignments.push(`username = $${values.length}`);
  }

  if (input.password !== undefined) {
    values.push(input.password);
    assignments.push(`password = $${values.length}`);
  }

  if (input.name !== undefined) {
    values.push(input.name);
    assignments.push(`name = $${values.length}`);
  }

  if (input.lastname !== undefined) {
    values.push(input.lastname);
    assignments.push(`lastname = $${values.length}`);
  }

  if (input.birthYear !== undefined) {
    values.push(input.birthYear);
    assignments.push(`birth_year = $${values.length}`);
  }

  if (input.isAdmin !== undefined) {
    values.push(input.isAdmin);
    assignments.push(`is_admin = $${values.length}`);
  }

  if (input.role !== undefined) {
    values.push(input.role);
    assignments.push(`role = $${values.length}`);
  }

  if (assignments.length === 0) {
    return findUserSessionById(id);
  }

  values.push(id);

  const row = await queryOne<UserRow>(
    `
      UPDATE users
      SET ${assignments.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, created_at, username, password, is_admin, role, name, lastname, birth_year
    `,
    values
  );

  return row ? mapUser(row) : null;
}

export async function deleteUserRecord(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
    `,
    [id]
  );

  return rows.length > 0;
}
