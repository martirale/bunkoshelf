import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateChecksum() {
  return crypto.randomBytes(8).toString("hex");
}

export async function indexUploadedVolume({
  fileName,
  fullPath,
  dirName,
  seriesPath,
  isOneshot,
  coverFilename,
  metadata,
  genres,
  tags,
  fileSize,
}) {
  const cleanTitle = dirName.replace(/\[oneshot\]/gi, "").trim();
  const seriesSlug = toSlug(cleanTitle);

  const mangaSeries = await prisma.mangaSeries.upsert({
    where: { slug: seriesSlug },
    update: {
      title: cleanTitle,
      path: seriesPath,
      isOneshot: !!isOneshot,
      mtime: new Date(),
    },
    create: {
      title: cleanTitle,
      slug: seriesSlug,
      path: seriesPath,
      isOneshot: !!isOneshot,
      mtime: new Date(),
    },
  });

  const volTitle = path.basename(fileName, path.extname(fileName));
  const volSlug = toSlug(volTitle);

  const mangaVolume = await prisma.mangaVolume.upsert({
    where: { slug: volSlug },
    update: {
      title: volTitle,
      filename: fileName,
      fullPath,
      size: fileSize || 0,
      mtime: new Date(),
      coverImage: coverFilename || null,
      seriesId: mangaSeries.id,
    },
    create: {
      title: volTitle,
      slug: volSlug,
      filename: fileName,
      fullPath,
      size: fileSize || 0,
      mtime: new Date(),
      coverImage: coverFilename || null,
      seriesId: mangaSeries.id,
    },
  });

  if (metadata) {
    const volumeMeta = await prisma.volumeMetadata.upsert({
      where: { filePath: fullPath },
      update: metadata,
      create: { filePath: fullPath, ...metadata },
    });

    if (mangaVolume.metadataId !== volumeMeta.id) {
      await prisma.mangaVolume.update({
        where: { id: mangaVolume.id },
        data: { metadataId: volumeMeta.id },
      });
    }

    if (genres && genres.length > 0) {
      await prisma.volumeToGenre.deleteMany({
        where: { volumeId: mangaVolume.id },
      });

      for (const genreName of genres) {
        const genre = await prisma.genre.upsert({
          where: { name: genreName },
          update: {},
          create: { name: genreName },
        });

        await prisma.volumeToGenre.create({
          data: { volumeId: mangaVolume.id, genreId: genre.id },
        });
      }
    }

    if (tags && tags.length > 0) {
      await prisma.volumeToTag.deleteMany({
        where: { volumeId: mangaVolume.id },
      });

      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await prisma.volumeToTag.create({
          data: { volumeId: mangaVolume.id, tagId: tag.id },
        });
      }
    }
  }

  const checksum = generateChecksum();
  const txtFileName = `${path.parse(fileName).name}.txt`;

  return { mangaSeries, mangaVolume, checksum, txtFileName };
}
