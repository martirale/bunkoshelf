"use server";

import { cookies } from "next/headers";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("yomimono_key", "", {
    path: "/",
    expires: new Date(0),
  });

  return { success: true };
}
