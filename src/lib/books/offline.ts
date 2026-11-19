import type { EpubMetadata } from "./types";

export interface BookReaderState {
  progress: BookPosition | null;
  bookmarks: Array<{ id: string; cfi: string; label: string | null; chapterLabel: string | null }>;
  annotations: Array<{ id: string; cfiRange: string; excerpt: string | null; note: string | null; color: string }>;
}

export interface BookPosition {
  cfi?: string | null;
  progression?: number | null;
  isRead?: boolean;
  isFavorite?: boolean;
  lastReadAt?: string | null;
}

export interface OfflineBookDetails {
  number: number | null;
  seriesPosition?: number;
  seriesFavorite?: boolean;
  state: BookReaderState;
}

export type OfflineBookMetadata = EpubMetadata & Record<string, unknown>;
