import { listBookVolumes } from "@/lib/db/books/library";
import { getOfflineBookManifest } from "@/lib/books/offlineManifest";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { listVolumeProgressByIds } from "@/lib/db/library";
import { listVolumes, findSeriesBySlugBasic } from "@/lib/db/library";
import { getLibrarySection, getLibraryScope, type LibrarySection } from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import { canAccessLibraryVolume } from "@/lib/clubs/access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string; slug: string }> },
) {
  const { section, slug } = await params;
  if (section !== "manga" && section !== "comic" && section !== "others" && section !== "books") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (section === "books") {
    const books = await listBookVolumes({ seriesSlug: slug });
    if (!books.length) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    const manifests = [];
    for (const [position, book] of books.entries()) {
      const manifest = await getOfflineBookManifest(user, book, position);
      if (!manifest) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      manifests.push(manifest);
    }
    return NextResponse.json({ volumes: manifests });
  }
  const series = await findSeriesBySlugBasic(slug, section === "others" ? "other" : section);
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  const volumes = await listVolumes({ seriesIds: [series.id], includeGenres: true, includeTags: true, scope: getLibraryScope(section as LibrarySection) });
  if (!volumes.length || getLibrarySection(volumes[0].series.librarySection) !== section) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }
  if (user.role === "GUEST" && !(await Promise.all(volumes.map((volume) => canAccessLibraryVolume(user, volume.id)))).every(Boolean)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        series: { id: series.id, slug: series.slug, title: series.title, isOneshot: series.isOneshot, status: series.status, isLogical: series.isLogical === true },
        mangaStyle: source?.mangaStyle ?? null,
        metadata: { ...metadata, genres: volume.genres.map((genre) => genre.name), tags: volume.tags.map((tag) => tag.name) },
        coverUrl: getMangaCoverUrl(volume),
        isRead: progress?.isRead ?? false,
        isFavorite: progress?.isFavorite ?? false,
        personalRating: progress?.personalRating ?? null,
        lastReadAt: progress?.lastReadAt?.toISOString() ?? null,
        lastPage: progress?.lastPage ?? 0,
        totalPages: progress?.totalPages ?? source?.pageCount ?? 0,
      };
    }),
  });
}
