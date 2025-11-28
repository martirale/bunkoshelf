import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching push subscriptions:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
