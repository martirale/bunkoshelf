export type LogicalSeriesSection = "manga" | "comic" | "other" | "books";

export interface LogicalSeriesMember {
  id: string;
  position: number;
}

export interface LogicalSeriesInput {
  title: string;
  section: LogicalSeriesSection;
  members: LogicalSeriesMember[];
}

export interface LogicalSeriesOption {
  id: string;
  title: string;
  section: LogicalSeriesSection;
  volumeCount: number;
}

export function validateLogicalSeries(input: LogicalSeriesInput): boolean {
  if (!input || typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200) return false;
  if (!["manga", "comic", "other", "books"].includes(input.section)) return false;
  if (!Array.isArray(input.members) || input.members.length < 2) return false;
  const ids = new Set<string>();
  const positions = new Set<number>();
  for (const member of input.members) {
    if (!member || typeof member.id !== "string" || !member.id || ids.has(member.id)) return false;
    if (!Number.isSafeInteger(member.position) || member.position < 1 || member.position > 2147483647 || positions.has(member.position)) return false;
    ids.add(member.id);
    positions.add(member.position);
  }
  return true;
}
