"use server";

import { cookies } from "next/headers";

export async function checkSession() {
  const cookiesInstance = await cookies();
  const session = cookiesInstance.get("yomimono_key");

  if (session) {
    return { loggedIn: true };
  }
  return { error: "Unauthorized", status: 401 };
}
