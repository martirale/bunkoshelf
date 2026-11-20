import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile, rename, rm, stat } from "node:fs/promises";
import { addAbortSignal, Readable } from "node:stream";
import {
  AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand,
  GetObjectCommand, HeadObjectCommand, PutObjectCommand, UploadPartCommand,
  type CompletedPart, type CreateMultipartUploadCommandInput,
} from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "./r2.ts";
import type { StorageProvider } from "./types/manga.ts";

const controlTimeout = 15_000;
const partTimeout = 45_000;
const uploadTimeout = 240_000;
const partSize = 32 * 1024 * 1024;
const multipartThreshold = 4 * partSize;
const writeIdKey = "bunko-comicinfo-write";
const etagPrefix = "etag:";

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
  }), { abortSignal: AbortSignal.timeout(controlTimeout) });
  if (response.ETag !== expected.etag || response.ContentLength !== expected.data.length) throw new Error("conflict");
}

export async function readStoredComicArchive(filePath: string, provider: StorageProvider, expectedRevision?: string): Promise<ComicArchiveSnapshot> {
  if (provider === "local") {
    const data = await readFile(filePath);
    return { data, revision: revision(data) };
  }
  const expectedEtag = expectedRevision?.startsWith(etagPrefix) ? expectedRevision.slice(etagPrefix.length) : undefined;
  if (expectedEtag !== undefined && !/^"[^"\s,]+"$/.test(expectedEtag)) throw new Error("conflict");
  const signal = AbortSignal.timeout(60_000);
  const response = await r2Client.send(new GetObjectCommand({
    Bucket: R2_BUCKET, Key: filePath.replace(/^\//, ""), IfMatch: expectedEtag,
  }), { abortSignal: signal });
  const body = response.Body;
  if (!(body instanceof Readable)) throw new Error("loadError");
  try {
    if (!response.ETag || response.ContentLength === undefined) throw new Error("loadError");
    if (expectedEtag !== undefined && response.ETag !== expectedEtag) throw new Error("conflict");
    const data = Buffer.allocUnsafe(response.ContentLength);
    let offset = 0;
    for await (const chunk of addAbortSignal(signal, body)) {
      if (offset + chunk.length > data.length) throw new Error("loadError");
      offset += chunk.copy(data, offset);
    }
    if (offset !== data.length) throw new Error("loadError");
    return {
      data,
      revision: expectedRevision && expectedEtag === undefined ? revision(data) : `${etagPrefix}${response.ETag}`,
      etag: response.ETag,
      contentType: response.ContentType, cacheControl: response.CacheControl,
      contentDisposition: response.ContentDisposition, contentEncoding: response.ContentEncoding,
      contentLanguage: response.ContentLanguage, metadata: response.Metadata,
    };
  } finally {
    body.destroy();
  }
}

async function publishCloudArchive(
  object: CreateMultipartUploadCommandInput,
  data: Buffer,
  publish: () => Promise<{ ETag?: string }>,
  abort?: () => Promise<boolean>,
) {
  try {
    const response = await publish();
    if (response.ETag) return response.ETag;
    throw new Error("writeUncertain");
  } catch (error) {
    const aborted = await abort?.();
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    const rejected = status !== undefined && status >= 400 && status < 500 && status !== 408;
    const response = await r2Client.send(new HeadObjectCommand({ Bucket: object.Bucket, Key: object.Key }), {
      abortSignal: AbortSignal.timeout(controlTimeout),
    }).catch(() => undefined);
    if (!response) throw new Error("writeUncertain", { cause: error });
    if (response.ETag && response.ContentLength === data.length && response.Metadata?.[writeIdKey] === object.Metadata?.[writeIdKey]) {
      return response.ETag;
    }
    if (!aborted && !rejected) throw new Error("writeUncertain", { cause: error });
    throw error;
  }
}

async function uploadCloudArchiveInParts(object: CreateMultipartUploadCommandInput, data: Buffer, etag: string) {
  const { Bucket, Key } = object;
  const deadline = AbortSignal.timeout(uploadTimeout);
  const withTimeout = (timeout: number) => ({ abortSignal: AbortSignal.any([deadline, AbortSignal.timeout(timeout)]) });
  const { UploadId } = await r2Client.send(new CreateMultipartUploadCommand(object), withTimeout(controlTimeout));
  if (!UploadId) throw new Error("saveError");

  async function abort() {
    try {
      await r2Client.send(new AbortMultipartUploadCommand({ Bucket, Key, UploadId }), {
        abortSignal: AbortSignal.timeout(controlTimeout),
      });
      return true;
    } catch (error) {
      if ((error as { name?: string })?.name === "NoSuchUpload") return true;
      console.warn("Failed to abort ComicInfo.xml multipart upload:", error);
      return false;
    }
  }

  const parts: CompletedPart[] = [];
  try {
    for (let offset = 0; offset < data.length; offset += partSize) {
      const PartNumber = parts.length + 1;
      const Body = data.subarray(offset, offset + partSize);
      const response = await r2Client.send(new UploadPartCommand({ Bucket, Key, UploadId, PartNumber, Body }), withTimeout(partTimeout));
      if (!response.ETag) throw new Error("saveError");
      parts.push({ PartNumber, ETag: response.ETag });
    }
  } catch (error) {
    await abort();
    throw error;
  }
  return publishCloudArchive(object, data, () => r2Client.send(new CompleteMultipartUploadCommand({
    Bucket, Key, UploadId, IfMatch: etag, MultipartUpload: { Parts: parts },
  }), withTimeout(controlTimeout)), abort);
}

async function writeCloudArchive(filePath: string, previous: ComicArchiveSnapshot, data: Buffer): Promise<ComicArchiveSnapshot> {
  if (!previous.etag) throw new Error("conflict");
  const expectedEtag = previous.etag;
  const object = {
    Bucket: R2_BUCKET,
    Key: filePath.replace(/^\//, ""),
    ContentType: previous.contentType,
    CacheControl: previous.cacheControl,
    ContentDisposition: previous.contentDisposition,
    ContentEncoding: previous.contentEncoding,
    ContentLanguage: previous.contentLanguage,
    Metadata: { ...previous.metadata, [writeIdKey]: randomUUID() },
  };
  const etag = data.length >= multipartThreshold
    ? await uploadCloudArchiveInParts(object, data, expectedEtag)
    : await publishCloudArchive(object, data, () => r2Client.send(new PutObjectCommand({
      ...object, Body: data, IfMatch: expectedEtag,
    }), { abortSignal: AbortSignal.timeout(75_000) }));
  return {
    ...previous, data, revision: `${etagPrefix}${etag}`, etag, metadata: object.Metadata,
  };
}

export async function writeStoredComicArchive(filePath: string, provider: StorageProvider, previous: ComicArchiveSnapshot, data: Buffer): Promise<ComicArchiveSnapshot> {
  if (provider === "cloud") return writeCloudArchive(filePath, previous, data);

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
