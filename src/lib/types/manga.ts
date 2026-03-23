export type StorageProvider = "cloud" | "local";

export interface ComicMetadata {
  series: string | null;
  title: string | null;
  number: number | null;
  count: number | null;
  publisher: string | null;
  imprint: string | null;
  languageISO: string | null;
  format: string | null;
  ageRating: string | null;
  communityRating: number | null;
  writer: string | null;
  penciller: string | null;
  inker: string | null;
  colorist: string | null;
  letterer: string | null;
  coverArtist: string | null;
  editor: string | null;
  summary: string | null;
  web: string | null;
  pageCount: number | null;
  year: number | null;
  month: number | null;
  day: number | null;
  gtin: string | null;
  mangaStyle: string | null;
}

export interface ComicInfoResult {
  metadata: ComicMetadata;
  genres: string[];
  tags: string[];
}

export type ScanStepStatus = "pending" | "working" | "running" | "done" | "error";

export interface ScanStatus {
  startedAt?: string | null;
  finishedAt?: string | null;
  status?: "working" | "done" | "error";
  currentTask?: string | null;
  error?: string | null;
  steps?: Record<string, ScanStepStatus>;
}
