"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinClubAsGuest, joinClubWithSession } from "@/actions/clubs";
import type { Dictionary } from "@/lib/types";

export default function ClubInvite({ token, clubName, lang, signedIn, intl }: { token: string; clubName: string; lang: string; signedIn: boolean; intl: Dictionary }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const labels = intl.clubs as Record<string, string>;
  const joinMember = async () => { const result = await joinClubWithSession(token); if (!result.success) setError(result.error); else router.push(`/${lang}/clubs/${result.slug}`); };
  const joinGuest = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const result = await joinClubAsGuest({ token, username: String(data.get("username")), password: String(data.get("password")) }); if (!result.success) setError(result.error); else router.push(`/${lang}/clubs/${result.slug}`); };
  return <div className="p-4"><div className="bg-blackamber p-4 rounded-lg max-w-xl space-y-4"><p className="text-xs uppercase text-sand">{labels.inviteLabel}</p><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{clubName}</h1><p>{labels.invitePending}</p>{error && <p className="text-danger-alt">{error}</p>}{signedIn ? <button onClick={joinMember} className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer">{labels.requestJoin}</button> : <form onSubmit={joinGuest} className="grid gap-4"><p className="font-bold">{labels.joinGuest}</p><input name="username" pattern="[A-Za-z0-9_-]{3,32}" required placeholder={labels.username} className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300" /><input name="password" type="password" minLength={8} required placeholder={labels.password} className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300" /><button className="w-fit font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer">{labels.createGuest}</button></form>}</div></div>;
}
