"use client";

import { useState } from "react";
import clsx from "clsx";
import { ScanSearchIcon, Loader2Icon } from "lucide-react";
import { scanSeries, scanVolume } from "@/actions/scan-series";
import { useToast } from "@/components/ToastProvider";
import type { Dictionary } from "@/lib/types";

interface ScanSeriesButtonProps {
  seriesId?: string;
  volumeId?: string;
  intl: Dictionary;
}

export default function ScanSeriesButton({ seriesId, volumeId, intl }: ScanSeriesButtonProps) {
  const t = intl;

  const [isScanning, setIsScanning] = useState(false);
  const { addToast } = useToast()!;

  const isVolume = !!volumeId;

  const handleScan = async () => {
    setIsScanning(true);

    try {
      const result = isVolume
        ? await scanVolume(volumeId!)
        : await scanSeries(seriesId!);

      if (!result || "error" in result) {
        addToast({
          title: "Error",
          description: result && "error" in result ? result.error : "Scan failed",
          variant: "error",
        });
        return;
      }

      addToast({
        title: (intl?.manga?.scanComplete as string) || "Escaneo completado",
        description: `${result.coversUpdated} portada(s), ${result.metaUpdated} metadatos`,
        variant: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      addToast({
        title: "Error",
        description: isVolume
          ? "Error al escanear el volumen"
          : "Error al escanear la serie",
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
      {isScanning
        ? (t.manga.scanning as string)
        : isVolume
          ? (t.manga.scanVolume as string)
          : (t.manga.scanSeries as string)}
    </button>
  );
}
