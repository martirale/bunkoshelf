"use client";

import { useState, useEffect, useRef } from "react";
import { ScanSearch, DatabaseBackup, Loader2 } from "lucide-react";
import { useToast } from "../ToastProvider";

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
        const taskText = currentTask || intl.toastScan.noTask;
        const toastContent = <p>{taskText}</p>;

        if (toastIdRef.current) {
          updateToast(toastIdRef.current, {
            title: intl.toastScan.progressTt,
            description: toastContent,
            variant: "default",
            manual: true,
            open: true,
          });
        } else {
          toastIdRef.current = addToast({
            title: intl.toastScan.progressTt,
            description: toastContent,
            variant: "default",
            manual: true,
            open: true,
          });
        }

        if (data.status === "done") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setLoadingFullScan(false);

          setTimeout(() => {
            if (toastIdRef.current) {
              updateToast(toastIdRef.current, {
                open: false,
              });
              toastIdRef.current = null;
            }

            addToast({
              title: intl.toastScan.successTt,
              description: intl.toastScan.successDesc,
              variant: "success",
              duration: 3000,
            });

            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }, 300);
        }
      } catch (error) {
        console.error("Error en polling de escaneo:", error);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setLoadingFullScan(false);

        if (toastIdRef.current) {
          updateToast(toastIdRef.current, {
            open: false,
          });
          toastIdRef.current = null;
        }

        addToast({
          title: intl.toastScan.errorTt,
          description: intl.toastScan.errorDesc,
          variant: "error",
          duration: 3000,
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
