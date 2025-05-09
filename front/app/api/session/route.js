import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = cookies().get("token");
  if (session) return NextResponse.json({ loggedIn: true });
  return new NextResponse(null, { status: 401 });
}
