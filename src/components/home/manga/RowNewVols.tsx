import { getMangaVolumes } from "@/actions/library";
import RowNewVolsCarousel, { type VolumeEntry } from "./RowNewVolsCarousel";
import type { DictionarySection, Locale } from "@/lib/types";

interface RowNewVolsProps {
  lang: Locale;
  intl: DictionarySection;
  maxItems?: number;
}

export default async function RowNewVols({ lang, intl, maxItems = 8 }: RowNewVolsProps) {
  const result = await getMangaVolumes();

  const entries: VolumeEntry[] = result?.success && result.data
    ? [...result.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((vol) => ({
          title: vol.title,
          slug: vol.slug,
          isOneshot: vol.series?.isOneshot === true,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
            : null,
          meta: vol.metadataObj ? { title: vol.metadataObj.title } : null,
        }))
    : [];

  return <RowNewVolsCarousel entries={entries} lang={lang} intl={intl} />;
}
