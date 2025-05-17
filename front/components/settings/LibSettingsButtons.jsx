"use client";

import { useState } from "react";
import { Radar, ScanSearch, FileScan, Loader2 } from "lucide-react";
import { useToast } from "@/ui/toast/ToastProvider";

export default function LibSettingsButtons({ intl }) {
  const [loadingFullScan, setLoadingFullScan] = useState(false);
  const [loadingLib, setLoadingLib] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const { addToast } = useToast();

  const handleFullScan = async () => {
    setLoadingFullScan(true);
    try {
      const res = await fetch("/api/admin/fullScan", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al escanear la biblioteca");

      addToast({
        title: intl.toastSettings.scanSuccessTt,
        description: intl.toastSettings.scanFullSuccess,
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

  const handleScanLib = async () => {
    setLoadingLib(true);
    try {
      const res = await fetch("/api/admin/indexManga", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al escanear la biblioteca");

      addToast({
        title: intl.toastSettings.scanSuccessTt,
        description: intl.toastSettings.scanLibSuccess,
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
      setLoadingLib(false);
    }
  };

  const handleScanMeta = async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch("/api/admin/scanMetaManga", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al escanear los metadatos");

      addToast({
        title: intl.toastSettings.scanSuccessTt,
        description: intl.toastSettings.scanMetaSuccess,
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
      setLoadingMeta(false);
    }
  };

  // Bloqueamos botones si alguno está cargando
  const isLoading = loadingFullScan || loadingLib || loadingMeta;

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
          <Radar className="w-9 h-9 mb-4" />
        )}
        {loadingFullScan ? intl.settings.scanning : intl.settings.fullScan}
      </button>

      <button
        onClick={handleScanLib}
        disabled={isLoading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        {loadingLib ? (
          <Loader2 className="w-9 h-9 mb-4 animate-spin" />
        ) : (
          <ScanSearch className="w-9 h-9 mb-4" />
        )}
        {loadingLib ? intl.settings.scanning : intl.settings.scanLibrary}
      </button>

      <button
        onClick={handleScanMeta}
        disabled={isLoading}
        className="flex flex-col items-center justify-center text-base leading-5.5 bg-blackamber rounded-lg p-4 hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer disabled:opacity-50"
      >
        {loadingMeta ? (
          <Loader2 className="w-9 h-9 mb-4 animate-spin" />
        ) : (
          <FileScan className="w-9 h-9 mb-4" />
        )}
        {loadingMeta ? intl.settings.scanning : intl.settings.scanMeta}
      </button>
    </div>
  );
}
