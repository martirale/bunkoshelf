"use client";

import { useState, useEffect, useRef } from "react";
import { ScanSearch, DatabaseBackup, Loader2 } from "lucide-react";
import { useToast } from "@/ui/toast/ToastProvider";

export default function LibSettingsButtons({ intl }) {
  const [loadingFullScan, setLoadingFullScan] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const { addToast, updateToast } = useToast();
  const pollingRef = useRef(null);
  const toastIdRef = useRef(null);

  const startPollingStatus = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/ScanManga/status");
        if (!res.ok) throw new Error("Error al obtener status del escaneo");
        const data = await res.json();
        setScanStatus(data);

        const { currentTask } = data;
        const taskText = currentTask || "Sin tarea activa";

        const toastContent = <p>{taskText}</p>;

        if (toastIdRef.current) {
          updateToast(toastIdRef.current, {
            title: "Progreso del escaneo",
            description: toastContent,
            variant: "default",
            duration: 4000,
          });
        } else {
          toastIdRef.current = addToast({
            title: "Progreso del escaneo",
            description: toastContent,
            variant: "default",
            duration: 4000,
          });
        }

        if (data.status === "done") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          toastIdRef.current = null;
          setLoadingFullScan(false);
          addToast({
            title: "Escaneo finalizado",
            description: "La biblioteca se ha escaneado correctamente.",
            variant: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        toastIdRef.current = null;
        setLoadingFullScan(false);
        addToast({
          title: "Error durante el escaneo",
          description: "Hubo un problema al obtener el estado del escaneo.",
          variant: "error",
        });
      }
    }, 3000);
  };

  const handleFullScan = async () => {
    setLoadingFullScan(true);
    setScanStatus(null);
    try {
      const res = await fetch("/api/admin/ScanManga/start", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Error al iniciar el escaneo");
      startPollingStatus();
    } catch (err) {
      setLoadingFullScan(false);
      addToast({
        title: intl.toastSettings.scanErrorTt,
        description: intl.toastSettings.scanError,
        variant: "error",
      });
    }
  };

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
        alert(
          intl.toastSettings.backupErrorAlert ||
            "Ocurrió un error al descargar la base de datos."
        );
      });
  };

  const isLoading = loadingFullScan;

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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
