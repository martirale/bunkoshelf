"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { BookOpenIcon, FileIcon } from "lucide-react";

export default function DropzoneUpload({
  onDropAccepted,
  multiple = false,
  accept,
  intl,
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      let _err;
      try {
        setFiles(acceptedFiles);
        if (onDropAccepted) {
          await onDropAccepted(acceptedFiles);
        }
      } catch (e) {
        _err = e;
      } finally {
        if (_err) throw _err;
      }
    },
    [onDropAccepted]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    multiple,
    accept,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  function getFileIcon(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (["cbz", "zip", "cbr", "rar"].includes(ext)) {
      return <BookOpenIcon size={32} className="text-lilah" />;
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
