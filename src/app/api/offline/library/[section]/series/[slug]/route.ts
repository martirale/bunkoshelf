import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { listVolumeProgressByIds } from "@/lib/db/library";
import { listVolumes, findSeriesBySlugBasic } from "@/lib/db/library";
import { getLibrarySection, getLibraryScope, type LibrarySection } from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";

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
  const series = await findSeriesBySlugBasic(slug);
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  const volumes = await listVolumes({ seriesIds: [series.id], includeGenres: true, includeTags: true, scope: getLibraryScope(section as LibrarySection) });
  if (!volumes.length || getLibrarySection(volumes[0].series.librarySection) !== section) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }
  const progressById = await listVolumeProgressByIds(user.id, volumes.map((volume) => volume.id));

  return NextResponse.json({
    volumes: volumes.map((volume) => {
      const source = volume.metadataObj;
      const { id: _id, filePath: _filePath, createdAt: _createdAt, updatedAt: _updatedAt, ...metadata } = source ?? {};
      const progress = progressById[volume.id];
      return {
        id: volume.id,
        slug: volume.slug,
        section,
        title: source?.title || volume.title,
        series: { id: series.id, slug: series.slug, title: series.title, isOneshot: series.isOneshot, status: series.status },
        mangaStyle: source?.mangaStyle ?? null,
        metadata: { ...metadata, genres: volume.genres.map((genre) => genre.name), tags: volume.tags.map((tag) => tag.name) },
        coverUrl: getMangaCoverUrl(volume),
        isRead: progress?.isRead ?? false,
        isFavorite: progress?.isFavorite ?? false,
        lastPage: progress?.lastPage ?? 0,
        totalPages: progress?.totalPages ?? source?.pageCount ?? 0,
      };
    }),
  });
}
