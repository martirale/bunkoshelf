"use client";

import Image from "next/image";
import Link from "next/link";
import { UsersRoundIcon, XIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClub, requestToJoinClub } from "@/actions/clubs";
import type { ReadingClub } from "@/lib/db/clubs";
import type { Dictionary } from "@/lib/types";

export default function ClubList({ clubs, lang, canCreate, isAdmin, intl }: { clubs: ReadingClub[]; lang: string; canCreate: boolean; isAdmin: boolean; intl: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const labels = intl.clubs as Record<string, string>;
  const alerts = intl.alerts as Record<string, string>;

  useEffect(() => {
    setName("");
    setDescription("");
    setError("");
    setMessage("");
    setIsCreateDialogOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isCreateDialogOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCreateDialogOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isCreateDialogOpen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await createClub({ name, description });
    if (!result.success) return setError(result.error);
    setIsCreateDialogOpen(false);
    router.push(`/${lang}/clubs/${result.slug}`);
    router.refresh();
  };

  const requestJoin = async (slug: string) => {
    const result = await requestToJoinClub(slug);
    if (!result.success) return setMessage(result.error);
    setMessage(labels.invitePending);
    router.refresh();
  };

  return <div className="space-y-8 p-4">
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{labels.title}</h1><p className="mt-2">{labels.intro}</p></div>{canCreate && <button onClick={() => setIsCreateDialogOpen(true)} className="shrink-0 cursor-pointer rounded-lg border border-sand bg-sand px-5 py-3 font-bold uppercase leading-none text-onix transition-all duration-300 hover:border-onix hover:bg-onix hover:text-sand">{labels.create}</button>}</header>
    {message && <p className="text-danger-alt">{message}</p>}
    {isCreateDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsCreateDialogOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="create-club-title" className="w-full max-w-xl rounded-xl border-2 border-onix bg-pearl p-6 text-onix shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between gap-4"><h2 id="create-club-title">{labels.createTitle}</h2><button type="button" onClick={() => setIsCreateDialogOpen(false)} aria-label={alerts.cancel} className="cursor-pointer transition-colors hover:text-lilah"><XIcon size={24} /></button></div><form onSubmit={submit} className="mt-4 grid gap-4"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.clubName} className="w-full rounded-lg border border-onix bg-pearl px-5 py-3 transition-all duration-300 hover:border-lilah" required autoFocus /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={labels.description} className="w-full rounded-lg border border-onix bg-pearl px-5 py-3 transition-all duration-300 hover:border-lilah" />{error && <p className="text-danger-alt">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateDialogOpen(false)} className="cursor-pointer rounded-lg border border-onix px-5 py-3 font-bold uppercase leading-none transition-colors hover:bg-sand">{alerts.cancel}</button><button className="cursor-pointer rounded-lg border border-onix bg-onix px-5 py-3 font-bold uppercase leading-none text-pearl transition-colors hover:border-black hover:bg-black">{labels.create}</button></div></form></section></div>}
    <section className="grid gap-4 sm:grid-cols-2">
      {clubs.map((club) => {
        const canAccess = isAdmin || club.membershipStatus === "APPROVED";
        const isPending = club.membershipStatus === "PENDING";
        const content = <><div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md bg-onix"><Image src={club.workCover || "/placeholder.svg?=v1"} alt={`Cover for ${club.workTitle ?? club.name}`} fill sizes="80px" className="object-cover" /></div><div className="min-w-0"><p className="text-xs uppercase text-sand">{club.status === "ACTIVE" ? labels.active : labels.archived}</p><h2 className="mt-2 truncate">{club.name}</h2>{club.workTitle && <p className="mt-1 truncate text-sm text-sand">{club.workTitle}</p>}{club.description && <p className="mt-2 line-clamp-2">{club.description}</p>}<p className="mt-3 flex items-center gap-2 text-sm text-sand"><UsersRoundIcon size={16} />{club.participantCount} {labels.participants}</p></div></>;
        return <article key={club.id} className="rounded-lg bg-blackamber p-4">{canAccess ? <Link href={`/${lang}/clubs/${club.slug}`} className="flex gap-4 transition-all duration-300 hover:text-lilah">{content}</Link> : <div className="flex gap-4">{content}</div>}{!canAccess && club.status === "ACTIVE" && <div className="mt-4">{isPending ? <p className="text-sm text-sand">{labels.invitePending}</p> : <button onClick={() => void requestJoin(club.slug)} className="cursor-pointer rounded-lg border border-sand bg-sand px-4 py-2 text-sm font-bold uppercase leading-none text-onix transition-all duration-300 hover:border-onix hover:bg-onix hover:text-sand">{labels.requestJoin}</button>}</div>}</article>;
      })}
      {!clubs.length && <p>{labels.empty}</p>}
    </section>
  </div>;
}
