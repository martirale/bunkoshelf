"use client";

import React from "react";
import clsx from "clsx";
import { TrashIcon } from "lucide-react";

export default function DeleteMangaItem({ type = "volume", slug }) {
  async function handleDelete() {
    let err = null;
    try {
      const confirmed = confirm(
        type === "volume"
          ? "¿Seguro que deseas eliminar este tomo?"
          : "¿Seguro que deseas eliminar esta serie?"
      );
      if (!confirmed) return;

      const endpoint =
        type === "volume"
          ? `/api/library/manga/delete/volume/${slug}`
          : `/api/library/manga/delete/series/${slug}`;
      const res = await fetch(endpoint, { method: "DELETE" }).catch((e) => {
        err = e;
        return null;
      });
      if (res && !res.ok) {
        const text = await res.text().catch(() => res.statusText);
        err = new Error(text || res.statusText);
      }
      if (!err) {
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
    } finally {
      if (err) console.error(err);
    }
  }

  return (
    <button
      className={clsx(
        "text-danger-alt text-xs uppercase mt-2",
        "flex flex-row items-center gap-1"
      )}
      onClick={handleDelete}
    >
      <TrashIcon size={10} />
      {type === "volume" ? "Delete Volume" : "Delete Series"}
    </button>
  );
}
