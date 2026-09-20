interface SlugItem {
  slug: string;
}

export function getAdjacentSlugs<T extends SlugItem>(items: T[], currentSlug: string) {
  const currentIndex = items.findIndex((item) => item.slug === currentSlug);

  if (currentIndex < 0) return {};

  return {
    previousSlug: items[currentIndex - 1]?.slug,
    nextSlug: items[currentIndex + 1]?.slug,
  };
}
