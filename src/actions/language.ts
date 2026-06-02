"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/types";

export async function setLanguage(lang: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang, {
    path: "/",
  });
}
