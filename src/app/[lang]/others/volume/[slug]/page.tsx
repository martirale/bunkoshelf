import { Suspense } from "react";
import { redirect } from "next/navigation";
import VolumesContent from "@/components/library/manga/VolumesContent";
import { verifySession } from "@/lib/auth/verifySession";
import {
  findVolumeProgress,
  listReadingEntries,
} from "@/lib/db/reading";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { findVolumeBySlug } from "@/lib/db/library";
import {
  getLibrarySection,
  getLibraryVolumeHref,
} from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { Locale } from "@/lib/types";

interface OthersVolumePageProps {
  params: Promise<{ lang: string; slug: string }>;
}

function VolumeSkeleton() {
  return (
    <div className="p-4">
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="flex gap-4">
        <div className="w-40 aspect-[3/5] rounded-lg bg-sand animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-sand animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function OthersVolumePageContent({ params }: OthersVolumePageProps) {
  const { lang = "es", slug } = await params;
  const intl = await getDictionary(lang as Locale);

  try {
    const user = await verifySession();

    const volumeEntry = await findVolumeBySlug({
      slug,
      includeGenres: true,
      includeTags: true,
    });

    if (!volumeEntry) {
      return (
        <div className="text-center mt-8">
          {(intl?.errors?.notFound as string) || "Volumen no encontrado."}
        </div>
      );
    }

    const targetSection = getLibrarySection(volumeEntry.metadataObj?.mangaStyle);

    if (targetSection !== "others") {
      redirect(getLibraryVolumeHref(lang, targetSection, volumeEntry.slug));
    }

    const meta = {
      ...(volumeEntry.metadataObj || null),
      genres: Array.isArray(volumeEntry.genres)
        ? volumeEntry.genres
            .map((genre) => (genre.name ? { name: genre.name.trim() } : null))
            .filter(Boolean)
        : [],
      tags: Array.isArray(volumeEntry.tags)
        ? volumeEntry.tags
            .map((tag) => (tag.name ? { name: tag.name.trim() } : null))
            .filter(Boolean)
        : [],
    };

    const normalizedVolume = {
      ...volumeEntry,
      coverImage: getMangaCoverUrl(volumeEntry),
      meta,
    };

    let isFavorite = false;
    let isRead = false;
    let firstRead: string | null = null;
    let personalRating: number | null = null;

    if (user) {
      const userVolume = await findVolumeProgress(user.id, volumeEntry.id);

      isFavorite = userVolume?.is_favorite ?? false;
      isRead = userVolume?.is_read ?? false;
      firstRead = userVolume?.first_read ?? null;
      personalRating = userVolume?.personal_rating ?? null;
    }

    let readingEntries: { id: string; readAt: string | null }[] = [];

    if (user) {
      readingEntries = await listReadingEntries(user.id, volumeEntry.id);
    }

    return (
      <VolumesContent
        volumeData={normalizedVolume}
        lang={lang as Locale}
        intl={intl}
        isFavorite={isFavorite}
        isRead={isRead}
        user={user}
        personalRating={personalRating}
        readingEntries={readingEntries}
        firstRead={firstRead}
        section="others"
      />
    );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Error al obtener datos del volumen:", error);
    return (
      <div className="text-center mt-8">
        {(intl?.errors?.serverError as string) || "Error al cargar el volumen."}
      </div>
    );
  }
}

export default function OthersVolumePage({ params }: OthersVolumePageProps) {
  return (
    <Suspense fallback={<VolumeSkeleton />}>
      <OthersVolumePageContent params={params} />
    </Suspense>
  );
}
