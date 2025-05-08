import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      isAuthenticated: true,
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
      name: decoded.name,
      lastname: decoded.lastname,
    });
  } catch (err) {
    console.error("[SESSION_CHECK_ERROR]", err);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
