"use client";

import { ScanSearch, DatabaseBackup, Loader2 } from "lucide-react";
import { useToast } from "../ToastProvider";
import useScanPolling from "@/hooks/useScanPolling";

export default function LibSettingsButtons({ lang, intl }) {
  const { addToast, updateToast } = useToast();
  const { startPolling, loading } = useScanPolling({
    lang,
    intl,
    addToast,
    updateToast,
  });

  const handleFullScan = async () => {
    try {
      await startPolling();
    } catch (err) {
      addToast({
        title: intl.toastSettings.scanErrorTt,
        description: intl.toastSettings.scanError,
        variant: "error",
      });
    }
  };

  const handleDownload = async () => {
    let url;
    try {
      const res = await fetch("/api/admin/db/download");
      if (!res.ok) throw new Error("No se pudo descargar la base de datos");
      const blob = await res.blob();
      url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bunkoshelf.db";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert(
        intl.toastSettings.backupErrorAlert ||
          "Ocurrió un error al descargar la base de datos."
      );
    } finally {
      if (url) window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={handleFullScan}
        disabled={loading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-9 h-9 mb-4 animate-spin" />
        ) : (
          <ScanSearch className="w-9 h-9 mb-4" />
        )}
        {loading ? intl.settings.scanning : intl.settings.scanLibrary}
      </button>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        <DatabaseBackup className="w-9 h-9 mb-4" />
        {intl.settings.backupdb}
      </button>
    </div>
  );
}
