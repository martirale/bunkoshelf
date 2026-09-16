"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { updateParentalControlEnabled } from "@/lib/db/appSettings";
import { updateUserRecord } from "@/lib/db/users";
import { isAdult, type ParentalControlMode } from "@/lib/parentalControl";

export async function updateGlobalParentalControl(enabled: boolean, mode: ParentalControlMode, lang: string) {
  const user = await verifySession();
  if (!user) return { status: 401 };
  if (!user.isAdmin) return { status: 403 };
  await updateParentalControlEnabled(enabled, mode);
  revalidatePath(`/${lang}`, "layout");
  return { success: true };
}

export async function updatePersonalParentalControl(
  input: { enabled: boolean; mode: ParentalControlMode },
  lang: string,
) {
  const user = await verifySession();
  if (!user) return { status: 401 };
  if (!isAdult(user)) return { status: 403 };
  await updateUserRecord(user.id, {
    parentalControlEnabled: input.enabled,
    parentalControlMode: input.mode,
  });
  revalidatePath(`/${lang}`, "layout");
  return { success: true };
}
