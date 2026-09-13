interface MangaCoverInput {
  slug: string;
  coverImage: string | null;
  updatedAt?: Date | string | null;
  metadataObj?: { format?: string | null } | null;
}

function getVersion(updatedAt?: Date | string | null): string | null {
  if (!updatedAt) {
    return null;
  }

  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return String(timestamp);
}

export function getMangaCoverUrl({
  slug,
  coverImage,
  updatedAt,
  metadataObj,
}: MangaCoverInput): string | null {
  if (!coverImage) {
    return metadataObj?.format === "EPUB"
      ? `/api/library/books/cover/${encodeURIComponent(slug)}`
      : null;
  }

  const version = getVersion(updatedAt);
  const query = version ? `?v=${version}` : "";

  return `/api/library/manga/cover/${slug}/${coverImage}${query}`;
}
