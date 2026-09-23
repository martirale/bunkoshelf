"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinClubAsGuest, joinClubWithSession } from "@/actions/clubs";
import Button from "@/components/ui/Button";
import { useResourceMutation } from "@/lib/client/resourceState";
import type { Dictionary } from "@/lib/types";

export default function ClubInvite({ token, clubName, lang, signedIn, intl }: { token: string; clubName: string; lang: string; signedIn: boolean; intl: Dictionary }) {
  const router = useRouter();
  const mutateResource = useResourceMutation();
  const [error, setError] = useState("");
  const labels = intl.clubs as Record<string, string>;
  const errorMessage = (value: string) => labels[value] ?? value;
  const mutateClub = <T extends { success: boolean }>(mutate: () => Promise<T>) => mutateResource({ resource: "club", id: token, patch: {}, mutate, isSuccess: (result) => result.success, refresh: false });
  const joinMember = async () => { const result = await mutateClub(() => joinClubWithSession(token)); if (!result.success) setError(errorMessage(result.error)); else router.push(`/${lang}/clubs/${result.slug}`); };
  const joinGuest = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const result = await mutateClub(() => joinClubAsGuest({ token, name: String(data.get("name")), lastname: String(data.get("lastname")), password: String(data.get("password")) })); if (!result.success) setError(errorMessage(result.error)); else router.push(`/${lang}/clubs/${result.slug}`); };
  if (signedIn) return <div className="p-4"><div className="bg-blackamber p-4 rounded-lg max-w-xl space-y-4"><p className="text-xs uppercase text-sand">{labels.inviteLabel}</p><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{clubName}</h1><p>{labels.invitePending}</p>{error && <p className="text-danger-alt">{error}</p>}<Button variant="lightAlt" onClick={joinMember} className="px-8 py-4">{labels.requestJoin}</Button></div></div>;

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4 md:mt-16">
      <div className="grid gap-8 md:grid-cols-2 md:gap-16">
        <div className="max-w-md">
          <p className="text-xs uppercase text-sand">{labels.inviteLabel}</p>
          <h1 className="mt-2 text-2xl leading-11 md:text-3xl md:leading-14">
            {clubName}
          </h1>
          <p className="mt-4">{labels.invitePending}</p>
          {error && <p className="mt-4 text-danger-alt">{error}</p>}
        </div>
        <form onSubmit={joinGuest} className="w-full md:pt-2">
          <p className="mb-4 font-bold">{labels.joinGuest}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              required
              autoComplete="given-name"
              placeholder={labels.name}
              className="w-full rounded-lg border border-neutral-700 bg-onix px-5 py-3 text-sand"
            />
            <input
              name="lastname"
              required
              autoComplete="family-name"
              placeholder={labels.lastname}
              className="w-full rounded-lg border border-neutral-700 bg-onix px-5 py-3 text-sand"
            />
          </div>
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            placeholder={labels.password}
            className="mt-4 w-full rounded-lg border border-neutral-700 bg-onix px-5 py-3 text-sand"
          />
          <Button variant="dark" className="mt-4 w-full px-8 py-4">
            {labels.createGuest}
          </Button>
        </form>
      </div>
    </div>
  );
}
