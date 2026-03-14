"use client";

import { useState } from "react";
import clsx from "clsx";
import { ScanSearchIcon, Loader2Icon } from "lucide-react";
import { scanSeries } from "@/actions/scan-series";
import { useToast } from "@/components/ToastProvider";

export default function ScanSeriesButton({ seriesId, intl }) {
  const t = intl;

  const [isScanning, setIsScanning] = useState(false);
  const { addToast } = useToast();

  const handleScan = async () => {
    setIsScanning(true);

    try {
      const result = await scanSeries(seriesId);

      if (result.error) {
        addToast({
          title: "Error",
          description: result.error,
          variant: "error",
        });
        return;
      }

      addToast({
        title: intl?.manga?.scanComplete || "Escaneo completado",
        description: `${result.coversUpdated} portada(s), ${result.metaUpdated} metadatos`,
        variant: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      addToast({
        title: "Error",
        description: "Error al escanear la serie",
        variant: "error",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <button
      onClick={handleScan}
      disabled={isScanning}
      className={clsx(
        "text-xs uppercase cursor-pointer hover:underline",
        "flex flex-row items-center gap-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      {isScanning ? (
        <Loader2Icon size={12} className="animate-spin" />
      ) : (
        <ScanSearchIcon size={12} />
      )}
      {isScanning ? t.manga.scanning : t.manga.scanSeries}
    </button>
  );
}
