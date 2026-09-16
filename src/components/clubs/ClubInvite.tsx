"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinClubAsGuest, joinClubWithSession } from "@/actions/clubs";
import Button from "@/components/ui/Button";
import type { Dictionary } from "@/lib/types";

export default function ClubInvite({ token, clubName, lang, signedIn, intl }: { token: string; clubName: string; lang: string; signedIn: boolean; intl: Dictionary }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const labels = intl.clubs as Record<string, string>;
  const joinMember = async () => { const result = await joinClubWithSession(token); if (!result.success) setError(result.error); else router.push(`/${lang}/clubs/${result.slug}`); };
  const joinGuest = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const result = await joinClubAsGuest({ token, username: String(data.get("username")), password: String(data.get("password")) }); if (!result.success) setError(result.error); else router.push(`/${lang}/clubs/${result.slug}`); };
  if (signedIn) return <div className="p-4"><div className="bg-blackamber p-4 rounded-lg max-w-xl space-y-4"><p className="text-xs uppercase text-sand">{labels.inviteLabel}</p><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{clubName}</h1><p>{labels.invitePending}</p>{error && <p className="text-danger-alt">{error}</p>}<Button variant="lightAlt" onClick={joinMember} className="px-8 py-4">{labels.requestJoin}</Button></div></div>;

  return <div className="mx-auto mt-8 w-full max-w-sm px-4"><p className="text-xs uppercase text-sand">{labels.inviteLabel}</p><h1 className="mt-2 text-2xl leading-11 md:text-3xl md:leading-14">{clubName}</h1><p className="mt-4">{labels.invitePending}</p>{error && <p className="mt-4 text-danger-alt">{error}</p>}<form onSubmit={joinGuest} className="mt-6 w-full"><p className="mb-4 font-bold">{labels.joinGuest}</p><div className="mb-4"><input name="username" minLength={3} required autoComplete="username" placeholder={labels.username} className="w-full rounded-lg border border-neutral-700 bg-onix px-5 py-3 text-sand" /></div><div className="mb-4"><input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder={labels.password} className="w-full rounded-lg border border-neutral-700 bg-onix px-5 py-3 text-sand" /></div><Button variant="dark" className="px-8 py-4">{labels.createGuest}</Button></form></div>;
}
