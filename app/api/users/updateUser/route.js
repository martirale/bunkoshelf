import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const { name, lastname, password } = await req.json();

  const data = {
    name,
    lastname,
  };

  if (password && password.length > 0) {
    data.password = await hash(password, 10);
  }

  try {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
