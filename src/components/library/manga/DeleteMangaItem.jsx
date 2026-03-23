"use client";

import React from "react";
import clsx from "clsx";
import { TrashIcon } from "lucide-react";
import { deleteSeries, deleteVolume } from "@/actions/delete";

export default function DeleteMangaItem({ intl, type = "volume", slug }) {
  const t = intl;

  async function handleDelete() {
    let err = null;
    try {
      const confirmed = confirm(
        type === "volume"
          ? t.libraries.deleteSure.volume
          : t.libraries.deleteSure.series
      );
      if (!confirmed) return;

      const result =
        type === "volume"
          ? await deleteVolume({ slug })
          : await deleteSeries({ slug });

      if (result.error || !result.ok) {
        err = new Error(result.error || "Delete failed");
      } else {
        const path =
          typeof window !== "undefined" ? window.location.pathname : "/";
        const parts = path.split("/").filter(Boolean);
        const lang = parts[0] || "en";
        const target =
          type === "volume"
            ? `/${lang}/manga/volumes`
            : `/${lang}/manga/series`;
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
        ? t.libraries.deleteItem.volume
        : t.libraries.deleteItem.series}
    </button>
  );
}
