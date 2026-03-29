import { BookMarkedIcon } from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import MangaRowCarousel, { type VolEntry } from "./MangaRowCarousel";
import type { Locale, Dictionary } from "@/lib/types";

interface NextVolProps {
  lang: Locale;
  intl: Dictionary;
  maxItems?: number;
}

export default async function NextVol({ lang, intl, maxItems = 12 }: NextVolProps) {
  const result = await getMangaVolumes();

  const entries: VolEntry[] = (() => {
    if (!result?.success || !result.data) return [];

    const data = result.data;
    type Vol = (typeof data)[number];

    const seriesMap = new Map<string, Vol[]>();
    for (const vol of data) {
      if (!seriesMap.has(vol.seriesId)) seriesMap.set(vol.seriesId, []);
      seriesMap.get(vol.seriesId)!.push(vol);
    }

    const nextVolumes: VolEntry[] = [];

    for (const volumes of seriesMap.values()) {
      const sorted = volumes
        .map((vol) => {
          const progress = vol.usersProgress?.[0] ?? null;
          return {
            ...vol,
            volumeNumber: Number(vol.metadataObj?.number) || 0,
            isRead: progress?.isRead ?? false,
            lastReadAt: progress?.lastReadAt ? new Date(progress.lastReadAt) : null,
          };
        })
        .sort((a, b) => a.volumeNumber - b.volumeNumber);

      const hasStarted = sorted.some((v) => v.isRead || v.lastReadAt);
      if (!hasStarted) continue;

      const nextUnread = sorted.find((v) => !v.isRead && !v.lastReadAt);
      if (nextUnread) {
        nextVolumes.push({
          slug: nextUnread.slug,
          title: nextUnread.title,
          isOneshot: nextUnread.series?.isOneshot === true,
          coverImage: nextUnread.coverImage
            ? `/api/library/manga/cover/${nextUnread.slug}/${nextUnread.coverImage}`
            : null,
          meta: nextUnread.metadataObj ?? null,
        });
      }
    }

    return nextVolumes.slice(0, maxItems);
  })();

  return (
    <MangaRowCarousel
      entries={entries}
      lang={lang}
      intl={intl}
      className="mt-4"
      header={
        <h2 key="header" className="flex items-center text-base md:text-lg">
          <BookMarkedIcon size={28} className="mr-2" />
          {intl.libraries.inProgress as string}
        </h2>
      }
    />
  );
}
