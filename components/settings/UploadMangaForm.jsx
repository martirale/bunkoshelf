"use client";

import { useState, useEffect } from "react";
import { BookOpenIcon } from "lucide-react";
import { useToast } from "../ToastProvider";
import DropzoneUpload from "../DropzoneUpload";

export default function UploadMangaForm({ intl }) {
  const [isManga, setIsManga] = useState(true);
  const [directories, setDirectories] = useState([]);
  const [selectedDirectory, setSelectedDirectory] = useState("");
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [isOneshot, setIsOneshot] = useState(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useToast();

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let _err;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("type", isManga ? "manga" : "books");
      formData.append("isNew", selectedDirectory === "new" ? "true" : "false");

      if (selectedDirectory === "new") {
        formData.append("newDirectoryName", newDirectoryName);
        formData.append("isOneshot", isOneshot ? "true" : "false");
      } else {
        formData.append("existingDirectory", selectedDirectory);
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/admin/upload/library", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        addToast({
          title: "Éxito",
          description: `${isManga ? "Manga" : "Libro"} subido correctamente`,
          variant: "success",
        });
        setSelectedDirectory("");
        setNewDirectoryName("");
        setIsOneshot(false);
        setFiles([]);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || "Error al subir archivos");
      }
    } catch (e) {
      _err = e;
    } finally {
      setIsLoading(false);
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
        <BookOpenIcon className="w-7 h-7 mr-2" />
        Subir Manga o Libro
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
            Manga
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
            Libro
          </button>
        </div>

        <select
          value={selectedDirectory}
          onChange={(e) => setSelectedDirectory(e.target.value)}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        >
          <option value="">Selecciona un directorio</option>
          <option value="new">{isManga ? "Nuevo manga" : "Nuevo libro"}</option>
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
              placeholder="Nombre del nuevo directorio"
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
          multiple={true}
          accept={{
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
            "application/pdf": [".pdf"],
            "application/zip": [".zip", ".cbz"],
            "application/x-rar-compressed": [".rar", ".cbr"],
          }}
        />

        <button
          type="submit"
          disabled={isLoading || files.length === 0}
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Subiendo..." : "Subir archivos"}
        </button>
      </form>
    </div>
  );
}
