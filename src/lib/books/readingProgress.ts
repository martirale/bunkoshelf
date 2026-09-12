interface BookProgressLike {
  isRead?: boolean;
  progression?: number | null;
}

export function getBookProgressRatio(progress: BookProgressLike | null | undefined): number {
  if (!progress) return 0;
  if (progress.isRead) return 1;
  if (typeof progress.progression !== "number") return 0;
  return Math.min(1, Math.max(0, progress.progression));
}
