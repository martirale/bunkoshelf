export interface SearchResult {
  id: string;
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
