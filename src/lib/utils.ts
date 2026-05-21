import { connection } from "next/server";
import { cache } from "react";
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

export function normalizeCommaSeparatedText(
  value: string | string[] | null | undefined
): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => String(entry).trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  }

  if (typeof value === "string") {
    const parts = value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  }

  return null;
}

function isTransientDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("connect econnrefused") ||
    message.includes("the database system is starting up")
  );
}

const resolveChallengeData = cache(async (userId: string, currentYear: number) => {
  await connection();

  const challenge = await queryOne<{ goal: number }>(
    `
      SELECT goal
      FROM reading_challenges
      WHERE user_id = $1
        AND year = $2
      LIMIT 1
    `,
    [userId, currentYear]
  );

  const userVolumes = await query<{ last_read_at: Date | null }>(
    `
      SELECT last_read_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND is_read = TRUE
    `,
    [userId]
  );

  const goal = challenge?.goal ?? 0;
  const progress = userVolumes.filter((vol) => {
    if (!vol.last_read_at) return false;
    return new Date(vol.last_read_at).getFullYear() === currentYear;
  }).length;
  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  return { goal, progress, percentage };
});

export async function getChallengeData(user: Session | null) {
  if (!user) return null;

  const currentYear = new Date().getFullYear();

  try {
    return await resolveChallengeData(user.id, currentYear);
  } catch (error) {
    if (isTransientDatabaseConnectionError(error)) {
      console.warn(
        "[bunko/db] Challenge data unavailable:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }

    throw error;
  }
}
