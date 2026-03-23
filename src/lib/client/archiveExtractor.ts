const IMAGE_REGEX = /\.(jpg|jpeg|png|webp)$/i;

interface ArchiveEntry {
  path: string;
  file: {
    name: string;
    extract: () => Promise<Blob | null>;
  };
}

interface ExtractionResult {
  coverBlob: Blob | null;
  coverExt: string | null;
  comicInfoXml: string | null;
}

export async function extractFromArchive(file: File): Promise<ExtractionResult | null> {
  const { Archive } = await import("libarchive.js");

  await Archive.init({
    workerUrl: "/libarchive/worker-bundle.js",
  });

  const archive = await Archive.open(file);
  const entries: ArchiveEntry[] = await archive.getFilesArray();

  const imageEntries = entries
    .filter(
      (entry) =>
        !entry.path.includes("__MACOSX") &&
        IMAGE_REGEX.test(entry.file.name)
    )
    .sort((a, b) => {
      const fullA = a.path + a.file.name;
      const fullB = b.path + b.file.name;
      return fullA.localeCompare(fullB);
    });

  const comicInfoEntry = entries.find(
    (entry) => entry.file.name.toLowerCase() === "comicinfo.xml"
  );

  let coverBlob: Blob | null = null;
  let coverExt: string | null = null;

  if (imageEntries.length > 0) {
    const firstImage = imageEntries[0];
    const extractedFile = await firstImage.file.extract();

    if (extractedFile) {
      coverBlob = extractedFile;
      const match = firstImage.file.name.match(IMAGE_REGEX);
      coverExt = match ? `.${match[1].toLowerCase()}` : ".jpg";
    }
  }

  let comicInfoXml: string | null = null;

  if (comicInfoEntry) {
    const extractedXml = await comicInfoEntry.file.extract();

    if (extractedXml) {
      comicInfoXml = await extractedXml.text();
    }
  }

  await archive.close();

  if (!coverBlob && !comicInfoXml) {
    return null;
  }

  return { coverBlob, coverExt, comicInfoXml };
}
