import { canAccessBookVolume } from "@/lib/clubs/access";
import { getBookCoverUrl } from "@/lib/books/cover";
import { classifyBookSubjects, type BookVolume } from "@/lib/db/books/library";
import { findBookProgress, findBookSeriesFavorite, listBookAnnotations, listBookBookmarks } from "@/lib/db/books/reading";
import type { Session } from "@/lib/types";

export async function getOfflineBookManifest(user: Session, volume: BookVolume, seriesPosition?: number) {
  if (!(await canAccessBookVolume(user, volume.id))) return null;
  const [progress, bookmarks, annotations, seriesFavorite, subjects] = await Promise.all([
    findBookProgress(user.id, volume.id),
    listBookBookmarks(user.id, volume.id),
    listBookAnnotations(user.id, volume.id),
    findBookSeriesFavorite(user.id, volume.series.id),
    classifyBookSubjects(volume.metadata.subjects.map((subject) => subject.name)),
  ]);
  return {
    id: volume.id,
    slug: volume.slug,
    section: "books" as const,
    title: volume.metadata.title,
    series: {
      id: volume.series.id,
      slug: volume.series.slug,
      title: volume.series.title,
      isOneshot: volume.series.isOneshot,
      isLogical: volume.series.isLogical,
      status: volume.series.status,
    },
    mangaStyle: null,
    metadata: {
      ...volume.metadata,
      writer: volume.metadata.people.filter((person) => person.kind === "creator" && (!person.role || person.role.toLowerCase() === "aut")).map((person) => person.name).join(", "),
      genres: subjects.filter((subject) => subject.type === "genre").map((subject) => subject.name),
      tags: subjects.filter((subject) => subject.type === "tag").map((subject) => subject.name),
    },
    book: { number: volume.number, seriesPosition, seriesFavorite, state: { progress, bookmarks, annotations } },
    coverUrl: getBookCoverUrl(volume.slug, volume.metadata.coverPath),
    isRead: progress?.isRead ?? false,
    isFavorite: progress?.isFavorite ?? false,
    personalRating: progress?.personalRating ?? null,
    lastPage: 0,
    totalPages: 1,
  };
}
