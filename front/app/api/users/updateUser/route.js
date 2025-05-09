import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, lastname, password } = await req.json();

  const data = {
    name,
    lastname,
  };

  if (password && password.length > 0) {
    data.password = await hash(password, 10);
  }

  try {
    await prisma.user.update({
      where: { id: session.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
