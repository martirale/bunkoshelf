import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile, rename, rm, stat } from "node:fs/promises";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "./r2.ts";
import type { StorageProvider } from "./types/manga.ts";

export interface ComicArchiveSnapshot {
  data: Buffer;
  revision: string;
  etag?: string;
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  metadata?: Record<string, string>;
}

function revision(data: Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

async function localRevision(filePath: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

export async function verifyStoredComicArchive(filePath: string, provider: StorageProvider, expected: ComicArchiveSnapshot): Promise<void> {
  if (provider === "local") {
    if (await localRevision(filePath) !== expected.revision) throw new Error("conflict");
    return;
  }
  if (!expected.etag) throw new Error("conflict");
  const response = await r2Client.send(new HeadObjectCommand({
    Bucket: R2_BUCKET,
    Key: filePath.replace(/^\//, ""),
    IfMatch: expected.etag,
  }));
  if (response.ETag !== expected.etag || response.ContentLength !== expected.data.length) throw new Error("conflict");
}

export async function readStoredComicArchive(filePath: string, provider: StorageProvider): Promise<ComicArchiveSnapshot> {
  if (provider === "local") {
    const data = await readFile(filePath);
    return { data, revision: revision(data) };
  }
  const response = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: filePath.replace(/^\//, "") }));
  if (!response.Body || !response.ETag) throw new Error("loadError");
  const bytes = await response.Body.transformToByteArray();
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    data, revision: revision(data), etag: response.ETag,
    contentType: response.ContentType, cacheControl: response.CacheControl,
    contentDisposition: response.ContentDisposition, contentEncoding: response.ContentEncoding,
    contentLanguage: response.ContentLanguage, metadata: response.Metadata,
  };
}

export async function writeStoredComicArchive(filePath: string, provider: StorageProvider, previous: ComicArchiveSnapshot, data: Buffer): Promise<ComicArchiveSnapshot> {
  if (provider === "cloud") {
    if (!previous.etag) throw new Error("conflict");
    const response = await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath.replace(/^\//, ""),
      Body: data,
      IfMatch: previous.etag,
      ContentType: previous.contentType,
      CacheControl: previous.cacheControl,
      ContentDisposition: previous.contentDisposition,
      ContentEncoding: previous.contentEncoding,
      ContentLanguage: previous.contentLanguage,
      Metadata: previous.metadata,
    }));
    return { ...previous, data, revision: revision(data), etag: response.ETag };
  }

  const temporary = `${filePath}.${randomUUID()}.tmp`;
  try {
    const attributes = await stat(filePath);
    await writeFile(temporary, data, { flag: "wx", mode: attributes.mode });
    if (await localRevision(filePath) !== previous.revision) throw new Error("conflict");
    await rename(temporary, filePath);
    return { data, revision: revision(data) };
  } finally {
    await rm(temporary, { force: true });
  }
}
