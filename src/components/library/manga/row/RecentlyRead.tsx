import { BookCheckIcon } from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import MangaRowCarousel, { type VolEntry } from "./MangaRowCarousel";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { Locale, Dictionary } from "@/lib/types";

interface RecentlyReadProps {
  lang: Locale;
  intl: Dictionary;
  maxItems?: number;
}

export default async function RecentlyRead({ lang, intl, maxItems = 12 }: RecentlyReadProps) {
  const result = await getMangaVolumes();

  const entries: VolEntry[] = result?.success && result.data
    ? result.data
        .map((vol) => {
          const progress = vol.usersProgress?.[0] ?? null;
          return {
            slug: vol.slug,
            title: vol.title,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: getMangaCoverUrl(vol),
            meta: vol.metadataObj ?? null,
            isRead: progress?.isRead ?? false,
            lastReadAt: progress?.lastReadAt ? new Date(progress.lastReadAt) : null,
          };
        })
        .filter((vol) => vol.isRead && vol.lastReadAt)
        .sort((a, b) => b.lastReadAt!.getTime() - a.lastReadAt!.getTime())
        .slice(0, maxItems)
    : [];

  return (
    <MangaRowCarousel
      entries={entries}
      lang={lang}
      intl={intl}
      header={
        <h2 key="header" className="flex items-center text-base md:text-lg">
          <BookCheckIcon size={28} className="mr-2" />
          {intl.libraries.recentlyRead as string}
        </h2>
      }
    />
  );
}
