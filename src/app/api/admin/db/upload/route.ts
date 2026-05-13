import { NextResponse, NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { restoreDatabaseBackup } from "@/lib/db/backup";

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    return NextResponse.json(
      { error: "The file is not a valid Bunko backup" },
      { status: 400 }
    );
  }

  try {
    await restoreDatabaseBackup(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not restore the database backup",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
