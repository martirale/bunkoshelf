import Link from "next/link";
import { CheckIcon } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { getCatalogLibraryFilterHref } from "@/lib/catalogFilters";
import type { CatalogRelationStats, PaginatedResult } from "@/lib/db/library";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogRelationsTableProps {
  data: PaginatedResult<CatalogRelationStats>;
  intl: Dictionary;
  nameLabel: string;
  lang: Locale;
  filter: "genre" | "tag";
}

export default function CatalogRelationsTable({
  data,
  intl,
  nameLabel,
  lang,
  filter,
}: CatalogRelationsTableProps) {
  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-auto border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="font-bold uppercase bg-onix">
                <th className="p-4 text-left rounded-l-md">{nameLabel}</th>
                <th className="p-4 text-center">{intl.catalog.mangaColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.comicColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.booksColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.othersColumn as string}</th>
                <th className="p-4 text-center rounded-r-md">{intl.catalog.totalColumn as string}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.name}>
                  <td className="p-4">
                    <div className="max-w-[18rem] whitespace-normal break-words leading-snug capitalize">
                      {item.name}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasManga ? <Link
                        href={getCatalogLibraryFilterHref(lang, "manga", filter, item.name)}
                        aria-label={`${nameLabel}: ${item.name} — ${intl.catalog.mangaColumn}`}
                        className="inline-flex items-center justify-center p-1 hover:text-lilah transition-colors"
                      ><CheckIcon size={18} /></Link> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasComic ? <Link
                        href={getCatalogLibraryFilterHref(lang, "comic", filter, item.name)}
                        aria-label={`${nameLabel}: ${item.name} — ${intl.catalog.comicColumn}`}
                        className="inline-flex items-center justify-center p-1 hover:text-lilah transition-colors"
                      ><CheckIcon size={18} /></Link> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasBooks ? <Link
                        href={getCatalogLibraryFilterHref(lang, "books", filter, item.name)}
                        aria-label={`${nameLabel}: ${item.name} — ${intl.catalog.booksColumn}`}
                        className="inline-flex items-center justify-center p-1 hover:text-lilah transition-colors"
                      ><CheckIcon size={18} /></Link> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      {item.hasOthers ? <Link
                        href={getCatalogLibraryFilterHref(lang, "others", filter, item.name)}
                        aria-label={`${nameLabel}: ${item.name} — ${intl.catalog.othersColumn}`}
                        className="inline-flex items-center justify-center p-1 hover:text-lilah transition-colors"
                      ><CheckIcon size={18} /></Link> : null}
                    </div>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">{item.total}</td>
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
