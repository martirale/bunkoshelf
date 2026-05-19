import { BookPlusIcon } from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import MangaRowCarousel, { type VolEntry } from "./MangaRowCarousel";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { LibraryScope, LibrarySection } from "@/lib/librarySection";
import { getVolumeProgressRatio } from "@/lib/reader/readingProgress";
import type { Locale, Dictionary } from "@/lib/types";

interface NewVolsProps {
  lang: Locale;
  intl: Dictionary;
  maxItems?: number;
  scope?: LibraryScope;
  section?: LibrarySection;
}

export default async function NewVols({
  lang,
  intl,
  maxItems = 12,
  scope = "all",
  section = "manga",
}: NewVolsProps) {
  const result = await getMangaVolumes({ scope });

  const entries: VolEntry[] = result?.success && result.data
    ? [...result.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((vol) => {
          const progress = vol.usersProgress?.[0] ?? null;

          return {
            slug: vol.slug,
            title: vol.title,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: getMangaCoverUrl(vol),
            section,
            meta: vol.metadataObj ?? null,
            progressRatio: getVolumeProgressRatio(progress),
          };
        })
    : [];

  return (
    <MangaRowCarousel
      entries={entries}
      lang={lang}
      intl={intl}
      section={section}
      header={
        <h2 key="header" className="flex items-center text-base md:text-lg">
          <BookPlusIcon size={28} className="mr-2" />
          {intl.libraries.recentlyAdded as string}
        </h2>
      }
    />
  );
}
