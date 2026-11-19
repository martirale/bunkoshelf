import { classifyBookSubjects, type BookVolume } from "@/lib/db/books/library";
import BookMetadataFields from "./BookMetadataFields";
import type { Dictionary, Locale } from "@/lib/types";
import type { BookSeriesMetadata } from "@/lib/books/seriesMetadata";

export default async function BookMetadataPanel({ volume, lang, intl, seriesMetadata }: {
  volume: BookVolume;
  lang: Locale;
  intl: Dictionary;
  seriesMetadata?: BookSeriesMetadata;
}) {
  const metadata = seriesMetadata ?? volume.metadata;
  const subjectFilters = await classifyBookSubjects(metadata.subjects.map((subject) => subject.name));
  return <BookMetadataFields metadata={volume.metadata} lang={lang} intl={intl} seriesMetadata={seriesMetadata} subjectFilters={subjectFilters} />;
}
