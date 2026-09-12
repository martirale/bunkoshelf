"use client";

import { useState } from "react";
import { DownloadIcon, Loader2Icon, ScanSearchIcon, TrashIcon } from "lucide-react";
import { deleteBookSeries, deleteBookVolume, rescanBookSeries, rescanBookVolume } from "@/actions/books-admin";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import { useToast } from "@/components/ToastProvider";
import type { Dictionary, Locale } from "@/lib/types";

interface BookAdminActionsProps {
  type: "volume" | "series";
  slug: string;
  lang: Locale;
  intl: Dictionary;
  canDownload: boolean;
}

export default function BookAdminActions({ type, slug, lang, intl, canDownload }: BookAdminActionsProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { addToast } = useToast()!;
  const { confirm } = useAlertDialog()!;
  const books = intl.books as Record<string, string>;
  const labels = intl.libraries.bookActions as Record<string, string>;
  const isVolume = type === "volume";
  const itemLabel = isVolume ? labels.deleteBook : labels.deleteSeries;

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = type === "volume" ? await rescanBookVolume(slug) : await rescanBookSeries(slug);
      if (!result.ok) {
        addToast({ title: books.error, description: books.actionFailed, variant: "error" });
        return;
      }
      addToast({
        title: books.scanComplete,
        description: `${result.indexed ?? 0} ${type === "volume" ? books.bookIndexed : books.booksIndexed}`,
        variant: "success",
      });
      window.setTimeout(() => window.location.reload(), 1200);
    } catch {
      addToast({
        title: books.error,
        description: isVolume ? books.rescanBookFailed : books.rescanSeriesFailed,
        variant: "error",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: itemLabel,
      description: isVolume ? labels.deleteBookSure : labels.deleteSeriesSure,
      destructive: true,
      irreversible: true,
    });
    if (!confirmed) return;
    const result = type === "volume" ? await deleteBookVolume(slug) : await deleteBookSeries(slug);
    if (!result.ok) {
      addToast({ title: books.error, description: books.actionFailed, variant: "error" });
      return;
    }
    window.location.assign(`/${lang}/books/${type === "volume" ? "volumes" : "series"}`);
  };

  const downloadHref = type === "volume"
    ? `/api/library/books/download/${encodeURIComponent(slug)}`
    : `/api/library/books/download/series/${encodeURIComponent(slug)}`;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button onClick={handleScan} disabled={isScanning} className="flex cursor-pointer items-center gap-1 text-xs uppercase hover:underline disabled:cursor-not-allowed disabled:opacity-50">
        {isScanning ? <Loader2Icon size={12} className="animate-spin" /> : <ScanSearchIcon size={12} />}
        {isScanning ? books.scanning : isVolume ? labels.scanBook : labels.scanSeries}
      </button>
      {canDownload && <a href={downloadHref} className="flex cursor-pointer items-center gap-1 text-xs uppercase hover:underline"><DownloadIcon size={11} />{isVolume ? labels.downloadBook : labels.downloadSeries}</a>}
      <button onClick={handleDelete} className="flex cursor-pointer items-center gap-1 text-xs uppercase text-danger-alt hover:underline"><TrashIcon size={11} />{itemLabel}</button>
    </div>
  );
}
