import "server-only";

import { verifySession } from "@/lib/auth/verifySession";
import { getAppSettings } from "@/lib/db/appSettings";
import { canViewAgeRating, getContentVisibilityPolicy, type ContentVisibilityPolicy } from "@/lib/parentalControl";

export async function getCurrentContentVisibilityPolicy(): Promise<ContentVisibilityPolicy> {
  const [user, settings] = await Promise.all([verifySession(), getAppSettings()]);
  return getContentVisibilityPolicy(user, settings.parentalControlEnabled, settings.parentalControlMode);
}

export async function canViewMangaAgeRating(ageRating: string | null | undefined): Promise<boolean> {
  return canViewAgeRating(ageRating, "manga", await getCurrentContentVisibilityPolicy());
}

export async function canViewBookAgeRating(ageRating: string | null | undefined): Promise<boolean> {
  return canViewAgeRating(ageRating, "book", await getCurrentContentVisibilityPolicy());
}
