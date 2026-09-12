import { getBookAgeMinimum, normalizeBookAgeRating } from "@/lib/books/metadata";
import type { EpubMetadata } from "@/lib/books/types";
import type { Dictionary } from "@/lib/types";

export default function BookMetadataBadges({ metadata, intl }: { metadata: EpubMetadata; intl: Dictionary }) {
  const books = intl.books as Record<string, string>;
  const ageMinimum = getBookAgeMinimum(metadata.ageRating);
  const ageRating = normalizeBookAgeRating(metadata.ageRating);
  const ageClass = ageMinimum !== null && ageMinimum >= 18
    ? "bg-red-500"
    : ageMinimum !== null && ageMinimum >= 16
      ? "bg-[#f5a524] text-onix"
      : "bg-neutral-700";

  return (
    <div className="mt-8">
      {ageRating && (
        <span className={`mr-2 rounded-md px-3 py-1 text-sm uppercase ${ageClass}`}>
          {ageRating}
        </span>
      )}
      <span className="mr-2 rounded-md bg-neutral-700 px-3 py-1 text-sm uppercase">{metadata.language || "und"}</span>
      <span className="rounded-md bg-neutral-700 px-3 py-1 text-sm uppercase">{metadata.renditionLayout === "pre-paginated" ? books.fixedLayout : books.reflowableLayout}</span>
    </div>
  );
}
