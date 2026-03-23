"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export async function createUser({
  username,
  password,
  name,
  lastname,
  birthYear,
  isAdmin,
  role,
}) {
  let _err;
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

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { error: "El nombre de usuario ya existe", status: 400 };
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        lastname: lastname || null,
        birthYear: birthYear || null,
        isAdmin: !!isAdmin,
        role: role || "MEMBER",
      },
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
    _err = error;
  } finally {
    if (_err) {
      console.error("Error creando usuario:", _err);
      return { error: "Error al crear el usuario", status: 500 };
    }
  }
}

export async function updateUser({ name, lastname, password }) {
  try {
    const session = await verifySession();
    if (!session) {
      return { error: "Unauthorized", status: 401 };
    }

    const start = Date.now();

    const data = {
      name,
      lastname,
    };

    if (password && password.length > 0) {
      data.password = await hash(password, 10);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { username: true },
    });

    await prisma.user.update({
      where: { id: session.id },
      data,
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
}) {
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

    const dataToUpdate = {
      username,
      name: name || null,
      lastname: lastname || null,
      birthYear: birthYear || null,
      isAdmin: !!isAdmin,
      role: role || "MEMBER",
    };

    if (password && password.length > 0) {
      dataToUpdate.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

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

export async function deleteUser({ id }) {
  let _err;
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

    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { username: true, name: true, lastname: true, isAdmin: true, role: true },
    });

    if (!userToDelete) {
      return { error: "Usuario no encontrado", status: 404 };
    }

    await prisma.user.delete({
      where: { id },
    });

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
    _err = error;
  } finally {
    if (_err) {
      console.error("Error al eliminar usuario:", _err);
      return { error: "Error al eliminar el usuario", status: 500 };
    }
  }
}
