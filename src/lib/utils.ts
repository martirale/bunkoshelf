import { connection } from "next/server";
import { query, queryOne } from "./db/query";
import { buildNaturalSortKey } from "./naturalSort";
import type { Session } from "@/lib/types";

export function sortByPaddedTitle<T>(
  items: T[],
  getValue: (item: T) => string = (item) => (item as { title: string }).title
): T[] {
  return items.slice().sort((a, b) => {
    const aStr = buildNaturalSortKey(getValue(a));
    const bStr = buildNaturalSortKey(getValue(b));
    return aStr.localeCompare(bStr);
  });
}

export function ageRatingMap(ageRating: string | null | undefined): number | null {
  if (!ageRating || typeof ageRating !== "string") return null;

  const mapping: Record<string, number | null> = {
    Unknown: null,
    "Adults Only 18+": 18,
    "Early Childhood": 0,
    Everyone: 0,
    "Everyone 10+": 10,
    G: 0,
    "Kids to Adults": 6,
    M: 16,
    "MA15+": 15,
    "Mature 17+": 17,
    PG: 10,
    "R18+": 18,
    "Rating Pending": null,
    Teen: 13,
    "X18+": 18,
  };

  return mapping[ageRating] ?? null;
}

export async function getChallengeData(user: Session | null) {
  if (!user) return null;
  await connection();
  const currentYear = new Date().getFullYear();

  const challenge = await queryOne<{ goal: number }>(
    `
      SELECT goal
      FROM reading_challenges
      WHERE user_id = $1
        AND year = $2
      LIMIT 1
    `,
    [user.id, currentYear]
  );

  const userVolumes = await query<{ last_read_at: Date | null }>(
    `
      SELECT last_read_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND is_read = TRUE
    `,
    [user.id]
  );

  const goal = challenge?.goal ?? 0;
  const progress = userVolumes.filter((vol) => {
    if (!vol.last_read_at) return false;
    return new Date(vol.last_read_at).getFullYear() === currentYear;
  }).length;
  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  return { goal, progress, percentage };
}
