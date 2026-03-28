export interface MonthlyReadEntry {
  month: number;
  count: number;
}

export interface DailyReadingEntry {
  date: string;
}

export interface ReadDateEntry {
  lastReadAt: Date | null;
}

export interface ReaderStats {
  volumesRead: Array<{ id: string; volumeId: string; lastReadAt: Date | null }>;
  readEntries: ReadDateEntry[];
  allCompleted: Array<{ id: string; volumeId: string }>;
  allReadDates: ReadDateEntry[];
  dailyReading: DailyReadingEntry[];
  totalVolumes: number;
  totalSeries: number;
  readingProgressSummary: {
    totalTracked: number;
    totalRead: number;
    totalUnread: number;
  };
  monthlyReads: MonthlyReadEntry[];
  monthlyGoal: number | null;
}

export interface GenreStatEntry {
  genre: string;
  user: number;
}
