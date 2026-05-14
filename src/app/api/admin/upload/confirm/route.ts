import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { log } from "@/lib/logger";
import crypto from "crypto";
import { indexUploadedVolume } from "@/lib/uploadIndexer";
import { upsertFileChecksumRecord } from "@/lib/db/ingestion";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";
import type { ComicMetadata } from "@/lib/types/manga";

function generateChecksum(): string {
  return crypto.randomBytes(8).toString("hex");
}

interface ConfirmFile {
  key: string;
  baseName: string;
  fileName: string;
  coverFilename?: string;
  fileSize?: number;
  volumeMetadata?: {
    metadata: ComicMetadata | null;
    genres: string[];
    tags: string[];
  };
}

interface ConfirmBody {
  files: ConfirmFile[];
  metadata: {
    type: string;
    isNew: boolean;
    newDirectoryName: string;
    isOneshot: boolean;
    existingDirectory: string;
  };
}

export async function POST(request: NextRequest) {
  let _err: Error | undefined;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { files, metadata } = (await request.json()) as ConfirmBody;
    const { type, isNew, newDirectoryName, isOneshot, existingDirectory } =
      metadata;

    const libraryType = type === "manga" ? "manga" : "books";
    const suffix = isOneshot ? " [oneshot]" : "";
    const directoryName = isNew ? newDirectoryName : existingDirectory;
    const dirWithSuffix = `${directoryName}${isNew ? suffix : ""}`;

    for (const file of files) {
      const checksum = generateChecksum();
      const txtFileName = `${file.baseName}.txt`;
      const txtKey = `${file.key.substring(
        0,
        file.key.lastIndexOf("/")
      )}/${txtFileName}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: txtKey,
          Body: checksum,
          ContentType: "text/plain",
        })
      );
      await upsertFileChecksumRecord(`/${txtKey}`, checksum);

      if (libraryType === "manga" && file.volumeMetadata) {
        const seriesPath = `/library/${libraryType}/${dirWithSuffix}`;
        await indexUploadedVolume({
          fileName: file.fileName,
          fullPath: `/${file.key}`,
          dirName: dirWithSuffix,
          seriesPath,
          isOneshot,
          coverFilename: file.coverFilename || null,
          metadata: file.volumeMetadata?.metadata || null,
          genres: file.volumeMetadata?.genres || [],
          tags: file.volumeMetadata?.tags || [],
          fileSize: file.fileSize || 0,
        });
      }
    }

    if (libraryType === "manga") {
      revalidateMangaLibraryCache();
    }

    log({
      event: "Files uploaded to library",
      category: "LIBRARY",
      meta: {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        type: libraryType,
        directory: directoryName,
        filesCount: files.length,
        provider: "cloud",
        method: "presigned",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    _err = e as Error;
  } finally {
    if (_err) {
      console.error("[CONFIRM UPLOAD] Error:", _err);
      return NextResponse.json(
        { error: _err.message || "Error confirming upload" },
        { status: 500 }
      );
    }
  }
}
