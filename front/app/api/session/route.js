import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = cookies().get("yomimono_key");
  if (session) return NextResponse.json({ loggedIn: true });
  return new NextResponse(null, { status: 401 });
}
