"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpenIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import DropzoneUpload from "@/components/DropzoneUpload";
import { extractFromArchive } from "@/lib/client/archiveExtractor";
import { parseComicInfo } from "@/lib/client/comicInfoParser";
import { generateCoverFilename } from "@/lib/client/coverHasher";

const CHUNK_SIZE = 32 * 1024 * 1024;

export default function UploadMangaForm({ intl }) {
  const [isManga, setIsManga] = useState(true);
  const [directories, setDirectories] = useState([]);
  const [selectedDirectory, setSelectedDirectory] = useState("");
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [isOneshot, setIsOneshot] = useState(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const extractedDataRef = useRef(new Map());
  const { addToast } = useToast();

  const isOneshotMode =
    (selectedDirectory === "new" && isOneshot) ||
    (selectedDirectory !== "new" &&
      selectedDirectory !== "" &&
      selectedDirectory.includes("[oneshot]"));

  useEffect(() => {
    const fetchDirectories = async () => {
      let _err;
      try {
        const type = isManga ? "manga" : "books";
        const res = await fetch(
          `/api/admin/upload/library?type=${type}&action=list`
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

  const handleFilesAccepted = async (acceptedFiles) => {
    setFiles(acceptedFiles);
    setIsProcessing(true);
    setUploadProgress("Procesando archivos...");

    const newExtractedData = new Map();

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress(
        `Procesando ${i + 1}/${acceptedFiles.length}: ${file.name}`
      );

      try {
        const result = await extractFromArchive(file);

        if (result) {
          let coverFilename = null;
          let coverBlob = null;

          if (result.coverBlob) {
            coverFilename = await generateCoverFilename(
              result.coverBlob,
              result.coverExt
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
    setUploadProgress("");
  };

  const uploadFileDirectToR2 = async (file, presignedUrl) => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`Error uploading ${file.name} to R2`);
    }
  };

  const uploadCoverToR2 = async (coverBlob, presignedUrl) => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: coverBlob,
      headers: {
        "Content-Type": coverBlob.type || "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error("Error uploading cover to R2");
    }
  };

  const uploadFileInChunks = async (file, metadata, fileIndex, totalFiles) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const extracted = extractedDataRef.current.get(file.name);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      setUploadProgress(
        `${intl.settings.uploadLibraryUploading} ${
          fileIndex + 1
        }/${totalFiles}: ${file.name} (${chunkIndex + 1}/${totalChunks})`
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const res = await fetch("/api/admin/upload/library/chunk", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error al subir chunk ${chunkIndex + 1}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let _err;

    try {
      setIsLoading(true);

      const metadata = {
        type: isManga ? "manga" : "books",
        isNew: selectedDirectory === "new",
        newDirectoryName: selectedDirectory === "new" ? newDirectoryName : null,
        isOneshot: selectedDirectory === "new" ? isOneshot : false,
        existingDirectory:
          selectedDirectory !== "new" ? selectedDirectory : null,
      };

      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extracted = extractedDataRef.current.get(file.name);

        setUploadProgress(
          `${intl.settings.uploadLibraryUploading} ${i + 1}/${files.length}: ${
            file.name
          }`
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
          await uploadFileDirectToR2(file, data.presignedUrl);

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
      if (_err) {
        addToast({
          title: "Error",
          description: _err.message || "Error al subir archivos",
          variant: "error",
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <BookOpenIcon size={28} className="mr-2" />
        {intl.settings.uploadLibraryTt}
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
            {intl.settings.uploadLibraryManga}
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
            {intl.settings.uploadLibraryBook}
          </button>
        </div>

        <select
          value={selectedDirectory}
          onChange={(e) => setSelectedDirectory(e.target.value)}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        >
          <option value="">{intl.settings.uploadLibrarySelect}</option>
          <option value="new">
            {isManga
              ? intl.settings.uploadLibraryNewManga
              : intl.settings.uploadLibraryNewBook}
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
              placeholder={intl.settings.uploadLibraryNewFolder}
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
          <div>
            {uploadProgress && (
              <p className="text-sm text-onix">{uploadProgress}</p>
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
                ? intl.settings.uploadLibraryUploading
                : intl.settings.uploadLibraryBtn}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
