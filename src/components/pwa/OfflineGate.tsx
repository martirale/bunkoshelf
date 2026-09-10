"use client";

import { useEffect, useState } from "react";
import { CloudOffIcon, DownloadIcon, LibraryBigIcon } from "lucide-react";
import Link from "next/link";
import MangaReader from "@/components/reader/MangaReader";
import MangaCard from "@/components/ui/MangaCard";
import { enqueueOfflineOperation, getOfflineImages, getReadyVolumes, offlinePageUrl, updateOfflineVolume, type OfflineVolume } from "@/lib/client/offlineLibrary";
import type { Dictionary, Locale } from "@/lib/types";
import { usePwa } from "./PwaProvider";

function OfflineUnavailable({ intl }: { intl: Dictionary }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
      <CloudOffIcon size={64} />
      <h2 className="font-roboto text-center">{(intl.offline?.unavailable as string) || "No disponible sin conexión"}</h2>
    </div>
  );
}

function OfflineVolumeReader({ volume, intl, userId }: { volume: OfflineVolume; intl: Dictionary; userId: string }) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const openReader = async () => {
    setImages(await getOfflineImages(userId, volume.id));
    setOpen(true);
  };
  const closeReader = async () => {
    const saved = localStorage.getItem(`reader-progress:${volume.slug}`);
    if (saved) {
      const { lastPage, totalPages, lastReadAt } = JSON.parse(saved) as { lastPage: number; totalPages: number; lastReadAt: string };
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await updateOfflineVolume(userId, volume.id, { lastPage, totalPages, isRead: lastPage >= totalPages - 1 });
      await enqueueOfflineOperation(userId, "progress", { volumeSlug: volume.slug, lastPage, totalPages, lastReadAt, date });
    }
    setOpen(false);
  };
  return (
    <>
      <button onClick={openReader} className="flex items-center font-bold px-5 py-2 rounded-lg leading-none uppercase text-sand bg-lilah border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300">
        <DownloadIcon size={20} className="mr-2" />
        {intl.manga.read as string}
      </button>
      <MangaReader
        isOpen={open}
        onClose={() => void closeReader()}
        slug={volume.slug}
        intl={intl}
        isYoureiMode={false}
        readingDirection={volume.mangaStyle === "YesLTR" || volume.mangaStyle === "No" ? "ltr" : "rtl"}
        coverSrc={offlinePageUrl(userId, volume.id, -1)}
        mangaTitle={volume.title}
        volumeId={volume.id}
        communityRating={typeof volume.metadata.communityRating === "number" ? volume.metadata.communityRating : null}
        initialPersonalRating={null}
        offlineImages={images}
      />
    </>
  );
}

function OfflineLibrary({ path, lang, intl, userId }: { path: string; lang: Locale; intl: Dictionary; userId: string }) {
  const [volumes, setVolumes] = useState<OfflineVolume[] | null>(null);
  useEffect(() => {
    const load = () => void getReadyVolumes(userId).then(setVolumes);
    load();
    window.addEventListener("bunko:offline-change", load);
    return () => window.removeEventListener("bunko:offline-change", load);
  }, [userId]);
  if (!volumes) return null;

  const section = path.includes(`/${lang}/others`) || path.includes("/favorites/others") ? "others" : "manga";
  const favoritesOnly = path.includes("/favorites/");
  const scoped = volumes.filter((volume) => volume.section === section && (!favoritesOnly || volume.isFavorite));
  const volumeSlug = path.match(/\/volume\/([^/]+)/)?.[1];
  const seriesSlug = !volumeSlug && path.match(new RegExp(`/${section}/([^/?]+)`))?.[1];
  const selectedVolume = volumeSlug ? scoped.find((volume) => volume.slug === volumeSlug) : null;
  const selectedSeries = seriesSlug && !["series", "volumes", "toread"].includes(seriesSlug)
    ? scoped.filter((volume) => volume.seriesSlug === seriesSlug)
    : null;

  if (selectedVolume) {
    return (
      <div className="p-4">
        <section className="flex flex-col md:flex-row">
          <div className="w-full md:w-5/12 2xl:w-1/3 px-16 md:px-0">
            {/* Offline blobs cannot pass through Next image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offlinePageUrl(userId, selectedVolume.id, -1)} alt={selectedVolume.title} className="w-full h-auto object-contain rounded-lg" />
          </div>
          <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
            <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{selectedVolume.title}</h1>
            {!selectedVolume.isOneshot && <Link href={`/${lang}/${section}/${selectedVolume.seriesSlug}`} className="block py-2 italic hover:underline">{intl.manga.series as string} {selectedVolume.seriesTitle}</Link>}
            <div className="mt-4"><OfflineVolumeReader volume={selectedVolume} intl={intl} userId={userId} /></div>
          </div>
        </section>
      </div>
    );
  }

  if (selectedSeries) {
    if (!selectedSeries.length) return <OfflineUnavailable intl={intl} />;
    return <OfflineGrid volumes={selectedSeries} lang={lang} intl={intl} userId={userId} section={section} title={selectedSeries[0].seriesTitle} />;
  }
  if (!scoped.length) return <OfflineUnavailable intl={intl} />;
  const isSeriesListing = path.endsWith("/series") || (favoritesOnly && !path.endsWith("/volumes"));
  const listing = isSeriesListing ? Array.from(new Map(scoped.map((volume) => [volume.seriesId, volume])).values()) : scoped;
  return <OfflineGrid volumes={listing} lang={lang} intl={intl} userId={userId} section={section} title={isSeriesListing ? intl.manga.allSeries as string : intl.manga.allVolumes as string} series={isSeriesListing} />;
}

function OfflineGrid({ volumes, lang, intl, userId, section, title, series = false }: { volumes: OfflineVolume[]; lang: Locale; intl: Dictionary; userId: string; section: string; title: string; series?: boolean }) {
  return (
    <section className="p-4 mt-4">
      <h2 className="flex items-center text-base md:text-lg mb-4"><LibraryBigIcon size={28} className="mr-2" />{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {volumes.map((volume) => <MangaCard key={volume.id} title={series ? volume.seriesTitle : volume.title} href={series ? `/${lang}/${section}/${volume.seriesSlug}` : `/${lang}/${section}/volume/${volume.slug}`} isSeries={series} isOneshot={volume.isOneshot} volumeCount={series ? volumes.filter((item) => item.seriesId === volume.seriesId).length : null} cover={offlinePageUrl(userId, volume.id, -1)} isDragging={false} seriesSlug={series ? volume.seriesSlug : null} intl={intl} />)}
      </div>
    </section>
  );
}

export default function OfflineGate({ children, lang, intl, userId }: { children: React.ReactNode; lang: Locale; intl: Dictionary; userId?: string }) {
  const { online } = usePwa();
  const [path, setPath] = useState("");
  useEffect(() => {
    const sync = () => setPath(`${window.location.pathname}${window.location.search}`);
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("bunko:offline-navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("bunko:offline-navigate", sync);
    };
  }, []);
  if (online) return children;
  if (!userId) return <OfflineUnavailable intl={intl} />;
  if (path.includes(`/${lang}/manga`) || path.includes(`/${lang}/others`) || path.includes("/favorites/") || path.includes(`/${lang}/search`) || path.includes(`/${lang}/catalog`)) return <OfflineLibrary path={path} lang={lang} intl={intl} userId={userId} />;
  return <OfflineUnavailable intl={intl} />;
}
