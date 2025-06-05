"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { volumeProgress } from "@/lib/reader/volumeProgress";

export default function MangaCard({
  title,
  href,
  isSeries,
  isOneshot,
  volumeCount,
  cover,
  intl,
  isDragging,
  className,
}) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!href) return;

    const slug = href.split("/").pop();

    const fetchProgress = async () => {
      const data = await volumeProgress(slug);
      setProgress(data);
    };

    fetchProgress();
  }, [href]);

  const ratio = progress ? (progress.lastPage + 1) / progress.totalPages : 0;

  return (
    <Link
      href={href}
      className={clsx(
        "group flex flex-col overflow-hidden rounded-t-lg transition-all duration-300",
        isDragging ? "cursor-grabbing" : "cursor-pointer"
      )}
    >
      <div className="relative aspect-[7/10.5] w-full flex-shrink-0">
        {isOneshot && (
          <span className="absolute top-2 right-2 z-10 bg-lilah text-xs uppercase py-0.5 px-1 rounded">
            Oneshot
          </span>
        )}
        <Image
          src={cover || "/placeholder.svg?=v1"}
          alt={`Cover for ${title}`}
          fill
          className="object-cover z-0"
        />

        {progress && ratio > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blackamber/50">
            <div
              className="h-full bg-lilah transition-all"
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between p-3 h-24 rounded-b-lg border border-blackamber bg-onix group-hover:bg-blackamber">
        <h3
          className={clsx(
            "line-clamp-3 group-hover:text-lilah transition-all duration-300",
            className
          )}
        >
          {title}
        </h3>

        {isSeries && volumeCount != null && (
          <p className="mt-2 text-xs uppercase text-zinc-400">
            {volumeCount} {intl.manga.volumes}
          </p>
        )}
      </div>
    </Link>
  );
}
