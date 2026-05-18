"use client";

import clsx from "clsx";
import { TrashIcon } from "lucide-react";
import { deleteSeries, deleteVolume } from "@/actions/delete";
import type { LibrarySection } from "@/lib/librarySection";
import type { Dictionary } from "@/lib/types";

interface DeleteMangaItemProps {
  intl: Dictionary;
  type?: "volume" | "series";
  slug: string;
  section?: LibrarySection;
}

export default function DeleteMangaItem({
  intl,
  type = "volume",
  slug,
  section = "manga",
}: DeleteMangaItemProps) {
  const t = intl;

  async function handleDelete() {
    let err: unknown = null;
    try {
      const confirmed = confirm(
        type === "volume"
          ? (t.libraries.deleteSure as Record<string, string>).volume
          : (t.libraries.deleteSure as Record<string, string>).series
      );
      if (!confirmed) return;

      const result =
        type === "volume"
          ? await deleteVolume({ slug })
          : await deleteSeries({ slug });

      if (!result || "error" in result || !("ok" in result) || !result.ok) {
        err = new Error(result && "error" in result ? result.error : "Delete failed");
      } else {
        const path =
          typeof window !== "undefined" ? window.location.pathname : "/";
        const parts = path.split("/").filter(Boolean);
        const lang = parts[0] || "en";
        const target =
          type === "volume"
            ? `/${lang}/${section}/volumes`
            : `/${lang}/${section}/series`;
        window.location.href = target;
      }
    } catch (e) {
      err = e;
    } finally {
      if (err) console.error(err);
    }
  }

  return (
    <button
      className={clsx(
        "text-danger-alt text-xs uppercase cursor-pointer hover:underline",
        "flex flex-row items-center gap-1"
      )}
      onClick={handleDelete}
    >
      <TrashIcon size={11} className="mb-0.5" />
      {type === "volume"
        ? (t.libraries.deleteItem as Record<string, string>).volume
        : (t.libraries.deleteItem as Record<string, string>).series}
    </button>
  );
}
