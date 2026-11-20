import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readdir, rmdir, unlink, utimes } from "node:fs/promises";
import path from "node:path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "./r2";
import type { StorageProvider } from "./types/manga";

export interface ConversionFile {
  name: string;
  revision: string;
  size: number;
}

function objectKey(folder: string, name?: string) {
  return folder.slice(1) + (name === undefined ? "/" : name ? `/${name}` : "");
}

function isMissing(error: unknown) {
  const failure = error as { code?: string; $metadata?: { httpStatusCode?: number } } | null;
  return failure?.code === "ENOENT" || failure?.$metadata?.httpStatusCode === 404;
}

function localRevision(info: { ino: number; size: number; mtimeMs: number }) {
  return `${info.ino}:${info.size}:${info.mtimeMs}`;
}

async function localFiles(root: string, dir = ""): Promise<ConversionFile[]> {
  const localPath = path.join(root, dir);
  const rootInfo = await lstat(localPath);
  if (!rootInfo.isDirectory()) throw new Error("unsafeStorage");
  const results: ConversionFile[] = [];
  for (const entry of await readdir(localPath, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await localFiles(root, name));
    } else if (entry.isFile()) {
      const info = await lstat(path.join(root, name));
      if (!info.isFile()) throw new Error("unsafeStorage");
      results.push({ name, revision: localRevision(info), size: info.size });
    } else {
      throw new Error("unsafeStorage");
    }
  }
  return results;
}

async function cloudFiles(folder: string): Promise<ConversionFile[]> {
  const files: ConversionFile[] = [];
  const prefix = objectKey(folder);
  let token: string | undefined;
  do {
    const result = await r2Client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const item of result.Contents ?? []) {
      if (!item.Key || !item.ETag || item.Size === undefined) throw new Error("unsafeStorage");
      files.push({ name: item.Key.slice(prefix.length) || "/", revision: item.ETag, size: item.Size });
    }
    token = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (token);
  return files;
}

export function listConversionFiles(folder: string, provider: StorageProvider) {
  return provider === "cloud" ? cloudFiles(folder) : localFiles(folder);
}

export async function assertConversionDestination(folder: string, provider: StorageProvider) {
  if (provider === "cloud") {
    if ((await cloudFiles(folder)).length) throw new Error("destinationExists");
    try {
      await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: objectKey(folder, "") }));
    } catch (error) {
      if (isMissing(error)) return;
      throw error;
    }
    throw new Error("destinationExists");
  }
  try {
    await lstat(folder);
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
  throw new Error("destinationExists");
}

export async function createConversionDestination(folder: string, provider: StorageProvider) {
  if (provider === "local") await mkdir(folder);
}

function keyForFile(folder: string, name: string) {
  return name === "/" ? objectKey(folder) : objectKey(folder, name);
}

export async function copyConversionFile(source: string, target: string, provider: StorageProvider, file: ConversionFile): Promise<ConversionFile> {
  if (provider === "cloud") {
    const src = keyForFile(source, file.name);
    const dest = keyForFile(target, file.name);
    const command = new CopyObjectCommand({
      Bucket: R2_BUCKET,
      Key: dest,
      CopySource: `${R2_BUCKET}/${src.split("/").map(encodeURIComponent).join("/")}`,
      CopySourceIfMatch: file.revision,
    });
    command.middlewareStack.add((next) => async (args) => {
      const request = args.request as { headers: Record<string, string> };
      request.headers["cf-copy-destination-if-none-match"] = "*";
      return next(args);
    }, { step: "build" });
    const result = await r2Client.send(command);
    const verified = await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: dest }));
    if (!result.CopyObjectResult?.ETag || verified.ETag !== result.CopyObjectResult.ETag || verified.ContentLength !== file.size) {
      throw new Error("verificationFailed");
    }
    return { ...file, revision: verified.ETag };
  }

  const src = path.join(source, file.name);
  const dest = path.join(target, file.name);
  const original = await lstat(src);
  if (!original.isFile() || localRevision(original) !== file.revision) throw new Error("storageChanged");
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest, constants.COPYFILE_EXCL | constants.COPYFILE_FICLONE);
  await utimes(dest, original.atime, original.mtime);
  const copied = await lstat(dest);
  if (copied.size !== file.size) throw new Error("verificationFailed");
  return { ...file, revision: localRevision(copied) };
}

export async function removeConversionFiles(folder: string, provider: StorageProvider, files: ConversionFile[]) {
  for (const file of files) {
    try {
      if (provider === "cloud") {
        const Key = keyForFile(folder, file.name);
        const head = await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key }));
        if (head.ETag !== file.revision || head.ContentLength !== file.size) throw new Error("storageChanged");
        await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key }));
      } else {
        const fullPath = path.join(folder, file.name);
        const info = await lstat(fullPath);
        if (!info.isFile() || localRevision(info) !== file.revision) throw new Error("storageChanged");
        await unlink(fullPath);
      }
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }
  if (provider === "cloud") {
    if ((await cloudFiles(folder)).length) throw new Error("storageChanged");
  } else {
    await removeEmptyTree(folder).catch((error) => {
      if (!isMissing(error)) throw error;
    });
  }
}

async function removeEmptyTree(folder: string) {
  if (!(await lstat(folder)).isDirectory()) throw new Error("unsafeStorage");
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) throw new Error("storageChanged");
    await removeEmptyTree(path.join(folder, entry.name));
  }
  await rmdir(folder);
}
