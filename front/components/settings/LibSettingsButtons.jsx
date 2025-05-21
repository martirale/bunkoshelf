"use client";

import { useState } from "react";
import { ScanSearch, DatabaseBackup, Loader2 } from "lucide-react";
import { useToast } from "@/ui/toast/ToastProvider";

export default function LibSettingsButtons({ intl }) {
  const [loadingFullScan, setLoadingFullScan] = useState(false);
  const { addToast } = useToast();

  // Escaneo completo
  const handleFullScan = async () => {
    setLoadingFullScan(true);
    try {
      const res = await fetch("/api/admin/fullScan", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al escanear la biblioteca");

      addToast({
        title: intl.toastSettings.scanSuccessTt,
        description: intl.toastSettings.scanSuccessFull,
        variant: "success",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      addToast({
        title: intl.toastSettings.scanErrorTt,
        description: intl.toastSettings.scanError,
        variant: "error",
      });
    } finally {
      setLoadingFullScan(false);
    }
  };

  // Bloqueamos botones si alguno está cargando
  const isLoading = loadingFullScan;

  // Descarga de DB
  const handleDownload = () => {
    fetch("/api/admin/db/download")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo descargar la base de datos");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bunkoshelf.db";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        alert("Ocurrió un error al descargar la base de datos.");
      });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={handleFullScan}
        disabled={isLoading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        {loadingFullScan ? (
          <Loader2 className="w-9 h-9 mb-4 animate-spin" />
        ) : (
          <ScanSearch className="w-9 h-9 mb-4" />
        )}
        {loadingFullScan ? intl.settings.scanning : intl.settings.scanLibrary}
      </button>

      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        <DatabaseBackup className="w-9 h-9 mb-4" />
        {intl.settings.backupdb}
      </button>
    </div>
  );
}
