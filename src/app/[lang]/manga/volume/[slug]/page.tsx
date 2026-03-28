import { Suspense } from "react";
import VolumesContent from "@/components/library/manga/VolumesContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/Dictionary";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/types";

interface VolumeMangaPageProps {
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

async function VolumeMangaPageContent({ params }: VolumeMangaPageProps) {
  const { lang = "es", slug } = await params;
  const intl = await getDictionary(lang as Locale);

  try {
    const user = await verifySession();

    const volumeEntry = await prisma.mangaVolume.findUnique({
      where: { slug },
      include: {
        series: true,
        metadataObj: true,
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!volumeEntry) {
      return (
        <div className="text-center mt-8">
          {(intl?.errors?.notFound as string) || "Volumen no encontrado."}
        </div>
      );
    }

    const meta = {
      ...(volumeEntry.metadataObj || null),
      genres: Array.isArray(volumeEntry.genres)
        ? volumeEntry.genres
            .map((g) => (g.genre?.name ? { name: g.genre.name.trim() } : null))
            .filter(Boolean)
        : [],
      tags: Array.isArray(volumeEntry.tags)
        ? volumeEntry.tags
            .map((t) => (t.tag?.name ? { name: t.tag.name.trim() } : null))
            .filter(Boolean)
        : [],
    };

    const normalizedVolume = {
      ...volumeEntry,
      coverImage: volumeEntry.coverImage
        ? `/api/library/manga/cover/${volumeEntry.slug}/${volumeEntry.coverImage}`
        : null,
      meta,
    };

    let isFavorite = false;
    let isRead = false;
    let firstRead: string | null = null;
    let personalRating: number | null = null;

    if (user) {
      const userVolume = await prisma.userToVolume.findUnique({
        where: {
          userId_volumeId: { userId: user.id, volumeId: volumeEntry.id },
        },
        select: {
          isFavorite: true,
          isRead: true,
          firstRead: true,
          personalRating: true,
        },
      });

      isFavorite = userVolume?.isFavorite ?? false;
      isRead = userVolume?.isRead ?? false;
      firstRead = userVolume?.firstRead ?? null;
      personalRating = userVolume?.personalRating ?? null;
    }

    let readingEntries: { id: string; readAt: string | null }[] = [];

    if (user) {
      readingEntries = await prisma.readingEntry.findMany({
        where: { userId: user.id, volumeId: volumeEntry.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, readAt: true },
      });
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

export default function VolumeMangaPage({ params }: VolumeMangaPageProps) {
  return (
    <Suspense fallback={<VolumeSkeleton />}>
      <VolumeMangaPageContent params={params} />
    </Suspense>
  );
}
