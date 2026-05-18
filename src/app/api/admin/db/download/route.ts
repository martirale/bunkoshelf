import { NextResponse, connection } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { exportDatabaseBackup } from "@/lib/db/backup";

export async function GET() {
  await connection();

  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const backup = await exportDatabaseBackup();
  const fileName = `bunkoshelf-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
