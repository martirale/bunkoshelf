import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findVolumeProgress } from "@/lib/db/reading";
import { findVolumeBySlug } from "@/lib/db/library";
import { getLibrarySection, type LibrarySection } from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";

function metadata(value: Awaited<ReturnType<typeof findVolumeBySlug>>) {
  const source = value?.metadataObj;
  if (!source) return {};
  const { id: _id, filePath: _filePath, createdAt: _createdAt, updatedAt: _updatedAt, ...safe } = source;
  return safe;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string; slug: string }> },
) {
  const { section, slug } = await params;
  if (section !== "manga" && section !== "others") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const volume = await findVolumeBySlug({ slug, includeGenres: true, includeTags: true });
  if (!volume || getLibrarySection(volume.series.librarySection) !== section) {
    return NextResponse.json({ error: "Volume not found" }, { status: 404 });
  }
  const progress = await findVolumeProgress(user.id, volume.id);
  const resolvedSection = section as LibrarySection;

  return NextResponse.json({
    volume: {
      id: volume.id,
      slug: volume.slug,
      section: resolvedSection,
      title: volume.metadataObj?.title || volume.title,
      series: {
        id: volume.series.id,
        slug: volume.series.slug,
        title: volume.series.title,
        isOneshot: volume.series.isOneshot,
        status: volume.series.status,
      },
      mangaStyle: volume.metadataObj?.mangaStyle ?? null,
      metadata: {
        ...metadata(volume),
        genres: volume.genres.map((genre) => genre.name),
        tags: volume.tags.map((tag) => tag.name),
      },
      coverUrl: getMangaCoverUrl(volume),
      isRead: progress?.is_read ?? false,
      isFavorite: progress?.is_favorite ?? false,
      lastPage: progress?.last_page ?? 0,
      totalPages: progress?.total_pages ?? volume.metadataObj?.pageCount ?? 0,
    },
  });
}
