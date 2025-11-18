import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import AdmZip from "adm-zip";
import fs from "fs/promises";
import path from "path";
import os from "os";
import prisma from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const activeVolumes = new Map();

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export async function POST(req) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug },
    });

    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    if (activeVolumes.has(slug)) {
      const tempDir = await activeVolumes.get(slug);

      try {
        await fs.access(tempDir);
        const imagePaths = await getImagePathsFromDir(tempDir);
        return NextResponse.json({ images: imagePaths });
      } catch (err) {
        activeVolumes.delete(slug);
      }
    }

    let zipBuffer;

    if (LIB_PROVIDER === "cloud") {
      zipBuffer = await downloadFromR2(volume.fullPath);
    } else {
      zipBuffer = await fs.readFile(volume.fullPath);
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    const entries = zipEntries
      .filter((entry) => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return !entry.isDirectory && validImageExtensions.includes(ext);
      })
      .sort((a, b) => {
        const normalize = (name) =>
          name
            .split("/")
            .map((segment) =>
              segment.replace(/\d+/g, (num) => num.padStart(10, "0"))
            )
            .join("/");

        const nameA = normalize(a.entryName);
        const nameB = normalize(b.entryName);

        return nameA.localeCompare(nameB);
      });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));

    activeVolumes.set(slug, tempDir);

    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        activeVolumes.delete(slug);
      } catch (err) {
        console.error("Failed to delete temp folder:", tempDir, err);
      }
    }, 72 * 60 * 60 * 1000);

    const imagePaths = [];

    let imageCounter = 1;

    for (const entry of entries) {
      const ext = path.extname(entry.entryName).toLowerCase();
      const newName = `${String(imageCounter).padStart(4, "0")}${ext}`;
      const imagePath = path.join(tempDir, newName);
      const fileData = entry.getData();

      await fs.writeFile(imagePath, fileData);
      imagePaths.push(
        `/api/reader/tempImage?path=${encodeURIComponent(imagePath)}`
      );
      imageCounter++;
    }

    return NextResponse.json({ images: imagePaths });
  } catch (err) {
    console.error("ZIP read error:", err);
    return NextResponse.json(
      { error: "Failed to read archive" },
      { status: 500 }
    );
  }
}

async function downloadFromR2(fullPath) {
  const key = fullPath.replace(/^\//, "");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to download from R2: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getImagePathsFromDir(tempDir) {
  const files = await fs.readdir(tempDir);
  return files
    .filter((file) =>
      validImageExtensions.includes(path.extname(file).toLowerCase())
    )
    .map(
      (file) =>
        `/api/reader/tempImage?path=${encodeURIComponent(
          path.join(tempDir, file)
        )}`
    );
}
