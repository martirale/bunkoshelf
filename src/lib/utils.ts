import prisma from "./prisma";
import type { Session } from "@/lib/types";

export function sortByPaddedTitle<T>(
  items: T[],
  getValue: (item: T) => string = (item) => (item as { title: string }).title
): T[] {
  const padNumbers = (str: string) =>
    str.replace(/\d+/g, (num) => num.padStart(5, "0")).toLowerCase();

  return items.slice().sort((a, b) => {
    const aStr = padNumbers(getValue(a));
    const bStr = padNumbers(getValue(b));
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
  const currentYear = new Date().getFullYear();

  const challenge = await prisma.readingChallenge.findFirst({
    where: { userId: user.id, year: currentYear },
  });
  const userVolumes = await prisma.userToVolume.findMany({
    where: { userId: user.id, isRead: true },
    select: { isRead: true, lastReadAt: true },
  });

  const goal = challenge?.goal ?? 0;
  const progress = userVolumes.filter((vol) => {
    if (!vol.lastReadAt) return false;
    return new Date(vol.lastReadAt).getFullYear() === currentYear;
  }).length;
  const percentage = goal === 0 ? 0 : Math.min((progress / goal) * 100, 100);

  return { goal, progress, percentage };
}
