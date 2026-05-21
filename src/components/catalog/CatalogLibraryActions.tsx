"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2Icon, ScanSearchIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { scanVolume } from "@/actions/scan-series";
import { deleteVolume } from "@/actions/delete";
import type { Dictionary } from "@/lib/types";

interface CatalogLibraryActionsProps {
  intl: Dictionary;
  volumeId: string;
  volumeSlug: string;
}

export default function CatalogLibraryActions({
  intl,
  volumeId,
  volumeSlug,
}: CatalogLibraryActionsProps) {
  const router = useRouter();
  const { addToast } = useToast()!;
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);

    try {
      const result = await scanVolume(volumeId);

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

      router.refresh();
    } catch {
      addToast({
        title: "Error",
        description: "Error al escanear el volumen",
        variant: "error",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      (intl.libraries.deleteSure as Record<string, string>).volume
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteVolume({ slug: volumeSlug });

      if (!result || "error" in result || !("ok" in result) || !result.ok) {
        addToast({
          title: "Error",
          description:
            result && "error" in result ? result.error : "Delete failed",
          variant: "error",
        });
        return;
      }

      addToast({
        title: "OK",
        description: (intl.libraries.deleteItem as Record<string, string>).volume,
        variant: "success",
      });

      router.refresh();
    } catch {
      addToast({
        title: "Error",
        description: "Error deleting volume",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={handleScan}
        disabled={isScanning || isDeleting}
        title={intl.manga.scanVolume as string}
        className={clsx(
          "border border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isScanning ? (
          <Loader2Icon size={16} className="animate-spin" />
        ) : (
          <ScanSearchIcon size={16} />
        )}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isScanning || isDeleting}
        title={(intl.libraries.deleteItem as Record<string, string>).volume}
        className={clsx(
          "border border-neutral-800 hover:text-danger-alt rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-danger-alt",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isDeleting ? (
          <Loader2Icon size={16} className="animate-spin" />
        ) : (
          <TrashIcon size={16} />
        )}
      </button>
    </div>
  );
}
