import fs from "node:fs/promises";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider } from "@/lib/types";

export async function readBookFile(fullPath: string, provider = (process.env.LIB_PROVIDER || "local") as StorageProvider): Promise<Buffer> {
  if (provider !== "cloud") return fs.readFile(fullPath);
  const response = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: fullPath.replace(/^\//, "") }));
  if (!response.Body) throw new Error("Book file was not found in storage");
  return Buffer.from(await response.Body.transformToByteArray());
}
