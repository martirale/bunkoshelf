import { BookPlusIcon } from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import MangaRowCarousel, { type VolEntry } from "./MangaRowCarousel";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { Locale, Dictionary } from "@/lib/types";

interface NewVolsProps {
  lang: Locale;
  intl: Dictionary;
  maxItems?: number;
}

export default async function NewVols({ lang, intl, maxItems = 12 }: NewVolsProps) {
  const result = await getMangaVolumes();

  const entries: VolEntry[] = result?.success && result.data
    ? [...result.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((vol) => ({
          slug: vol.slug,
          title: vol.title,
          isOneshot: vol.series?.isOneshot === true,
          coverImage: getMangaCoverUrl(vol),
          meta: vol.metadataObj ?? null,
        }))
    : [];

  return (
    <MangaRowCarousel
      entries={entries}
      lang={lang}
      intl={intl}
      header={
        <h2 key="header" className="flex items-center text-base md:text-lg">
          <BookPlusIcon size={28} className="mr-2" />
          {intl.libraries.recentlyAdded as string}
        </h2>
      }
    />
  );
}
