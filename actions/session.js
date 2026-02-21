"use server";

import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/verifySession";
import { getChallengeData } from "@/lib/utils";
import { getVersionInfo } from "@/lib/versionInfo";

export async function checkSession() {
  const cookiesInstance = await cookies();
  const session = cookiesInstance.get("yomimono_key");

  if (session) {
    return { loggedIn: true };
  }
  return { error: "Unauthorized", status: 401 };
}

export async function getSessionData() {
  const user = await verifySession();
  const challengeData = await getChallengeData(user);
  const versionData = await getVersionInfo();
  return { user, challengeData, versionData };
}
