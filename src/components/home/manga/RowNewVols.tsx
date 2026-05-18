import RowNewVolsCarousel, { type VolumeEntry } from "./RowNewVolsCarousel";
import type { DictionarySection, Locale } from "@/lib/types";

interface RowNewVolsProps {
  lang: Locale;
  intl: DictionarySection;
  entries: VolumeEntry[];
}

export default function RowNewVols({ lang, intl, entries }: RowNewVolsProps) {
  return <RowNewVolsCarousel entries={entries} lang={lang} intl={intl} />;
}
