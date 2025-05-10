import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set("yomimono_key", "", {
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({ success: true });
}
