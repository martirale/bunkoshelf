import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySession } from "@/lib/auth/verifySession";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

export const dynamic = "force-dynamic";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export async function GET(request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const action = searchParams.get("action");

    if (action === "list") {
      const libraryType = type === "manga" ? "manga" : "books";

      let directories = [];

      if (LIB_PROVIDER === "cloud") {
        const prefix = `library/${libraryType}/`;

        const command = new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: prefix,
          Delimiter: "/",
        });

        const response = await r2Client.send(command);

        if (response.CommonPrefixes) {
          directories = response.CommonPrefixes.map((item) => {
            const fullPath = item.Prefix;
            return fullPath.replace(prefix, "").replace(/\/$/, "");
          });
        }
      } else {
        const targetPath = path.join(LIBRARY_PATH, libraryType);
        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        directories = entries
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);
      }

      return NextResponse.json({ directories });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      return NextResponse.json(
        { error: _err.message || "Error processing request" },
        { status: 500 }
      );
    }
  }
}
