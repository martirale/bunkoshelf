import type { Session } from "./types/auth.ts";
import { getBookAgeMinimum } from "./books/metadata.ts";
import { ageRatingMap } from "./mangaMetadata.ts";

export type ParentalControlMode = "flexible" | "strict";

export interface ContentVisibilityPolicy {
  enabled: boolean;
  maxAge: number | null;
  allowUnrated: boolean;
}

function getExactAge(user: Session, now = new Date()): number | null {
  if (user.birthYear === null) return null;

  let age = now.getFullYear() - user.birthYear;
  if (user.birthMonth !== null && user.birthDay !== null) {
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (month < user.birthMonth || (month === user.birthMonth && day < user.birthDay)) {
      age -= 1;
    }
  }

  return age;
}

export function getContentVisibilityPolicy(
  user: Session | null,
  globallyEnabled: boolean,
  globalMode: ParentalControlMode = "flexible",
  now = new Date()
): ContentVisibilityPolicy {
  if (!globallyEnabled || !user) {
    return { enabled: false, maxAge: null, allowUnrated: true };
  }

  if (user.role === "GUEST") {
    return globalMode === "strict"
      ? { enabled: true, maxAge: 15, allowUnrated: false }
      : { enabled: true, maxAge: 17, allowUnrated: true };
  }

  const age = getExactAge(user, now);
  if (age === null) return { enabled: true, maxAge: 15, allowUnrated: false };
  if (age < 18) return {
    enabled: true,
    maxAge: globalMode === "strict" ? Math.min(Math.max(0, age), 15) : Math.max(0, age),
    allowUnrated: globalMode === "flexible",
  };
  if (!user.parentalControlEnabled) return { enabled: false, maxAge: null, allowUnrated: true };
  if (user.parentalControlMode === "strict") return { enabled: true, maxAge: 15, allowUnrated: false };
  return { enabled: true, maxAge: 17, allowUnrated: true };
}

export function canViewAgeRating(
  ageRating: string | null | undefined,
  library: "book" | "manga",
  policy: ContentVisibilityPolicy
): boolean {
  if (!policy.enabled) return true;
  const minimum = library === "book" ? getBookAgeMinimum(ageRating) : ageRatingMap(ageRating);
  if (minimum === null) return policy.allowUnrated;
  return minimum <= (policy.maxAge ?? 18);
}

export function isAdult(user: Session, now = new Date()): boolean {
  const age = getExactAge(user, now);
  return age !== null && age >= 18;
}
