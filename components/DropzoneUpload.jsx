"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ImageIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  MusicIcon,
  VideoIcon,
  FileIcon,
  FileArchiveIcon,
} from "lucide-react";

export default function DropzoneUpload({
  onDropAccepted,
  multiple = false,
  accept,
  intl,
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const maxFiles = multiple ? 5 : 1;

  const onDrop = useCallback(
    async (acceptedFiles) => {
      let _err;
      try {
        const limited = acceptedFiles.slice(0, maxFiles);
        setFiles(limited);
        if (onDropAccepted) {
          if (multiple) {
            await onDropAccepted(limited);
          } else {
            await onDropAccepted(limited[0]);
          }
        }
      } catch (e) {
        _err = e;
      } finally {
        if (_err) throw _err;
      }
    },
    [onDropAccepted, multiple, maxFiles]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    accept,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  function getFileIcon(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (
      ["png", "jpg", "jpeg", "gif", "svg", "webp", "tif", "tiff"].includes(ext)
    ) {
      return <ImageIcon size={32} className="text-foreground" />;
    }
    if (ext === "pdf") {
      return <FileTextIcon size={32} className="text-red-500" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheetIcon size={32} className="text-green-600" />;
    }
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
      return <MusicIcon size={32} className="text-amber-600" />;
    }
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
      return <VideoIcon size={32} className="text-purple-600" />;
    }
    if (["zip", "rar", "7z"].includes(ext)) {
      return <FileArchiveIcon size={32} className="text-foreground" />;
    }
    return <FileIcon size={32} className="text-muted-foreground" />;
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors duration-200
        ${isDragActive ? "border-primary bg-primary/10" : "border-muted"}
        ${isDragReject ? "border-destructive bg-destructive/10" : ""}
        px-6 py-8 w-full mx-auto cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-primary
        min-h-[256px] text-center
      `}
      tabIndex={0}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col gap-2 items-center">
        <span className="font-medium text-muted-foreground">
          {isDragActive ? intl.misc.dropzoneActive : intl.misc.dropzoneTt}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          {multiple ? intl.misc.dropzoneMulti : intl.misc.dropzoneSingle}
        </span>
      </div>
      {files.length > 0 && (
        <ul className="mt-6 w-full flex flex-wrap justify-center gap-3">
          {files.map((file) => (
            <li key={file.name} className="flex flex-col items-center w-32">
              <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted/20">
                {getFileIcon(file)}
              </div>
              <span className="text-xs mt-2 text-center break-words whitespace-normal w-full">
                {file.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
