"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookCheckIcon, BookCopyIcon, BookPlusIcon, BookmarkIcon, HeartIcon, LibraryBigIcon } from "lucide-react";
import BookHero from "@/components/library/books/BookHero";
import BookMetadataBadges from "@/components/library/books/BookMetadataBadges";
import BookMetadataFields from "@/components/library/books/BookMetadataFields";
import BookReaderButton from "@/components/library/books/BookReaderButton";
import BookVolumeRating from "@/components/library/books/BookVolumeRating";
import BookSummary from "@/components/library/books/BookSummary";
import BookSeriesDownload from "@/components/library/books/BookSeriesDownload";
import BookRowCarousel from "@/components/library/books/row/BookRowCarousel";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import DetailNavigation from "@/components/library/DetailNavigation";
import FavoritesNav from "@/components/favorites/FavoritesNav";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import Separator from "@/components/ui/Separator";
import SidebarMisc from "@/components/ui/SidebarMisc";
import { getBookPublicationYear, toPlainBookText } from "@/lib/books/metadata";
import { getBookProgressRatio } from "@/lib/books/readingProgress";
import { getReadyVolumes, isOfflineBook, offlinePageUrl, type OfflineBookVolume } from "@/lib/client/offlineLibrary";
import { getDetailNavigationLabels } from "@/lib/detailNavigation";
import { filterValues } from "@/lib/libraryFilters";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import type { Dictionary, Locale } from "@/lib/types";

interface OfflineBooksProps {
  path: string;
  lang: Locale;
  intl: Dictionary;
  userId: string;
}

function cover(book: OfflineBookVolume) {
  return book.coverUrl ? offlinePageUrl(book.userId, book.id, -1) : null;
}

function readingProgress(book: OfflineBookVolume) {
  return { isRead: book.isRead, progression: book.book.state.progress?.progression ?? null };
}

function recentReading(books: OfflineBookVolume[]) {
  return books.filter((book) => book.book.state.progress?.lastReadAt).sort((a, b) =>
    (b.book.state.progress?.lastReadAt ?? "").localeCompare(a.book.state.progress?.lastReadAt ?? ""),
  );
}

function volumeHref(lang: Locale, book: OfflineBookVolume) {
  return `/${lang}/books/volume/${book.slug}`;
}

function seriesHref(lang: Locale, book: OfflineBookVolume) {
  return `/${lang}/books/${book.seriesSlug}`;
}

function BookCards({ entries, lang, intl, series = false, favorites = false }: {
  entries: OfflineBookVolume[]; lang: Locale; intl: Dictionary; series?: boolean; favorites?: boolean;
}) {
  const groups = groupBooks(entries);
  const cards = series ? [...groups.values()].map(([book]) => book) : entries;
  return <div className={favorites ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7"}>
    {cards.map((book) => {
      const isSeries = series && !book.isOneshot;
      const group = groups.get(book.seriesId) ?? [book];
      const progress = isSeries
        ? group.filter((item) => item.isRead).length / group.length
        : getBookProgressRatio(readingProgress(book));
      return <MangaCard
        key={isSeries ? book.seriesId : book.id}
        title={isSeries ? book.seriesTitle : book.title}
        href={isSeries ? seriesHref(lang, book) : volumeHref(lang, book)}
        isSeries={isSeries}
        isOneshot={book.isOneshot}
        onGoing={isSeries && book.seriesStatus === "ONGOING"}
        onPause={isSeries && book.seriesStatus === "HIATUS"}
        volumeCount={isSeries ? group.length : null}
        countLabel={intl.books.books as string}
        cover={cover(book)}
        intl={intl}
        isDragging={false}
        progressRatio={progress}
        seriesSlug={isSeries ? book.seriesSlug : null}
        offlineVolumeId={book.id}
        offlineSeriesId={book.seriesId}
        className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
      />;
    })}
  </div>;
}

function groupBooks(books: OfflineBookVolume[]) {
  const groups = new Map<string, OfflineBookVolume[]>();
  for (const book of books) {
    const group = groups.get(book.seriesId);
    if (group) group.push(book);
    else groups.set(book.seriesId, [book]);
  }
  return groups;
}

function OfflineBookDetail({ entries, selected, lang, intl }: {
  entries: OfflineBookVolume[]; selected?: OfflineBookVolume; lang: Locale; intl: Dictionary;
}) {
  const ordered = entries.slice().sort((a, b) =>
    (a.book.seriesPosition ?? Infinity) - (b.book.seriesPosition ?? Infinity)
      || (a.book.number ?? Infinity) - (b.book.number ?? Infinity)
      || a.title.localeCompare(b.title, undefined, { numeric: true }),
  );
  const book = selected ?? ordered[0];
  const isSeries = !selected;
  const title = isSeries ? book.seriesTitle : book.title;
  const source = cover(book);
  const summary = toPlainBookText(book.metadata.description);
  const labels = intl.books as Record<string, string>;
  const navigation = getDetailNavigationLabels("books", intl);
  const index = ordered.findIndex((item) => item.id === book.id);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  return <div className="mb-24 p-4 md:mb-4">
    <section className="flex flex-col md:flex-row">
      <div className="w-full md:w-5/12 2xl:w-1/3">
        <div className="relative mb-8 px-16 md:sticky md:top-4 md:mb-0 md:mr-4 md:self-start md:px-0">
          {source
            ? <Image src={source} alt={`${labels.coverOf} ${title}`} width={0} height={0} sizes="100vw" unoptimized className="w-full rounded-lg object-contain" />
            : <div className="grid aspect-[7/10.5] place-items-center rounded-lg bg-sand p-6 text-center text-onix">{labels.noCover}</div>}
          <DetailNavigation
            allSeries={isSeries ? { href: `/${lang}/books/series`, label: navigation.allSeries } : undefined}
            allVolumes={!isSeries && book.isOneshot ? { href: `/${lang}/books/volumes`, label: navigation.allVolumes } : undefined}
            previous={!isSeries && previous ? { href: volumeHref(lang, previous), label: navigation.previous } : undefined}
            next={!isSeries && next ? { href: volumeHref(lang, next), label: navigation.next } : undefined}
          />
        </div>
      </div>
      <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
        <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{title}</h1>
        {!isSeries && book.metadata.subtitle && <p className="py-2 text-2xl">{book.metadata.subtitle}</p>}
        {!isSeries && !book.isOneshot && <div className="py-2"><Link href={seriesHref(lang, book)} className="text-2xl hover:underline">{labels.series} {book.seriesTitle}</Link></div>}
        {isSeries
          ? <div className="mt-4"><BookSeriesDownload seriesId={book.seriesId} slug={book.seriesSlug} volumeIds={ordered.map((item) => item.id)} intl={intl} /></div>
          : <BookReaderButton key={book.id} volumeId={book.id} slug={book.slug} title={book.title} layout={book.metadata.renditionLayout} intl={intl} offlineBook={book} />}
        {!isSeries && <div className="mt-8"><BookVolumeRating volumeId={book.id} initialPersonalRating={book.personalRating ?? null} intl={intl} /></div>}
        <BookMetadataBadges metadata={book.metadata} intl={intl} />
        <p className="mt-4">
          {getBookPublicationYear(book.metadata.publishedAt ?? book.metadata.modifiedAt)}
          {isSeries && <> &bull; {ordered.length} {labels.books}</>}
          {!isSeries && book.book.number !== null && <> &bull; {labels.book} {book.book.number}</>}
        </p>
        {summary && <><h2 className="mb-1 mt-8 text-sm">{labels.synopsis}</h2><BookSummary summary={summary} intl={intl} /></>}
        <Separator />
        <BookMetadataFields metadata={book.metadata} lang={lang} intl={intl} />
      </div>
    </section>
    {isSeries && <section><Separator /><h2 className="mb-4">{labels.seriesBooks}</h2><BookCards entries={ordered} lang={lang} intl={intl} /></section>}
  </div>;
}

function filterBooks(books: OfflineBookVolume[], params: URLSearchParams) {
  const publishers = filterValues(params.getAll("publisher"));
  const authors = params.get("author")?.split(",").filter(Boolean) ?? [];
  const genres = params.get("genre")?.split(",").filter(Boolean) ?? [];
  const tags = params.get("tag")?.split(",").filter(Boolean) ?? [];
  return books.filter((book) => {
    const names = book.metadata.people.filter((person) => person.kind === "creator" && (!person.role || person.role.toLowerCase() === "aut")).map((person) => person.name);
    const matchesAuthors = !authors.length || authors.some((author) => names.includes(author) || (author === "__unknown__" && !names.length));
    return matchesAuthors
      && (!publishers.length || publishers.includes(book.metadata.publisher?.trim() ?? ""))
      && genres.every((genre) => Array.isArray(book.metadata.genres) && book.metadata.genres.includes(genre))
      && tags.every((tag) => Array.isArray(book.metadata.tags) && book.metadata.tags.includes(tag));
  });
}

export default function OfflineBooks({ path, lang, intl, userId }: OfflineBooksProps) {
  const [books, setBooks] = useState<OfflineBookVolume[] | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => void getReadyVolumes(userId, "books").then((volumes) => {
      if (active) setBooks(volumes.filter(isOfflineBook));
    }).catch(() => { if (active) setBooks([]); });
    load();
    window.addEventListener("bunko:offline-change", load);
    return () => { active = false; window.removeEventListener("bunko:offline-change", load); };
  }, [userId]);

  if (!books) return null;
  const [pathname, search] = path.split("?");
  const params = new URLSearchParams(search);
  const segments = pathname.split("/").filter(Boolean);
  const favorites = segments[1] === "favorites";
  const view = segments[favorites ? 3 : 2];
  if (view === "volume" || (!favorites && view && !["series", "volumes", "toread"].includes(view))) {
    const selected = view === "volume" ? books.find((book) => book.slug === segments[3]) : undefined;
    const slug = selected?.seriesSlug ?? view;
    const entries = books.filter((book) => book.seriesSlug === slug);
    if ((view !== "volume" || selected) && entries.length) return <OfflineBookDetail entries={entries} selected={selected} lang={lang} intl={intl} />;
    return <p className="p-4 text-center">{intl.offline.unavailable as string}</p>;
  }

  const groups = groupBooks(books);
  const reading = recentReading(books);
  const stats = {
    totalVolumes: books.length,
    totalSeries: [...groups.values()].filter(([book]) => !book.isOneshot).length,
    totalUnread: books.filter((book) => !book.isRead).length,
  };
  const hero = <BookHero lang={lang} intl={intl} offline={{
    stats,
    entries: reading.filter((book) => !book.isRead && book.book.state.progress?.cfi).slice(0, 12).map((book) => ({
      id: book.id, slug: book.slug, title: book.title, coverImage: cover(book), progression: getBookProgressRatio(readingProgress(book)),
    })),
  }} />;
  const empty = <p className="p-4 text-center">{intl.books.noOfflineBooks as string}</p>;
  if (!view && !favorites) {
    const downloads = books.slice().sort((a, b) => (b.downloadedAt ?? "").localeCompare(a.downloadedAt ?? "")).slice(0, 12);
    const completed = reading.filter((book) => book.isRead).slice(0, 12);
    const progressById = Object.fromEntries(books.map((book) => [book.id, readingProgress(book)]));
    const coverById = Object.fromEntries(books.map((book) => [book.id, cover(book)]));
    return <>{hero}{!books.length ? empty : <div className="library-overview mb-24 p-4 md:mb-4">
      <div className="library-overview-section"><BookRowCarousel books={downloads.map((book) => ({ ...book, series: book }))} lang={lang} intl={intl} coverById={coverById} progressById={progressById} header={<h2 className="flex items-center text-base md:text-lg"><BookPlusIcon size={28} className="mr-2" />{intl.libraries.recentlyAdded as string}</h2>} /></div>
      {completed.length > 0 && <div className="library-overview-section"><BookRowCarousel books={completed.map((book) => ({ ...book, series: book }))} lang={lang} intl={intl} coverById={coverById} progressById={progressById} header={<h2 className="flex items-center text-base md:text-lg"><BookCheckIcon size={28} className="mr-2" />{intl.libraries.recentlyRead as string}</h2>} /></div>}
    </div>}</>;
  }

  const series = view === "series" || (favorites && view !== "volumes");
  const unread = view === "toread";
  const eligible = favorites
    ? books.filter((book) => series ? !book.isOneshot && book.book.seriesFavorite : book.isFavorite)
    : filterBooks(books, params).filter((book) => (!unread || !book.isRead) && (!series || !book.isOneshot || params.get("includeOneshots") === "true"));
  const groupsToPage = series ? [...groupBooks(eligible).values()] : eligible.map((book) => [book]);
  const totalPages = Math.ceil(groupsToPage.length / LIBRARY_PAGE_SIZE);
  const page = Math.min(Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1), Math.max(1, totalPages));
  const entries = groupsToPage.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE).flat();
  const title = favorites
    ? series ? intl.favorites.headingBooksSeries : intl.favorites.headingBooksVolumes
    : series ? intl.libraries.series : unread ? intl.libraries.toRead : intl.libraries.books;
  const Icon = series ? LibraryBigIcon : unread ? BookmarkIcon : BookCopyIcon;
  const content = <section className="mb-24 p-4 md:mb-4">
    <div className="mb-4 flex items-center gap-4">
      <h2 className="flex items-center text-base md:text-lg"><Icon size={28} className="mr-2" />{title as string}</h2>
      {!favorites && <FiltersDrawer intl={intl} library="books" offlineVolumes={books} />}
    </div>
    {entries.length
      ? <BookCards entries={entries} lang={lang} intl={intl} series={series} favorites={favorites} />
      : books.length ? <p className="p-4 text-center">{intl.search.noResults as string}</p> : empty}
    {totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} intl={intl} /></div>}
  </section>;
  if (!favorites) return <>{hero}{content}</>;

  return <div className="flex flex-col overflow-hidden md:h-screen md:flex-row">
    <SidebarMisc><h2 className="flex items-center text-onix"><HeartIcon size={28} className="mr-2" />{intl.favorites.title as string}</h2><FavoritesNav intl={intl} /></SidebarMisc>
    <div className="w-full overflow-y-auto md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%]">{content}</div>
  </div>;
}
