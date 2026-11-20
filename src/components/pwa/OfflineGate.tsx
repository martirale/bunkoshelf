"use client";

import OfflineBooks from "@/components/pwa/OfflineBooks";
import { getBookProgressRatio } from "@/lib/books/readingProgress";
import { getComicOriginalTitle, getComicSeriesTitle, getComicTitle } from "@/lib/comicTitles";
import { filterValues } from "@/lib/libraryFilters";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookAIcon, BookCheckIcon, BookCopyIcon, BookMarkedIcon, BookmarkIcon, BookPlusIcon, CloudOffIcon, GhostIcon, HeartIcon, LibraryBigIcon, Settings2Icon, UserRoundIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import HeroKeepRead from "@/components/library/manga/row/HeroKeepRead";
import SidebarMisc from "@/components/ui/SidebarMisc";
import FavoritesNav from "@/components/favorites/FavoritesNav";
import CatalogNav from "@/components/catalog/CatalogNav";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import SearchComp from "@/components/search/SearchComp";
import MangaRowCarousel, { type VolEntry } from "@/components/library/manga/row/MangaRowCarousel";
import DemographicsTiles from "@/components/library/manga/Demographics";
import HomeKeepRead from "@/components/home/manga/HeroKeepRead";
import RowNewVols from "@/components/home/manga/RowNewVols";
import type { VolumeEntry } from "@/components/home/manga/RowNewVolsCarousel";
import TileStreak from "@/components/stats/TileStreak";
import TileLastRead from "@/components/stats/TileLastRead";
import TileDaysRead from "@/components/stats/TileDaysRead";
import TileMonthRead from "@/components/stats/TileMonthRead";
import TileAllRead from "@/components/stats/TileAllRead";
import TileMonthTrend from "@/components/stats/TileMonthTrend";
import ProfileNav from "@/components/profile/ProfileNav";
import SettingsNav from "@/components/settings/SettingsNav";
import Pagination from "@/components/ui/Pagination";
import ReadButtonsVolume from "@/components/library/manga/ReadButtonsVolume";
import ReadButtonsSeries from "@/components/library/manga/ReadButtonsSeries";
import MetadataPanel from "@/components/library/manga/MetadataPanel";
import MangaSummary from "@/components/library/manga/MangaSummary";
import VolumeRating from "@/components/library/manga/VolumeRating";
import SeriesRating from "@/components/library/manga/SeriesRating";
import Separator from "@/components/ui/Separator";
import Tabs from "@/components/ui/Tabs";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import { getLibraryScope, getOneshotLabel, type LibrarySection } from "@/lib/librarySection";
import { getReadyVolumes, offlinePageUrl, type OfflineVolume } from "@/lib/client/offlineLibrary";
import { ageRatingMap } from "@/lib/mangaMetadata";
import type { Dictionary, Locale, Session } from "@/lib/types";
import { usePwa } from "./PwaProvider";

function OfflineUnavailable({ intl }: { intl: Dictionary }) {
  return <div className="flex flex-col items-center justify-center h-screen gap-4 p-4"><CloudOffIcon size={64} /><h2 className="font-roboto text-center">{(intl.offline?.unavailable as string) || "No disponible sin conexión"}</h2></div>;
}

function offlineCover(userId: string, volume: OfflineVolume) {
  return offlinePageUrl(userId, volume.id, -1);
}

function progressRatio(volume: OfflineVolume) {
  return volume.totalPages > 0 ? Math.min(1, (volume.lastPage + 1) / volume.totalPages) : 0;
}

function offlineVolumeTitle(volume: OfflineVolume) {
  return getComicTitle(volume.metadata) ?? volume.title;
}

function offlineSeriesTitle(volume: OfflineVolume) {
  // Older downloads may belong to a logical series without storing that flag.
  return volume.seriesIsLogical === false
    ? getComicSeriesTitle(volume.metadata) ?? volume.seriesTitle
    : volume.seriesTitle;
}

function relationItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? { name: item } : item).filter(Boolean);
}

function volumeMetadata(volume: OfflineVolume): Record<string, unknown> {
  return {
    ...volume.metadata,
    title: volume.metadata.title ?? volume.title,
    series: volume.metadata.series ?? volume.seriesTitle,
    mangaStyle: volume.mangaStyle,
    pageCount: volume.metadata.pageCount ?? volume.totalPages,
    genres: relationItems(volume.metadata.genres),
    tags: relationItems(volume.metadata.tags),
  };
}

function OfflineCover({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-auto object-contain rounded-lg" />
    </div>
  );
}

function MetadataBadges({ intl, meta }: { intl: Dictionary; meta: Record<string, unknown> }) {
  const ageMin = ageRatingMap(meta.ageRating as string);
  const ageBadgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-2 ${
    ageMin !== null && ageMin >= 18
      ? "bg-red-500"
      : ageMin !== null && ageMin >= 16
        ? "bg-[#f5a524] text-onix"
        : "bg-neutral-700"
  }`;
  const isWesternReading = meta.mangaStyle === "YesLTR" || meta.mangaStyle === "No";

  return (
    <div className="mt-2">
      {meta.ageRating ? <span className={ageBadgeClass}>{ageMin !== null ? `${ageMin}+` : meta.ageRating as string}</span> : null}
      {meta.languageISO ? <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1 mr-2">{meta.languageISO as string}</span> : null}
      <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">
        {isWesternReading ? intl.manga.readingEn as string : intl.manga.readingJp as string}
      </span>
    </div>
  );
}

type OfflineComicVolume = OfflineVolume & { section: LibrarySection };

function VolumeDetail({ volume, lang, intl, userId, user }: { volume: OfflineComicVolume; lang: Locale; intl: Dictionary; userId: string; user: Session | null }) {
  const meta = volumeMetadata(volume);
  const title = offlineVolumeTitle(volume);
  const seriesLabel = volume.section === "others" ? intl.libraries.otherCollection : intl.manga.series;

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <OfflineCover src={offlineCover(userId, volume)} alt={`Cover for ${title}`} />
        </div>
        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{title}</h1>
          {!volume.isOneshot && (
            <div className="py-2">
              <Link href={`/${lang}/${volume.section}/${volume.seriesSlug}`} className="text-2xl not-italic hover:underline">
                {seriesLabel as string} {offlineSeriesTitle(volume)}
              </Link>
            </div>
          )}
          <ReadButtonsVolume
            lang={lang}
            intl={intl}
            volumeId={volume.id}
            volumeTitle={title}
            coverSrc={offlineCover(userId, volume)}
            initFavorite={volume.isFavorite}
            initRead={volume.isRead}
            slug={volume.slug}
            mangaStyle={volume.mangaStyle ?? ""}
            communityRating={typeof meta.communityRating === "number" ? meta.communityRating : null}
            initialPersonalRating={volume.personalRating ?? null}
            section={volume.section}
            userId={user?.id}
          />
          <div className="mt-8">
            <VolumeRating volumeId={volume.id} communityRating={typeof meta.communityRating === "number" ? meta.communityRating : null} initialPersonalRating={volume.personalRating ?? null} />
          </div>
          <MetadataBadges intl={intl} meta={meta} />
          <p className="mt-4 flex items-center gap-2">
            {meta.year ? meta.year as number : null}
            {meta.pageCount ? <>&bull; {meta.pageCount as number} {intl.manga.pages as string}</> : null}
            {volume.isOneshot && <span className="text-xs uppercase bg-lilah border border-lilah rounded px-1.5">{getOneshotLabel(volume.section, intl.manga)}</span>}
          </p>
          {meta.summary ? <><h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis as string}</h2><MangaSummary meta={meta} intl={intl} /></> : null}
          <Tabs tabs={[{ label: intl.manga.details as string, content: <MetadataPanel meta={meta} originalTitle={getComicOriginalTitle(meta)} lang={lang} intl={intl} section={volume.section} /> }]} />
        </div>
      </section>
    </div>
  );
}

function SeriesDetail({ volumes, lang, intl, userId, user }: { volumes: OfflineComicVolume[]; lang: Locale; intl: Dictionary; userId: string; user: Session | null }) {
  const sortedVolumes = useMemo(() => volumes.slice().sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })), [volumes]);
  const first = sortedVolumes[0];
  if (!first) return <OfflineUnavailable intl={intl} />;
  const meta = volumeMetadata(first);
  const title = offlineSeriesTitle(first);
  const isCollection = first.section === "others";
  const averageRating = typeof meta.communityRating === "number" ? meta.communityRating : null;

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <OfflineCover src={offlineCover(userId, first)} alt={`Cover for ${title}`} />
        </div>
        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{title}</h1>
          <ReadButtonsSeries lang={lang} intl={intl} seriesId={first.seriesId} seriesVolumeCount={sortedVolumes.length} initFavorite={sortedVolumes.some((volume) => volume.isFavorite)} seriesSlug={first.seriesSlug} section={first.section} userId={user?.id} />
          <div className="mt-8"><SeriesRating rating={averageRating} /></div>
          <MetadataBadges intl={intl} meta={meta} />
          <p className="mt-4">{meta.year ? meta.year as number : null} &bull; {sortedVolumes.length} {(isCollection ? intl.libraries.otherWorks : intl.manga.volumes) as string}</p>
          {meta.summary ? <><h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis as string} (vol. 1)</h2><MangaSummary meta={meta} intl={intl} /></> : null}
          <Separator />
          <MetadataPanel meta={meta} originalTitle={first.seriesIsLogical === false ? getComicOriginalTitle(meta, true) : null} lang={lang} intl={intl} linkBase="series" section={first.section} />
        </div>
      </section>
      <section>
        <Separator />
        <h2>{(isCollection ? intl.libraries.otherCollectionWorks : intl.manga.seriesVolumes) as string}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
          {sortedVolumes.map((volume) => <MangaCard key={volume.id} title={offlineVolumeTitle(volume)} href={`/${lang}/${volume.section}/volume/${volume.slug}`} isSeries={false} isOneshot={false} onGoing={false} onPause={false} volumeCount={null} cover={offlineCover(userId, volume)} isDragging={false} seriesSlug={null} progressRatio={progressRatio(volume)} offlineVolumeId={volume.id} intl={intl} className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg" />)}
        </div>
      </section>
    </div>
  );
}

function OfflineVolumesIndex({ volumes, filterVolumes, lang, intl, userId, favorites, section, toRead }: { volumes: OfflineComicVolume[]; filterVolumes: OfflineVolume[]; lang: Locale; intl: Dictionary; userId: string; favorites: boolean; section: LibrarySection; toRead: boolean }) {
  const page = Math.max(1, Number(new URLSearchParams(window.location.search).get("page") || "1"));
  const totalPages = Math.max(1, Math.ceil(volumes.length / LIBRARY_PAGE_SIZE));
  const pageVolumes = volumes.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE);
  const title = favorites
    ? section === "others" ? intl.favorites.headingOthersVolumes : section === "comic" ? intl.favorites.headingComicVolumes : intl.favorites.headingMangaVolumes
    : toRead
      ? intl.manga.wantToRead
      : section === "others" ? intl.libraries.allOtherWorks : intl.manga.allVolumes;
  const Icon = toRead ? BookmarkIcon : BookCopyIcon;
  const emptyMessage = section === "others" ? intl.misc.noWorksFav : section === "comic" ? intl.misc.noComicsFav : intl.misc.noVolumesFav;

  if (!volumes.length && favorites) return <div className="flex flex-col items-center justify-center h-80 gap-4"><GhostIcon size={64} /><h2>{emptyMessage as string}</h2></div>;

  return <>{favorites ? (
    <h2 className="flex items-center mb-4"><Icon size={28} className="mr-2" />{title as string}</h2>
  ) : (
    <FiltersDrawer intl={intl} lang={lang} scope={getLibraryScope(section)} offlineVolumes={filterVolumes} icon={<Icon size={28} />} title={title as string} />
  )}<section className={favorites ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4"}>{pageVolumes.map((volume) => <MangaCard key={volume.id} title={offlineVolumeTitle(volume)} href={`/${lang}/${volume.section}/volume/${volume.slug}`} isSeries={false} isOneshot={volume.isOneshot} onGoing={false} onPause={false} volumeCount={null} cover={offlineCover(userId, volume)} progressRatio={progressRatio(volume)} isDragging={false} seriesSlug={null} offlineVolumeId={volume.id} intl={intl} className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg" />)}</section>{totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} intl={intl} /></div>}</>;
}

function OfflineSeriesIndex({ volumes, filterVolumes, lang, intl, userId, favorites, section }: { volumes: OfflineComicVolume[]; filterVolumes: OfflineVolume[]; lang: Locale; intl: Dictionary; userId: string; favorites: boolean; section: LibrarySection }) {
  const series = Array.from(new Map(volumes.filter((volume) => !volume.isOneshot).map((volume) => [volume.seriesId, volume])).values());
  const page = Math.max(1, Number(new URLSearchParams(window.location.search).get("page") || "1"));
  const totalPages = Math.max(1, Math.ceil(series.length / LIBRARY_PAGE_SIZE));
  const pageSeries = series.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE);
  const title = favorites
    ? section === "others" ? intl.favorites.headingOthersSeries : section === "comic" ? intl.favorites.headingComicSeries : intl.favorites.headingMangaSeries
    : section === "others" ? intl.libraries.allOtherCollections : intl.manga.allSeries;

  if (!series.length && favorites) return <div className="flex flex-col items-center justify-center h-80 gap-4"><GhostIcon size={64} /><h2>{intl.misc.noSeriesFav as string}</h2></div>;

  return <>{favorites ? (
    <h2 className="flex items-center mb-4"><LibraryBigIcon size={28} className="mr-2" />{title as string}</h2>
  ) : (
    <FiltersDrawer intl={intl} lang={lang} scope={getLibraryScope(section)} offlineVolumes={filterVolumes} icon={<LibraryBigIcon size={28} />} title={title as string} />
  )}<section className={favorites ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7"}>{pageSeries.map((seriesVolume) => { const seriesVolumes = volumes.filter((volume) => volume.seriesId === seriesVolume.seriesId); const progress = seriesVolumes.length > 0 ? seriesVolumes.filter((volume) => volume.isRead).length / seriesVolumes.length : 0; return <MangaCard key={seriesVolume.seriesId} title={offlineSeriesTitle(seriesVolume)} href={`/${lang}/${seriesVolume.section}/${seriesVolume.seriesSlug}`} isSeries isOneshot={false} onGoing={seriesVolume.seriesStatus === "ONGOING"} onPause={seriesVolume.seriesStatus === "HIATUS"} volumeCount={seriesVolumes.length} countLabel={section === "others" ? intl.libraries.otherWorks as string : undefined} cover={offlineCover(userId, seriesVolume)} progressRatio={progress} isDragging={false} seriesSlug={seriesVolume.seriesSlug} offlineSeriesId={seriesVolume.seriesId} intl={intl} className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg" />; })}</section>{totalPages > 1 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} intl={intl} /></div>}</>;
}

function OfflineLibraryHome({ volumes, lang, intl, userId, section }: { volumes: OfflineComicVolume[]; lang: Locale; intl: Dictionary; userId: string; section: LibrarySection }) {
  const entries = (items: OfflineVolume[]): VolEntry[] => items.map((volume) => ({
    id: volume.id,
    slug: volume.slug,
    title: volume.title,
    isOneshot: volume.isOneshot,
    coverImage: offlineCover(userId, volume),
    section,
    meta: { title: offlineVolumeTitle(volume) },
    progressRatio: progressRatio(volume),
  }));
  const recent = volumes.slice().sort((a, b) => (b.downloadedAt ?? "").localeCompare(a.downloadedAt ?? "")).slice(0, 12);
  const recentlyRead = volumes.filter((volume) => volume.isRead).slice(0, 12);
  const nextBySeries = new Map<string, OfflineVolume>();
  volumes.filter((volume) => !volume.isRead && volume.lastPage === 0).forEach((volume) => {
    if (!nextBySeries.has(volume.seriesId)) nextBySeries.set(volume.seriesId, volume);
  });

  const next = Array.from(nextBySeries.values()).slice(0, 12);

  return (
    <div className="library-overview p-4">
      {next.length > 0 && <div className="library-overview-section">
        <MangaRowCarousel entries={entries(next)} lang={lang} intl={intl} section={section} className="" header={<h2 className="flex items-center text-base md:text-lg"><BookMarkedIcon size={28} className="mr-2" />{intl.libraries.inProgress as string}</h2>} />
      </div>}
      {section === "manga" && (
        <div className="library-overview-section">
          <DemographicsTiles intl={intl} lang={lang} section={section} />
        </div>
      )}
      <div className="library-overview-section">
        <MangaRowCarousel entries={entries(recent)} lang={lang} intl={intl} section={section} header={<h2 className="flex items-center text-base md:text-lg"><BookPlusIcon size={28} className="mr-2" />{intl.libraries.recentlyAdded as string}</h2>} />
      </div>
      {recentlyRead.length > 0 && <div className="library-overview-section">
        <MangaRowCarousel entries={entries(recentlyRead)} lang={lang} intl={intl} section={section} header={<h2 className="flex items-center text-base md:text-lg"><BookCheckIcon size={28} className="mr-2" />{intl.libraries.recentlyRead as string}</h2>} />
      </div>}
    </div>
  );
}

function OfflineHome({ lang, intl, userId }: { lang: Locale; intl: Dictionary; userId: string }) {
  const [volumes, setVolumes] = useState<OfflineVolume[] | null>(null);
  useEffect(() => { const load = () => void getReadyVolumes(userId).then(setVolumes); load(); window.addEventListener("bunko:offline-change", load); return () => window.removeEventListener("bunko:offline-change", load); }, [userId]);
  if (!volumes) return null;
  if (!volumes.length) return <OfflineUnavailable intl={intl} />;

  const active = volumes.find((volume) => volume.book
    ? !volume.isRead && !!volume.book.state.progress?.cfi
    : volume.lastPage > 0 && volume.lastPage < volume.totalPages - 1);
  const activeBook = active?.section === "books";
  const entries: VolumeEntry[] = volumes
    .slice()
    .sort((a, b) => (b.downloadedAt ?? "").localeCompare(a.downloadedAt ?? ""))
    .slice(0, 8)
    .map((volume) => ({
      offlineVolumeId: volume.id,
      slug: volume.slug,
      title: volume.title,
      isOneshot: volume.isOneshot,
      coverImage: volume.section === "books" && !volume.coverUrl ? null : offlineCover(userId, volume),
      section: volume.section === "books" ? "manga" : volume.section,
      href: volume.section === "books" ? `/${lang}/books/volume/${volume.slug}` : undefined,
      meta: {
        title: volume.title,
        altTitle: typeof volume.metadata.altTitle === "string" ? volume.metadata.altTitle : null,
      },
      progressRatio: volume.book ? getBookProgressRatio({ isRead: volume.isRead, progression: volume.book.state.progress?.progression }) : progressRatio(volume),
    }));
  const stats = intl.stats as Record<string, string>;
  const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const readCount = volumes.filter((volume) => volume.isRead).length;

  return <div className="relative"><div className="fixed inset-0 -z-10 bg-seigaiha-pattern-w" /><div className="fixed inset-0 -z-20 bg-pearl" /><div className="bg-pearl flex flex-col p-4 mb-24 gap-4 md:flex-row md:mb-0"><div className="w-full md:w-1/2"><HomeKeepRead lang={lang} intl={intl} entry={active ? { id: active.id, title: active.title, slug: active.slug, isOneshot: active.isOneshot, coverImage: activeBook && !active.coverUrl ? null : offlineCover(userId, active), section: active.section === "books" ? "manga" : active.section, href: activeBook ? `/${lang}/books/volume/${active.slug}` : undefined, libraryHref: activeBook ? `/${lang}/books` : undefined, progressRatio: active.book ? getBookProgressRatio(active.book.state.progress) : undefined, meta: { title: active.title, altTitle: typeof active.metadata.altTitle === "string" ? active.metadata.altTitle : null }, lastPage: active.lastPage, totalPages: active.totalPages } : null} /></div><div className="w-full md:w-1/2 flex flex-col justify-between"><div className="group"><section className="grid grid-cols-2 md:grid-cols-3 mt-4 w-full gap-4"><TileStreak title={stats.streak} dailyReadingDates={[]} daysLabel={stats.days} bgColor="bg-sand" textColor="text-onix" /><TileLastRead title={stats.lastRead} lastRead="—" bgColor="bg-sand" textColor="text-onix" /><TileDaysRead title={stats.daysRead} daysReadCount={0} daysInMonth={monthDays} bgColor="bg-sand" textColor="text-onix" /><TileMonthRead title={stats.monthRead} count={0} goal={null} bgColor="bg-sand" textColor="text-onix" /><TileAllRead title={stats.mangaRead} readCount={readCount} totalVolumes={volumes.length} bgColor="bg-sand" textColor="text-onix" /><TileMonthTrend title={stats.prevMonth} percentageChange={0} trend="flat" bgColor="bg-sand" textColor="text-onix" /></section></div><RowNewVols entries={entries} lang={lang} intl={intl} /></div></div></div>;
}

function OfflineLibrary({ path, lang, intl, userId, user }: { path: string; lang: Locale; intl: Dictionary; userId: string; user: Session | null }) {
  const [volumes, setVolumes] = useState<OfflineVolume[] | null>(null);
  useEffect(() => { const load = () => void getReadyVolumes(userId).then(setVolumes); load(); window.addEventListener("bunko:offline-change", load); return () => window.removeEventListener("bunko:offline-change", load); }, [userId]);
  if (!volumes) return null;

  const section: LibrarySection = path.includes(`/${lang}/comic`) || path.includes("/favorites/comic")
    ? "comic"
    : path.includes(`/${lang}/others`) || path.includes("/favorites/others")
      ? "others"
      : "manga";
  const favorites = path.includes(`/${lang}/favorites`);
  const scoped = volumes.filter((volume): volume is OfflineComicVolume => volume.section === section && (!favorites || volume.isFavorite));
  const volumeSlug = path.match(/\/volume\/([^/?]+)/)?.[1];
  const seriesSlug = !volumeSlug ? path.match(new RegExp(`/${section}/([^/?]+)`))?.[1] : null;
  const selectedVolume = volumeSlug ? scoped.find((volume) => volume.slug === volumeSlug) : null;
  const selectedSeries = seriesSlug && !["series", "volumes", "toread"].includes(seriesSlug) ? scoped.filter((volume) => volume.seriesSlug === seriesSlug) : null;

  if (selectedVolume) return <div className="mb-24 md:mb-4"><VolumeDetail volume={selectedVolume} lang={lang} intl={intl} userId={userId} user={user} /></div>;
  if (selectedSeries) return <div className="mb-24 md:mb-4"><SeriesDetail volumes={selectedSeries} lang={lang} intl={intl} userId={userId} user={user} /></div>;
  if (!scoped.length && !favorites) return <OfflineUnavailable intl={intl} />;

  if (path.split("?")[0] === `/${lang}/${section}`) {
    return <><HeroKeepRead lang={lang} intl={intl} section={section} scope={getLibraryScope(section)} offlineUserId={userId} /><div className="mb-24 md:mb-4"><OfflineLibraryHome volumes={scoped} lang={lang} intl={intl} userId={userId} section={section} /></div></>;
  }

  const pathname = path.split("?")[0];
  const query = new URLSearchParams(path.split("?")[1]);
  const selectedPublishers = filterValues(query.getAll("publisher"));
  const selectedAuthors = query.get("author")?.split(",").filter(Boolean) ?? [];
  const selectedGenres = query.get("genre")?.split(",").filter(Boolean) ?? [];
  const selectedTags = query.get("tag")?.split(",").filter(Boolean) ?? [];
  const toRead = pathname.endsWith("/toread");
  const entries = (toRead ? scoped.filter((volume) => !volume.isRead) : scoped).filter((volume) => {
    const writer = typeof volume.metadata.writer === "string" ? volume.metadata.writer.split(",").map((item) => item.trim()) : [];
    const genres = Array.isArray(volume.metadata.genres) ? volume.metadata.genres.map(String) : [];
    const tags = Array.isArray(volume.metadata.tags) ? volume.metadata.tags.map(String) : [];
    return (!selectedPublishers.length || selectedPublishers.includes(String(volume.metadata.publisher ?? "").trim())) && (!selectedAuthors.length || selectedAuthors.some((author) => writer.includes(author))) && (!selectedGenres.length || selectedGenres.some((genre) => genres.includes(genre))) && (!selectedTags.length || selectedTags.some((tag) => tags.includes(tag)));
  });
  const isSeries = pathname.endsWith("/series") || (favorites && !pathname.endsWith("/volumes"));
  const content = isSeries ? <OfflineSeriesIndex volumes={entries} filterVolumes={scoped} lang={lang} intl={intl} userId={userId} favorites={favorites} section={section} /> : <OfflineVolumesIndex volumes={entries} filterVolumes={scoped} lang={lang} intl={intl} userId={userId} favorites={favorites} section={section} toRead={toRead} />;

  if (favorites) return <div className="flex flex-col md:flex-row md:h-screen overflow-hidden"><SidebarMisc><h2 className="flex items-center text-onix"><HeartIcon size={28} className="mr-2" />{intl.favorites.title as string}</h2><FavoritesNav intl={intl} /></SidebarMisc><div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto"><div className="mb-24 md:mb-4">{content}</div></div></div>;

  return <><HeroKeepRead lang={lang} intl={intl} section={section} scope={getLibraryScope(section)} offlineUserId={userId} /><div className="mb-24 md:mb-4"><section className="p-4 mt-4">{content}</section></div></>;
}

function OfflineCatalog({ intl }: { intl: Dictionary }) {
  return <div className="flex flex-col md:flex-row md:h-screen overflow-hidden"><SidebarMisc><h2 className="flex items-center text-onix"><BookAIcon size={28} className="mr-2" />{intl.catalog.title as string}</h2><CatalogNav intl={intl} /></SidebarMisc><div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto"><div className="mb-24 md:mb-4"><OfflineUnavailable intl={intl} /></div></div></div>;
}

function OfflineMiscFrame({ kind, intl, user }: { kind: "profile" | "settings"; intl: Dictionary; user: Session }) {
  const isProfile = kind === "profile";
  const profile = intl.profile as Record<string, string>;
  const title = isProfile && user.name ? `${profile.greeting} ${user.name}` : isProfile ? profile.title : intl.settings.title as string;
  const Icon = isProfile ? UserRoundIcon : Settings2Icon;
  return <div className="flex flex-col md:flex-row md:h-screen overflow-hidden"><SidebarMisc><h2 className="flex items-center text-onix"><Icon size={28} className="mr-2" />{title}</h2>{isProfile ? <ProfileNav intl={intl} /> : <SettingsNav intl={intl} />}</SidebarMisc><div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto"><div className="mb-24 md:mb-4"><OfflineUnavailable intl={intl} /></div></div></div>;
}

export default function OfflineGate({ children, lang, intl, user }: { children: React.ReactNode; lang: Locale; intl: Dictionary; user: Session | null }) {
  const { online } = usePwa();
  const [path, setPath] = useState("");
  useEffect(() => { const sync = () => setPath(`${window.location.pathname}${window.location.search}`); sync(); window.addEventListener("popstate", sync); window.addEventListener("bunko:offline-navigate", sync); return () => { window.removeEventListener("popstate", sync); window.removeEventListener("bunko:offline-navigate", sync); }; }, []);
  if (online) return children;
  if (!user) return <OfflineUnavailable intl={intl} />;
  if (path.split("?")[0] === `/${lang}`) return <OfflineHome lang={lang} intl={intl} userId={user.id} />;
  if (path.includes(`/${lang}/catalog`)) return <OfflineCatalog intl={intl} />;
  if (path.includes(`/${lang}/profile`)) return <OfflineMiscFrame kind="profile" intl={intl} user={user} />;
  if (path.includes(`/${lang}/settings`)) return <OfflineMiscFrame kind="settings" intl={intl} user={user} />;
  const [, , library, favoritesLibrary] = path.split("?")[0].split("/");
  if (library === "books" || (library === "favorites" && favoritesLibrary === "books")) return <OfflineBooks path={path} lang={lang} intl={intl} userId={user.id} />;
  if (path.includes(`/${lang}/search`)) return <div className="p-4"><SearchComp lang={lang} intl={intl} /></div>;
  if (path.includes(`/${lang}/manga`) || path.includes(`/${lang}/comic`) || path.includes(`/${lang}/others`) || path.includes(`/${lang}/favorites`)) return <OfflineLibrary path={path} lang={lang} intl={intl} userId={user.id} user={user} />;
  return <OfflineUnavailable intl={intl} />;
}
