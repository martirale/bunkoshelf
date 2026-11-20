import Link from "next/link";
import { CheckIcon, HeartIcon } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import CatalogConversionAction from "@/components/catalog/CatalogConversionAction";
import CatalogLibraryActions from "@/components/catalog/CatalogLibraryActions";
import CatalogLibraryBadge from "@/components/catalog/CatalogLibraryBadge";
import { getLibrarySeriesHref, getLibraryVolumeHref } from "@/lib/librarySection";
import { ageRatingMap, normalizeCommaSeparatedText } from "@/lib/utils";
import type { CatalogLibraryVolume, PaginatedResult } from "@/lib/db/library";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogLibraryTableProps {
  data: PaginatedResult<CatalogLibraryVolume>;
  intl: Dictionary;
  canManage: boolean;
  conversion?: boolean;
  lang: Locale;
}

function renderValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function renderBadge(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return (
    <span className="bg-neutral-700 px-2 rounded-full text-xs uppercase">
      {value}
    </span>
  );
}

function renderAgeRating(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const mapped = ageRatingMap(value);
  return mapped !== null ? `${mapped}+` : value;
}

function renderWriter(value: string | null | undefined) {
  return normalizeCommaSeparatedText(value) ?? "—";
}

function getCatalogVolumeHref(
  lang: Locale,
  section: CatalogLibraryVolume["section"],
  slug: string
) {
  if (section === "books") {
    return `/${lang}/books/volume/${slug}`;
  }

  return getLibraryVolumeHref(lang, section, slug);
}

function getCatalogSeriesHref(
  lang: Locale,
  section: CatalogLibraryVolume["section"],
  slug: string
) {
  if (section === "books") {
    return `/${lang}/books/${slug}`;
  }

  return getLibrarySeriesHref(lang, section, slug);
}

export default function CatalogLibraryTable({
  data,
  intl,
  canManage,
  conversion = false,
  lang,
}: CatalogLibraryTableProps) {
  const conversionLabels = intl.catalog.conversionMessages as Record<string, string>;
  const libraryLabels: Record<CatalogLibraryVolume["section"], string> = {
    manga: intl.catalog.mangaColumn as string,
    comic: intl.catalog.comicWork as string,
    books: intl.catalog.bookWork as string,
    others: intl.catalog.othersColumn as string,
  };
  const columnCount = (conversion ? 10 : 11) + Number(canManage);

  return (
    <>
      <div className="bg-blackamber p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full table-auto border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="font-bold uppercase bg-onix">
                <th className="p-4 text-center rounded-l-md">{intl.catalog.statusColumn as string}</th>
                <th className="p-4 text-left">{intl.catalog.titleColumn as string}</th>
                {!conversion && (
                  <>
                    <th className="p-4 text-left">{intl.catalog.seriesColumn as string}</th>
                    <th className="p-4 text-center">{intl.catalog.libraryColumn as string}</th>
                  </>
                )}
                <th className="p-4 text-center">#</th>
                <th className="p-4 text-center">{intl.catalog.yearColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.writerColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.publisherColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.languageColumn as string}</th>
                <th className="p-4 text-center">{intl.catalog.ageRatingColumn as string}</th>
                <th className="p-4 text-center">
                  {intl.catalog.gtinColumn as string}
                </th>
                {conversion && (
                  <th className={`p-4 text-center ${canManage ? "" : "rounded-r-md"}`}>
                    {conversionLabels.type}
                  </th>
                )}
                {canManage && (
                  <th className="p-4 text-center rounded-r-md">
                    {intl.catalog.actionsColumn as string}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="p-4 text-center">
                    {intl.search.noResults as string}
                  </td>
                </tr>
              )}
              {data.items.map((volume) => {
                const showSeriesTitle = conversion && volume.isOneshot === false;
                const title = showSeriesTitle ? volume.series : volume.title;
                const titleHref = showSeriesTitle
                  ? getCatalogSeriesHref(lang, volume.section, volume.seriesSlug)
                  : getCatalogVolumeHref(lang, volume.section, volume.slug);

                return (
                  <tr key={volume.id}>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {volume.isRead ? <CheckIcon size={18} /> : null}
                        {volume.isFavorite ? <HeartIcon size={18} /> : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-[20rem] whitespace-normal break-words leading-snug">
                        <Link
                          href={titleHref}
                          className="hover:underline"
                        >
                          {renderValue(title)}
                        </Link>
                      </div>
                    </td>
                    {!conversion && (
                      <>
                        <td className="p-4">
                          <div className="max-w-[18rem] whitespace-normal break-words leading-snug">
                            {volume.series ? (
                              <Link
                                href={getCatalogSeriesHref(lang, volume.section, volume.seriesSlug)}
                                className="hover:underline"
                              >
                                {volume.series}
                              </Link>
                            ) : renderValue(volume.series)}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center">
                            <CatalogLibraryBadge section={volume.section} label={libraryLabels[volume.section]} />
                          </div>
                        </td>
                      </>
                    )}
                    <td className="p-4 text-center whitespace-nowrap">{renderValue(volume.number)}</td>
                    <td className="p-4 text-center whitespace-nowrap">{renderValue(volume.year)}</td>
                    <td className="p-4 text-center">
                      <div className="max-w-[14rem] whitespace-normal break-words leading-snug">
                        {renderWriter(volume.writer)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="max-w-[14rem] whitespace-normal break-words leading-snug">
                        {renderValue(volume.publisher)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        {renderBadge(volume.languageISO)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="max-w-[10rem] whitespace-normal break-words leading-snug">
                        {renderAgeRating(volume.ageRating)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="max-w-[11rem] whitespace-normal break-words leading-snug">
                        {renderValue(volume.gtin)}
                      </div>
                    </td>
                    {conversion && (
                      <td className="p-4 text-center">
                        {renderBadge(volume.isOneshot ? conversionLabels.oneshot : intl.catalog.seriesColumn as string)}
                      </td>
                    )}
                    {canManage && (
                      <td className="p-4 text-center">
                        {conversion ? (
                          volume.seriesPath && typeof volume.isOneshot === "boolean" && (
                            <CatalogConversionAction
                              intl={intl}
                              volumeId={volume.id}
                              section={volume.section}
                              source={volume.seriesPath}
                              isOneshot={volume.isOneshot}
                            />
                          )
                        ) : (
                          <CatalogLibraryActions
                            intl={intl}
                            volumeId={volume.id}
                            volumeSlug={volume.slug}
                            section={volume.section}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
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
