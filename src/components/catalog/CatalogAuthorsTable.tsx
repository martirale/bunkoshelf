import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import { normalizeCommaSeparatedText } from "@/lib/utils";
import type { CatalogAuthorStats, PaginatedResult } from "@/lib/db/library";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogAuthorsTableProps {
  data: PaginatedResult<CatalogAuthorStats>;
  intl: Dictionary;
  lang: Locale;
}

function renderValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function renderAvgRating(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return Number(value).toFixed(1);
}

function renderAuthorName(
  value: string | null | undefined,
  unknownAuthorLabel: string
) {
  return normalizeCommaSeparatedText(value) ?? unknownAuthorLabel;
}

function renderLibraries(
  lang: Locale,
  author: string | null,
  hasManga: boolean,
  hasOthers: boolean,
  hasBooks: boolean
) {
  const authorParam = author?.trim() ? author.trim() : "__unknown__";

  function buildHref(section: "manga" | "others") {
    const params = new URLSearchParams({ author: authorParam });
    return `/${lang}/${section}/volumes?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {hasManga && (
        <Link
          href={buildHref("manga")}
          className="bg-pearl text-onix px-2 rounded-full text-xs uppercase transition-opacity hover:opacity-80"
        >
          Manga
        </Link>
      )}
      {hasOthers && (
        <Link
          href={buildHref("others")}
          className="bg-neutral-700 px-2 rounded-full text-xs uppercase transition-opacity hover:opacity-80"
        >
          Cómic
        </Link>
      )}
      {hasBooks && (
        <span className="border border-pearl px-2 rounded-full text-xs uppercase">
          Libros
        </span>
      )}
    </div>
  );
}

export default function CatalogAuthorsTable({
  data,
  intl,
  lang,
}: CatalogAuthorsTableProps) {
  const unknownAuthorLabel =
    (intl.catalog.unknownAuthor as string | undefined) || "Unknown";

  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-auto border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="font-bold uppercase bg-onix">
                <th className="p-4 text-left rounded-l-md">
                  {intl.catalog.authorColumn as string}
                </th>
                <th className="p-4 text-center">
                  {intl.catalog.worksColumn as string}
                </th>
                <th className="p-4 text-center">
                  {intl.catalog.avgRatingColumn as string}
                </th>
                <th className="p-4 text-center">
                  {intl.catalog.libraryColumn as string}
                </th>
                <th className="p-4 text-center rounded-r-md">
                  {intl.catalog.progressColumn as string}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((author, index) => (
                <tr key={`${author.author ?? "unknown"}-${index}`}>
                  <td className="p-4">
                    <div className="max-w-[18rem] whitespace-normal break-words leading-snug">
                      {renderAuthorName(author.author, unknownAuthorLabel)}
                    </div>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    {renderValue(author.works)}
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    {renderAvgRating(author.avgRating)}
                  </td>
                  <td className="p-4 text-center">
                    {renderLibraries(
                      lang,
                      author.author,
                      author.hasManga,
                      author.hasOthers,
                      author.hasBooks
                    )}
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    {author.readCount}/{author.works}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.total > data.pageSize && (
        <div className="mt-8">
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            intl={intl}
          />
        </div>
      )}
    </>
  );
}
