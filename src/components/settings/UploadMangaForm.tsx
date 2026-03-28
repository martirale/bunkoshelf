"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpenIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import DropzoneUpload from "@/components/DropzoneUpload";
import { extractFromArchive } from "@/lib/client/archiveExtractor";
import { parseComicInfo } from "@/lib/client/comicInfoParser";
import { generateCoverFilename } from "@/lib/client/coverHasher";
import { sendPushBroadcast } from "@/actions/web-push";
import type { Dictionary } from "@/lib/types";
import type { ComicMetadata } from "@/lib/types/manga";

const CHUNK_SIZE = 32 * 1024 * 1024;

interface ExtractedFileData {
  coverBlob: Blob | null;
  coverFilename: string | null;
  metadata: ComicMetadata | null;
  genres: string[];
  tags: string[];
}

interface UploadMetadata {
  type: "manga" | "books";
  isNew: boolean;
  newDirectoryName: string | null;
  isOneshot: boolean;
  existingDirectory: string | null;
}

interface UploadedFileEntry {
  key: string;
  baseName: string;
  fileName: string;
  coverFilename: string | null;
  volumeMetadata: {
    metadata: ComicMetadata | null;
    genres: string[];
    tags: string[];
  } | null;
  fileSize: number;
}

interface UploadMangaFormProps {
  intl: Dictionary;
  lang: string;
}

export default function UploadMangaForm({ intl, lang }: UploadMangaFormProps) {
  const [isManga, setIsManga] = useState(true);
  const [directories, setDirectories] = useState<string[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState("");
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [isOneshot, setIsOneshot] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const extractedDataRef = useRef<Map<string, ExtractedFileData>>(new Map());
  const { addToast } = useToast()!;

  const isOneshotMode =
    (selectedDirectory === "new" && isOneshot) ||
    (selectedDirectory !== "new" &&
      selectedDirectory !== "" &&
      selectedDirectory.includes("[oneshot]"));

  useEffect(() => {
    const fetchDirectories = async () => {
      let _err: unknown;
      try {
        const type = isManga ? "manga" : "books";
        const res = await fetch(
          `/api/admin/upload/library?type=${type}&action=list`,
        );
        const data = await res.json();

        if (res.ok) {
          setDirectories(data.directories || []);
        }
      } catch (e) {
        _err = e;
      } finally {
        if (_err) {
          addToast({
            title: "Error",
            description: "Error al cargar directorios",
            variant: "error",
          });
        }
      }
    };

    fetchDirectories();
  }, [isManga, addToast]);

  const handleFilesAccepted = async (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setIsProcessing(true);

    const newExtractedData = new Map<string, ExtractedFileData>();

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        const result = await extractFromArchive(file);

        if (result) {
          let coverFilename: string | null = null;
          let coverBlob: Blob | null = null;

          if (result.coverBlob) {
            coverFilename = await generateCoverFilename(
              result.coverBlob,
              result.coverExt!,
            );
            coverBlob = result.coverBlob;
          }

          let parsedMeta = null;
          if (result.comicInfoXml) {
            parsedMeta = parseComicInfo(result.comicInfoXml);
          }

          newExtractedData.set(file.name, {
            coverBlob,
            coverFilename,
            metadata: parsedMeta?.metadata || null,
            genres: parsedMeta?.genres || [],
            tags: parsedMeta?.tags || [],
          });
        }
      } catch (e) {
        console.error(`Error procesando ${file.name}:`, e);
      }
    }

    extractedDataRef.current = newExtractedData;
    setIsProcessing(false);
  };

  const uploadWithProgress = (
    url: string,
    method: string,
    body: XMLHttpRequestBodyInit,
    headers: Record<string, string> | null,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<XMLHttpRequest> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);

      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.ontimeout = () => reject(new Error("Upload timed out"));
      xhr.timeout = 300000;

      xhr.send(body);
    });
  };

  const uploadFileDirectToR2 = async (
    file: File,
    presignedUrl: string,
    onProgress: (loaded: number, total: number) => void,
  ) => {
    await uploadWithProgress(
      presignedUrl,
      "PUT",
      file,
      { "Content-Type": file.type || "application/octet-stream" },
      onProgress,
    );
  };

  const uploadCoverToR2 = async (coverBlob: Blob, presignedUrl: string) => {
    await uploadWithProgress(
      presignedUrl,
      "PUT",
      coverBlob,
      { "Content-Type": coverBlob.type || "application/octet-stream" },
    );
  };

  const uploadFileInChunks = async (
    file: File,
    metadata: UploadMetadata,
    fileIndex: number,
    totalFiles: number,
  ) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const extracted = extractedDataRef.current.get(file.name);
    const totalSize = file.size;
    let bytesUploaded = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const chunkSize = end - start;

      setUploadProgress(
        `${intl.settings.uploadLibraryUploading} ${
          fileIndex + 1
        }/${totalFiles}: ${file.name} (${chunkIndex + 1}/${totalChunks})`,
      );

      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("chunk", chunk);
      formData.append("fileName", file.name);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileIndex", fileIndex.toString());
      formData.append("totalFiles", totalFiles.toString());

      if (chunkIndex === 0 && extracted) {
        if (extracted.coverBlob && extracted.coverFilename) {
          formData.append("cover", extracted.coverBlob);
          formData.append("coverFilename", extracted.coverFilename);
        }

        const volumeMetadata = {
          metadata: extracted.metadata,
          genres: extracted.genres,
          tags: extracted.tags,
        };
        formData.append("volumeMetadata", JSON.stringify(volumeMetadata));
      }

      const chunkBase = bytesUploaded;
      const xhr = await uploadWithProgress(
        "/api/admin/upload/library/chunk",
        "POST",
        formData,
        null,
        (loaded, total) => {
          const chunkProgress = Math.min(loaded / total, 1) * chunkSize;
          const filePercent = (chunkBase + chunkProgress) / totalSize;
          const overallPercent =
            ((fileIndex + filePercent) / totalFiles) * 100;
          setProgressPercent(Math.round(overallPercent));
        },
      );

      if (xhr.status < 200 || xhr.status >= 300) {
        let errorMsg = `Error al subir chunk ${chunkIndex + 1}`;
        try {
          const data = JSON.parse(xhr.responseText);
          errorMsg = data.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      bytesUploaded += chunkSize;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let _err: unknown;

    try {
      setIsLoading(true);

      const metadata: UploadMetadata = {
        type: isManga ? "manga" : "books",
        isNew: selectedDirectory === "new",
        newDirectoryName: selectedDirectory === "new" ? newDirectoryName : null,
        isOneshot: selectedDirectory === "new" ? isOneshot : false,
        existingDirectory:
          selectedDirectory !== "new" ? selectedDirectory : null,
      };

      const uploadedFiles: UploadedFileEntry[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extracted = extractedDataRef.current.get(file.name);

        setUploadProgress(
          `${intl.settings.uploadLibraryUploading} ${i + 1}/${files.length}: ${
            file.name
          }`,
        );
        const res = await fetch("/api/admin/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            metadata,
            coverFilename: extracted?.coverFilename || null,
          }),
        });

        const data = await res.json();

        if (data.useChunks) {
          await uploadFileInChunks(file, metadata, i, files.length);
        } else if (data.presignedUrl) {
          await uploadFileDirectToR2(file, data.presignedUrl, (loaded, total) => {
            const filePercent = loaded / total;
            const overallPercent = ((i + filePercent) / files.length) * 100;
            setProgressPercent(Math.round(overallPercent));
          });

          if (
            extracted?.coverBlob &&
            extracted?.coverFilename &&
            data.coverPresignedUrl
          ) {
            await uploadCoverToR2(extracted.coverBlob, data.coverPresignedUrl);
          }
          uploadedFiles.push({
            key: data.key,
            baseName: file.name.substring(0, file.name.lastIndexOf(".")),
            fileName: file.name,
            coverFilename: extracted?.coverFilename || null,
            volumeMetadata: extracted
              ? {
                  metadata: extracted.metadata,
                  genres: extracted.genres,
                  tags: extracted.tags,
                }
              : null,
            fileSize: file.size,
          });
        } else {
          throw new Error(`Error getting upload method for ${file.name}`);
        }
      }

      if (uploadedFiles.length > 0) {
        const confirmRes = await fetch("/api/admin/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: uploadedFiles, metadata }),
        });

        if (!confirmRes.ok) {
          throw new Error("Error confirming upload");
        }
      }

      try {
        await sendPushBroadcast({
          title: intl.push.ttLibraryUpdate as string,
          body: intl.push.bodyLibraryUpdate as string,
          url: `/${lang}/manga`,
        });
      } catch (e) {
        console.error("Error al enviar notificaciones push:", e);
      }

      addToast({
        title: "Éxito",
        description: `${files.length} archivo(s) subido(s) correctamente`,
        variant: "success",
      });
      setSelectedDirectory("");
      setNewDirectoryName("");
      setIsOneshot(false);
      setFiles([]);
      extractedDataRef.current = new Map();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      _err = e;
    } finally {
      setIsLoading(false);
      setUploadProgress("");
      setProgressPercent(0);
      if (_err) {
        addToast({
          title: "Error",
          description:
            (_err instanceof Error ? _err.message : null) ||
            "Error al subir archivos",
          variant: "error",
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <BookOpenIcon size={28} className="mr-2" />
        {intl.settings.uploadLibraryTt as string}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsManga(true)}
            className={`font-bold px-6 py-2 rounded-lg leading-none uppercase transition-all duration-300 cursor-pointer ${
              isManga
                ? "text-sand bg-onix border border-onix"
                : "text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix"
            }`}
          >
            {intl.settings.uploadLibraryManga as string}
          </button>
          <button
            type="button"
            onClick={() => setIsManga(false)}
            className={`font-bold px-6 py-2 rounded-lg leading-none uppercase transition-all duration-300 cursor-pointer ${
              !isManga
                ? "text-sand bg-onix border border-onix"
                : "text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix"
            }`}
          >
            {intl.settings.uploadLibraryBook as string}
          </button>
        </div>

        <select
          value={selectedDirectory}
          onChange={(e) => setSelectedDirectory(e.target.value)}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        >
          <option value="">{intl.settings.uploadLibrarySelect as string}</option>
          <option value="new">
            {isManga
              ? (intl.settings.uploadLibraryNewManga as string)
              : (intl.settings.uploadLibraryNewBook as string)}
          </option>
          {directories.map((dir) => (
            <option key={dir} value={dir}>
              {dir}
            </option>
          ))}
        </select>

        {selectedDirectory === "new" && (
          <>
            <input
              type="text"
              value={newDirectoryName}
              onChange={(e) => setNewDirectoryName(e.target.value)}
              placeholder={intl.settings.uploadLibraryNewFolder as string}
              className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
              required
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isOneshot}
                onChange={() => setIsOneshot(!isOneshot)}
                id="isOneshot"
              />
              <label htmlFor="isOneshot">Oneshot</label>
            </div>
          </>
        )}

        <DropzoneUpload
          onDropAccepted={handleFilesAccepted}
          multiple={!isOneshotMode}
          accept={{
            "application/pdf": [".pdf"],
            "application/zip": [".zip", ".cbz"],
            "application/x-rar-compressed": [".rar", ".cbr"],
          }}
          intl={intl}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between gap-5">
          <div className="flex flex-col justify-center gap-1">
            {uploadProgress && (
              <>
                <div className="w-full bg-neutral-500 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-lilah h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-onix/70">
                  {uploadProgress} — {progressPercent}%
                </p>
              </>
            )}
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={isLoading || isProcessing || files.length === 0}
              className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? "Procesando..."
                : isLoading
                  ? (intl.settings.uploadLibraryUploading as string)
                  : (intl.settings.uploadLibraryBtn as string)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
