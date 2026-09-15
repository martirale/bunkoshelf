"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClub } from "@/actions/clubs";
import type { ReadingClub } from "@/lib/db/clubs";
import type { Dictionary } from "@/lib/types";

export default function ClubList({ clubs, lang, canCreate, intl }: { clubs: ReadingClub[]; lang: string; canCreate: boolean; intl: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const labels = intl.clubs as Record<string, string>;
  useEffect(() => {
    setName("");
    setDescription("");
    setError("");
  }, [pathname]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await createClub({ name, description });
    if (!result.success) return setError(result.error);
    router.push(`/${lang}/clubs/${result.slug}`);
    router.refresh();
  };
  return <div className="p-4 space-y-8">
    <header><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{labels.title}</h1><p className="mt-2">{labels.intro}</p></header>
    {canCreate && <form onSubmit={submit} className="bg-blackamber p-4 rounded-lg grid gap-4">
      <h2>{labels.createTitle}</h2>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.clubName} className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300" required />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={labels.description} className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300" />
      {error && <p className="text-danger-alt">{error}</p>}
      <button className="w-fit font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer">{labels.create}</button>
    </form>}
    <section className="grid sm:grid-cols-2 gap-4">
      {clubs.map((club) => <Link key={club.id} href={`/${lang}/clubs/${club.slug}`} className="bg-blackamber p-4 rounded-lg hover:bg-onix transition-all duration-300">
        <p className="text-xs uppercase text-sand">{club.status === "ACTIVE" ? labels.active : labels.archived}</p><h2 className="mt-2">{club.name}</h2>{club.description && <p className="mt-2">{club.description}</p>}
      </Link>)}
      {!clubs.length && <p>{labels.empty}</p>}
    </section>
  </div>;
}
