import type { Dictionary } from "@/lib/types";
import type { LibrarySection } from "@/lib/librarySection";

export type DetailNavigationSection = LibrarySection | "books";

export function getDetailNavigationLabels(section: DetailNavigationSection, intl: Dictionary) {
  const labels = intl.libraries as Record<string, string>;

  if (section === "comic") {
    return {
      allSeries: labels.allSeries,
      allVolumes: labels.allComicIssues,
      previous: labels.previousComicIssue,
      next: labels.nextComicIssue,
    };
  }

  if (section === "others") {
    return {
      allSeries: labels.allSeries,
      allVolumes: labels.allOtherWorksNavigation,
      previous: labels.previousOtherWork,
      next: labels.nextOtherWork,
    };
  }

  if (section === "books") {
    return {
      allSeries: labels.allSeries,
      allVolumes: labels.allBooks,
      previous: labels.previousBook,
      next: labels.nextBook,
    };
  }

  return {
    allSeries: labels.allSeries,
    allVolumes: labels.allMangaVolumes,
    previous: labels.previousMangaVolume,
    next: labels.nextMangaVolume,
  };
}
