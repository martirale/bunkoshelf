import { Suspense } from "react";
import { getMangaVolumes } from "@/actions/library";
import { getReaderStats } from "@/actions/stats";
import HeroKeepRead from "@/components/home/manga/HeroKeepRead";
import RowNewVols from "@/components/home/manga/RowNewVols";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ReloadButton from "@/components/ui/ReloadButton";
import PushButton from "@/components/ui/PushButton";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import { getLibrarySection } from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { Locale, DictionarySection } from "@/lib/types";
import type { HomeKeepReadingEntry } from "@/components/home/manga/HeroKeepRead";
import type { VolumeEntry } from "@/components/home/manga/RowNewVolsCarousel";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

function HeroSkeleton() {
  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-3/5">
      <div className="h-7 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="w-full px-12 md:px-0">
        <div className="w-full aspect-[3/5] rounded-lg bg-sand animate-pulse" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-4 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[110px] rounded-lg bg-sand animate-pulse" />
      ))}
    </div>
  );
}

function RowNewVolsSkeleton() {
  return (
    <section className="mt-8">
      <div className="h-7 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-1/2 md:w-2/5 2xl:w-1/4 aspect-[3/5] rounded-lg bg-sand animate-pulse" />
        ))}
      </div>
    </section>
  );
}

function HomeContentSkeleton() {
  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10 bg-seigaiha-pattern-w" />
      <div className="fixed inset-0 -z-20 bg-pearl" />
      <div
        className={clsx(
          "bg-pearl flex flex-col p-4 mb-24 gap-4",
          "md:flex-row md:mb-0"
        )}
      >
        <div className="w-full md:w-1/2">
          <HeroSkeleton />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div className="group">
            <StatsSkeleton />
          </div>

          <RowNewVolsSkeleton />
        </div>
      </div>
    </div>
  );
}

async function HomeContent({
  lang,
  intl,
}: {
  lang: Locale;
  intl: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const volumesResult = await getMangaVolumes();
  const statsData = await getReaderStats();
  const othersLibraryEnabled = await isOthersLibraryEnabled();

  const home = intl.home as DictionarySection;
  const volumes = volumesResult?.success && volumesResult.data
    ? volumesResult.data
    : [];

  const keepReadingEntry: HomeKeepReadingEntry | null = volumes
    .map((vol) => {
      const progress = vol.usersProgress?.[0] ?? null;
      return {
        title: vol.title,
        slug: vol.slug,
        isOneshot: vol.series?.isOneshot === true,
        coverImage: getMangaCoverUrl(vol),
        section: getLibrarySection(
          vol.metadataObj?.mangaStyle,
          othersLibraryEnabled
        ),
        meta: vol.metadataObj ? { title: vol.metadataObj.title } : null,
        lastPage: progress?.lastPage ?? 0,
        totalPages: progress?.totalPages ?? 0,
        lastReadAt: progress?.lastReadAt ? new Date(progress.lastReadAt) : null,
      };
    })
    .filter((vol) => {
      if (!vol.lastReadAt) return false;
      const notStarted = vol.lastPage === 0;
      const alreadyFinished = vol.lastPage >= vol.totalPages - 1;
      return !notStarted && !alreadyFinished;
    })
    .sort((a, b) => (b.lastReadAt?.getTime() ?? 0) - (a.lastReadAt?.getTime() ?? 0))[0] ?? null;

  const recentEntries: VolumeEntry[] = [...volumes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((vol) => ({
      title: vol.title,
      slug: vol.slug,
      isOneshot: vol.series?.isOneshot === true,
      coverImage: getMangaCoverUrl(vol),
      section: getLibrarySection(
        vol.metadataObj?.mangaStyle,
        othersLibraryEnabled
      ),
      meta: vol.metadataObj ? { title: vol.metadataObj.title } : null,
    }));

  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10 bg-seigaiha-pattern-w" />
      <div className="fixed inset-0 -z-20 bg-pearl" />
      <div
        className={clsx(
          "bg-pearl flex flex-col p-4 mb-24 gap-4",
          "md:flex-row md:mb-0"
        )}
      >
        <div className="w-full md:w-1/2">
          <HeroKeepRead
            lang={lang}
            intl={intl}
            vapidPublicKey={process.env.VAPID_PUBLIC_KEY}
            entry={keepReadingEntry}
          />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div className="group">
            <div className="hidden md:flex justify-end gap-2">
              <PushButton lang={lang} intl={intl} vapidPublicKey={process.env.VAPID_PUBLIC_KEY} />
              <ReloadButton />
            </div>

            <ReaderStatsPanel
              lang={lang}
              intl={intl}
              mdCols="md:grid-cols-3 mt-4"
              data={statsData}
            />

            <div className="flex justify-center ml-4 mt-2 md:justify-end md:ml-0">
              <Link
                href={`/${lang}/profile`}
                className={clsx(
                  "text-onix w-max flex items-center text-base",
                  "hover:underline transition-all duration-300"
                )}
              >
                {home.goToProfile as string}
                <ChevronRightIcon size={20} className="ml-1" />
              </Link>
            </div>
          </div>

          <RowNewVols
            lang={lang}
            intl={intl}
            entries={recentEntries}
          />
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <Suspense fallback={<HomeContentSkeleton />}>
      <HomeContent lang={lang as Locale} intl={intl} />
    </Suspense>
  );
}
