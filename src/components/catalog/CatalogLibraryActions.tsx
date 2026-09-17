"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2Icon, ScanSearchIcon, TrashIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import { scanVolume } from "@/actions/scan-series";
import { deleteVolume } from "@/actions/delete";
import { deleteBookVolume, rescanBookVolume } from "@/actions/books-admin";
import type { CatalogLibraryVolume } from "@/lib/db/library";
import type { Dictionary } from "@/lib/types";

interface CatalogLibraryActionsProps {
  intl: Dictionary;
  volumeId: string;
  volumeSlug: string;
  section: CatalogLibraryVolume["section"];
}

export default function CatalogLibraryActions({
  intl,
  volumeId,
  volumeSlug,
  section,
}: CatalogLibraryActionsProps) {
  const router = useRouter();
  const { addToast } = useToast()!;
  const { confirm } = useAlertDialog()!;
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBook = section === "books";
  const bookActions = intl.libraries.bookActions as Record<string, string>;

  const handleScan = async () => {
    setIsScanning(true);

    try {
      if (isBook) {
        const result = await rescanBookVolume(volumeSlug);

        if (!result.ok) {
          addToast({
            title: "Error",
            description: result.error,
            variant: "error",
          });
          return;
        }

        addToast({
          title: (intl.books as Record<string, string>).scanComplete,
          description: `${result.indexed ?? 0} ${(intl.books as Record<string, string>).bookIndexed}`,
          variant: "success",
        });
        router.refresh();
        return;
      }

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
        description: `${result.coversUpdated} portada(s), ${result.metaUpdated} metadatos${result.errors ? `, ${result.errors} error(es)` : ""}`,
        variant: result.errors ? "error" : "success",
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
    const confirmed = await confirm({
      title: isBook
        ? bookActions.deleteBook
        : (intl.libraries.deleteItem as Record<string, string>).volume,
      description: isBook
        ? bookActions.deleteBookSure
        : (intl.libraries.deleteSure as Record<string, string>).volume,
      destructive: true,
      irreversible: true,
    });

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      if (isBook) {
        const result = await deleteBookVolume(volumeSlug);

        if (!result.ok) {
          addToast({
            title: "Error",
            description: result.error,
            variant: "error",
          });
          return;
        }

        addToast({
          title: "OK",
          description: bookActions.deleteBook,
          variant: "success",
        });
        router.refresh();
        return;
      }

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
        title={isBook ? bookActions.scanBook : (intl.manga.scanVolume as string)}
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
        title={isBook
          ? bookActions.deleteBook
          : (intl.libraries.deleteItem as Record<string, string>).volume}
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
