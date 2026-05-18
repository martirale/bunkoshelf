import { NextResponse, connection } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";

import { mainJob } from "@/lib/jobs/scan/manga/mainJob";
import { log } from "@/lib/logger";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";
import fs from "fs/promises";
import path from "path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import {
  cleanupOrphanedGenresAndTags,
  countVolumesBySeriesId,
  deleteFileChecksumsByPaths,
  deleteSeriesById,
  deleteVolumeByFullPath,
  findFileChecksumRecord,
  listAllChecksumPaths,
  listAllVolumePaths,
} from "@/lib/db/ingestion";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const STATUS_PATH = path.join(process.cwd(), "tmp", "checksum-status.json");
const SUPPORTED_EXTENSIONS = [".cbz", ".zip", ".cbr", ".rar"];

interface CloudFileInfo {
  volumeFiles: { name: string; fullPath: string }[];
  txtFiles: { key: string; path: string; name: string }[];
}

async function checksumVerification(): Promise<number> {
  const filesToIndex: string[] = [];

  await fs.mkdir(path.dirname(STATUS_PATH), { recursive: true });

  if (LIB_PROVIDER === "cloud") {
    const prefix = "library/manga/";
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);
    const directoriesWithFiles = new Map<string, CloudFileInfo>();
    const existingVolumePaths = new Set<string>();
    const existingTxtPaths = new Set<string>();

    if (response.Contents) {
      for (const item of response.Contents) {
        const relativePath = item.Key!.replace(prefix, "");
        const parts = relativePath.split("/");

        if (parts.length < 2) continue;

        const directoryPath = `/${path.dirname(item.Key!)}`;
        const fileName = parts[parts.length - 1];
        const ext = path.extname(fileName).toLowerCase();

        if (!directoriesWithFiles.has(directoryPath)) {
          directoriesWithFiles.set(directoryPath, {
            volumeFiles: [],
            txtFiles: [],
          });
        }

        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          directoriesWithFiles.get(directoryPath)!.volumeFiles.push({
            name: fileName,
            fullPath: `/${item.Key!}`,
          });
          existingVolumePaths.add(`/${item.Key!}`);
        } else if (fileName.endsWith(".txt")) {
          directoriesWithFiles.get(directoryPath)!.txtFiles.push({
            key: item.Key!,
            path: `/${item.Key!}`,
            name: fileName,
          });
          existingTxtPaths.add(`/${item.Key!}`);
        }
      }

      for (const [, info] of directoriesWithFiles) {
        if (info.volumeFiles.length === 0) continue;

        if (info.txtFiles.length === 0) {
          for (const volumeFile of info.volumeFiles) {
            filesToIndex.push(volumeFile.fullPath);
          }
        } else {
          const txtMap = new Map<string, { key: string; path: string; name: string }>();
          for (const txtFile of info.txtFiles) {
            const baseName = path.parse(txtFile.name).name;
            txtMap.set(baseName, txtFile);
          }

          for (const volumeFile of info.volumeFiles) {
            const baseName = path.parse(volumeFile.name).name;
            const correspondingTxt = txtMap.get(baseName);

            if (!correspondingTxt) {
              filesToIndex.push(volumeFile.fullPath);
              continue;
            }

            const getCommand = new GetObjectCommand({
              Bucket: R2_BUCKET,
              Key: correspondingTxt.key,
            });

            const presignedUrl = await getSignedUrl(r2Client, getCommand, {
              expiresIn: 300,
            });

            const txtResponse = await fetch(presignedUrl);
            if (!txtResponse.ok) {
              filesToIndex.push(volumeFile.fullPath);
              continue;
            }

            const txtContent = await txtResponse.text();
            const checksumFromFile = txtContent.trim();

            const dbRecord = await findFileChecksumRecord(correspondingTxt.path);

            if (!dbRecord || dbRecord.checksum !== checksumFromFile) {
              filesToIndex.push(volumeFile.fullPath);
            }
          }
        }
      }
    }

    const allDbVolumes = await listAllVolumePaths();

    const deletedSeriesIds = new Set<string>();

    for (const volume of allDbVolumes) {
      if (!existingVolumePaths.has(volume.fullPath)) {
        await deleteVolumeByFullPath(volume.fullPath);

        if (volume.seriesId) {
          deletedSeriesIds.add(volume.seriesId);
        }

        const txtPath = volume.fullPath.replace(
          /\.(cbz|zip|cbr|rar)$/i,
          ".txt"
        );
        await deleteFileChecksumsByPaths([txtPath]);
      }
    }

    for (const seriesId of deletedSeriesIds) {
      const remainingVolumes = await countVolumesBySeriesId(seriesId);

      if (remainingVolumes === 0) {
        await deleteSeriesById(seriesId);
      }
    }

    const allDbChecksums = await listAllChecksumPaths();

    for (const record of allDbChecksums) {
      if (record && !existingTxtPaths.has(record)) {
        await deleteFileChecksumsByPaths([record]);
      }
    }
  } else {
    const dirContents = await fs.readdir(LIBRARY_PATH, {
      withFileTypes: true,
    });

    const existingVolumePaths = new Set<string>();
    const existingTxtPaths = new Set<string>();

    for (const entry of dirContents) {
      if (!entry.isDirectory()) continue;

      const entryPath = path.join(LIBRARY_PATH, entry.name);
      const files = await fs.readdir(entryPath);

      const volumeFiles = files.filter((f) =>
        SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
      );

      if (volumeFiles.length === 0) continue;

      const txtFiles = files.filter((f) => f.endsWith(".txt"));

      for (const volumeFile of volumeFiles) {
        existingVolumePaths.add(path.join(entryPath, volumeFile));
      }

      for (const txtFile of txtFiles) {
        existingTxtPaths.add(path.join(entryPath, txtFile));
      }

      if (txtFiles.length === 0) {
        for (const volumeFile of volumeFiles) {
          filesToIndex.push(path.join(entryPath, volumeFile));
        }
      } else {
        const txtMap = new Map<string, string>();
        for (const txtFile of txtFiles) {
          const baseName = path.parse(txtFile).name;
          txtMap.set(baseName, txtFile);
        }

        for (const volumeFile of volumeFiles) {
          const volumePath = path.join(entryPath, volumeFile);
          const baseName = path.parse(volumeFile).name;
          const correspondingTxt = txtMap.get(baseName);

          if (!correspondingTxt) {
            filesToIndex.push(volumePath);
            continue;
          }

          const txtPath = path.join(entryPath, correspondingTxt);
          const txtContent = await fs.readFile(txtPath, "utf-8");
          const checksumFromFile = txtContent.trim();

          const dbRecord = await findFileChecksumRecord(txtPath);

          if (!dbRecord || dbRecord.checksum !== checksumFromFile) {
            filesToIndex.push(volumePath);
          }
        }
      }
    }

    const allDbVolumes = await listAllVolumePaths();

    const deletedSeriesIds = new Set<string>();

    for (const volume of allDbVolumes) {
      if (!existingVolumePaths.has(volume.fullPath)) {
        await deleteVolumeByFullPath(volume.fullPath);

        if (volume.seriesId) {
          deletedSeriesIds.add(volume.seriesId);
        }

        const txtPath = volume.fullPath.replace(
          /\.(cbz|zip|cbr|rar)$/i,
          ".txt"
        );
        await deleteFileChecksumsByPaths([txtPath]);
      }
    }

    for (const seriesId of deletedSeriesIds) {
      const remainingVolumes = await countVolumesBySeriesId(seriesId);

      if (remainingVolumes === 0) {
        await deleteSeriesById(seriesId);
      }
    }

    const allDbChecksums = await listAllChecksumPaths();

    for (const record of allDbChecksums) {
      if (record && !existingTxtPaths.has(record)) {
        await deleteFileChecksumsByPaths([record]);
      }
    }
  }

  await cleanupOrphanedGenresAndTags();

  await fs.writeFile(
    STATUS_PATH,
    JSON.stringify(
      { filesToIndex, timestamp: new Date().toISOString() },
      null,
      2
    ),
    "utf-8"
  );

  return filesToIndex.length;
}

async function runBackgroundJob() {
  await checksumVerification();
  await mainJob();

  await fs.writeFile(
    STATUS_PATH,
    JSON.stringify(
      { filesToIndex: [], timestamp: new Date().toISOString() },
      null,
      2
    ),
    "utf-8"
  );
}

export async function POST() {
  let _err: Error | undefined;
  try {
    await connection();

    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await runBackgroundJob();
    revalidateMangaLibraryCache();

    log({
      event: "Library scan completed",
      category: "LIBRARY",
      meta: {
        username: user?.username ?? null,
        isAdmin: user?.isAdmin ?? false,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Escaneo completado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error al ejecutar el escaneo:", _err);
      return NextResponse.json(
        { ok: false, error: "Error al ejecutar el escaneo" },
        { status: 500 }
      );
    }
  }
}
