"use client";

import { useEffect, useState } from "react";
import MangaCard from "./MangaCard";
import { usePathname } from "next/navigation";

export default function LibraryGrid({ intl }) {
  const [entries, setEntries] = useState([]);
  const pathname = usePathname();
  const lang = pathname.split("/")[1];

  useEffect(() => {
    async function fetchLibrary() {
      const res = await fetch("/api/library/manga");
      const data = await res.json();
      setEntries(data);
    }

    fetchLibrary();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {entries.map((entry) => {
        const isSeries = entry.volumes.length > 1 || entry.metadata;
        const isOneshot = !isSeries;
        const slug = entry.title.toLowerCase().replace(/\s+/g, "-");
        const href = isSeries
          ? `/${lang}/manga/${slug}`
          : `/${lang}/manga/volume/${slug}`;

        return (
          <MangaCard
            key={entry.title}
            title={entry.title}
            href={href}
            isSeries={isSeries}
            isOneshot={isOneshot}
            volumeCount={isSeries ? entry.volumes.length : null}
            cover={null}
            intl={intl}
          />
        );
      })}
    </div>
  );
}
