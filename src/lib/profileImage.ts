import path from "path";
import fs from "fs/promises";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const PROFILE_ROOT_DIR = "profile";
const PROFILE_LOCAL_DIR = path.resolve(process.cwd(), "..", PROFILE_ROOT_DIR);
const PROFILE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const PROFILE_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function validateProfileImage(file: File): string | null {
  if (!(file.type in PROFILE_MIME_TYPES)) {
    return "Invalid image type";
  }

  if (file.size > PROFILE_MAX_SIZE_BYTES) {
    return "Image too large";
  }

  return null;
}

function getProfileImageExtension(file: File): string {
  const extensionFromMime = PROFILE_MIME_TYPES[file.type];

  if (extensionFromMime) {
    return extensionFromMime;
  }

  const extensionFromName = path.extname(file.name).toLowerCase();
  return extensionFromName || ".jpg";
}

function buildProfileImageFilename(userId: string, file: File): string {
  const extension = getProfileImageExtension(file);
  return `${userId}-${crypto.randomUUID()}${extension}`;
}

function buildProfileImageKey(filename: string): string {
  return `${PROFILE_ROOT_DIR}/${filename}`;
}

export async function saveProfileImage(file: File, userId: string): Promise<string> {
  const filename = buildProfileImageFilename(userId, file);
  const key = buildProfileImageKey(filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (LIB_PROVIDER === "cloud") {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return filename;
  }

  await fs.mkdir(PROFILE_LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(PROFILE_LOCAL_DIR, filename), buffer);

  return filename;
}

export async function deleteProfileImage(filename: string | null | undefined): Promise<void> {
  if (!filename) return;

  if (LIB_PROVIDER === "cloud") {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: buildProfileImageKey(filename),
      })
    );
    return;
  }

  await fs.rm(path.join(PROFILE_LOCAL_DIR, filename), { force: true });
}

export async function readProfileImage(filename: string): Promise<Response | null> {
  try {
    if (LIB_PROVIDER === "cloud") {
      const response = await r2Client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: buildProfileImageKey(filename),
        })
      );

      const bytes = await response.Body?.transformToByteArray();

      if (!bytes) return null;

      return new Response(Buffer.from(bytes), {
        headers: {
          "Content-Type": response.ContentType || getContentType(filename),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const file = await fs.readFile(path.join(PROFILE_LOCAL_DIR, filename));

    return new Response(file, {
      headers: {
        "Content-Type": getContentType(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
