"use server";

import { hash } from "bcryptjs";
import { verifySession } from "@/lib/auth/verifySession";
import {
  createUserRecord,
  deleteUserRecord,
  findUserSessionById,
  listUsers,
  updateUserRecord,
  usernameExists,
} from "@/lib/db/users";
import { log } from "@/lib/logger";
import type { Session } from "@/lib/types";
import type { Role } from "@/lib/types/auth";

interface CreateUserParams {
  username: string;
  password: string;
  name?: string;
  lastname?: string;
  birthYear?: number | null;
  isAdmin?: boolean;
  role?: Role;
}

interface CreateUserResult {
  success?: boolean;
  user?: Session;
  error?: string;
  status?: number;
}

interface UpdateUserParams {
  name?: string;
  lastname?: string;
  password?: string;
}

interface UpdateUserResult {
  success?: boolean;
  error?: string;
  status?: number;
}

interface AdminUpdateUserParams {
  id: string;
  username: string;
  password?: string;
  name?: string;
  lastname?: string;
  birthYear?: number | null;
  isAdmin?: boolean;
  role?: Role;
}

interface AdminUpdateUserResult {
  success?: boolean;
  user?: Session;
  error?: string;
  status?: number;
}

interface DeleteUserParams {
  id: string;
}

interface DeleteUserResult {
  success?: boolean;
  error?: string;
  status?: number;
}

export async function createUser({
  username,
  password,
  name,
  lastname,
  birthYear,
  isAdmin,
  role,
}: CreateUserParams): Promise<CreateUserResult | undefined> {
  let _err: Error | null = null;

  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }
    if (!user.isAdmin) {
      return { error: "Forbidden", status: 403 };
    }

    const start = Date.now();

    if (!username || !password) {
      return { error: "Faltan campos requeridos", status: 400 };
    }

    if (await usernameExists(username)) {
      return { error: "El nombre de usuario ya existe", status: 400 };
    }

    const newUser = await createUserRecord({
      username,
      password: await hash(password, 10),
      name: name || null,
      lastname: lastname || null,
      birthYear: birthYear || null,
      isAdmin: !!isAdmin,
      role: role || "MEMBER",
    });

    const duration = Date.now() - start;

    log({
      event: "User creation",
      category: "ADMIN",
      duration,
      meta: {
        userId: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        role: newUser.role,
      },
    });

    return { success: true, user: newUser };
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error creando usuario:", _err);
      return { error: "Error al crear el usuario", status: 500 };
    }
  }
}

export async function updateUser({
  name,
  lastname,
  password,
}: UpdateUserParams): Promise<UpdateUserResult> {
  try {
    const session = await verifySession();
    if (!session) {
      return { error: "Unauthorized", status: 401 };
    }

    const start = Date.now();
    const user = await findUserSessionById(session.id);

    await updateUserRecord(session.id, {
      name,
      lastname,
      ...(password && password.length > 0
        ? { password: await hash(password, 10) }
        : {}),
    });

    const duration = Date.now() - start;

    log({
      event: "User update",
      category: "USERS",
      duration,
      meta: {
        userId: session.id,
        username: user?.username || "unknown",
        passwordUpdated: !!password,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Database error", status: 500 };
  }
}

export async function adminUpdateUser({
  id,
  username,
  password,
  name,
  lastname,
  birthYear,
  isAdmin,
  role,
}: AdminUpdateUserParams): Promise<AdminUpdateUserResult> {
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }
    if (!user.isAdmin) {
      return { error: "Forbidden", status: 403 };
    }

    const start = Date.now();

    if (!id || !username) {
      return { error: "Faltan campos requeridos", status: 400 };
    }

    if (await usernameExists(username, id)) {
      return { error: "El nombre de usuario ya existe", status: 400 };
    }

    const updatedUser = await updateUserRecord(id, {
      username,
      name: name || null,
      lastname: lastname || null,
      birthYear: birthYear || null,
      isAdmin: !!isAdmin,
      role: role || "MEMBER",
      ...(password && password.length > 0
        ? { password: await hash(password, 10) }
        : {}),
    });

    if (!updatedUser) {
      return { error: "Usuario no encontrado", status: 404 };
    }

    const duration = Date.now() - start;

    log({
      event: "User update",
      category: "ADMIN",
      duration,
      meta: {
        targetUserId: id,
        updatedByAdmin: true,
        username: username || "unknown",
        passwordUpdated: !!password,
        isAdmin: !!isAdmin,
        role: role || "MEMBER",
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { error: "Error al actualizar el usuario", status: 500 };
  }
}

export async function deleteUser({
  id,
}: DeleteUserParams): Promise<DeleteUserResult | undefined> {
  let _err: Error | null = null;

  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }
    if (!user.isAdmin) {
      return { error: "Forbidden", status: 403 };
    }

    if (!id) {
      return { error: "ID de usuario requerido", status: 400 };
    }

    if (id === user.id) {
      return { error: "No se puede eliminar el propio usuario", status: 400 };
    }

    const start = Date.now();
    const userToDelete = await findUserSessionById(id);

    if (!userToDelete) {
      return { error: "Usuario no encontrado", status: 404 };
    }

    await deleteUserRecord(id);

    const duration = Date.now() - start;

    log({
      event: "User deletion",
      category: "ADMIN",
      duration,
      meta: {
        userId: id,
        username: userToDelete.username || "unknown",
        isAdmin: userToDelete.isAdmin,
        role: userToDelete.role,
        deletedBy: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error al eliminar usuario:", _err);
      return { error: "Error al eliminar el usuario", status: 500 };
    }
  }
}

export async function getUsers(): Promise<Session[]> {
  return listUsers();
}
