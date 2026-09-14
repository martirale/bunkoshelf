export interface SearchResult {
  id: string;
  section: "manga" | "comic" | "others" | "books";
  type: "series" | "volume";
  title: string;
  slug: string;
  isOneshot: boolean;
  writer: string;
  series: string;
  score: number;
  genres?: string;
  tags?: string;
}
