"use client";

import Image from "next/image";
import Link from "next/link";
import { UsersRoundIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClub, requestToJoinClub } from "@/actions/clubs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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
  const bookLabels = intl.books as Record<string, string>;
  const libraryLabels = intl.libraries as Record<string, string>;
  const mangaLabels = intl.manga as Record<string, string>;
  const sidebarLabels = intl.sidebar as Record<string, string>;

  useEffect(() => {
    setName("");
    setDescription("");
    setError("");
    setMessage("");
    setIsCreateDialogOpen(false);
  }, [pathname]);

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

  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const workSectionLabel = (club: ReadingClub) => club.workSourceType === "BOOK_SERIES" ? bookLabels.book : club.workSection === "comic" ? sidebarLabels.comic.replace(/s$/, "") : libraryLabels.manga;
  const workConditionLabel = (club: ReadingClub) => club.workIsOneshot ? club.workSourceType === "BOOK_SERIES" ? mangaLabels.othersOneshot : club.workSection === "comic" ? mangaLabels.comicOneshot : mangaLabels.oneshot : mangaLabels.series.replace(/:$/, "");

  return <div className="space-y-8 p-4">
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{labels.title}</h1><p className="mt-2">{labels.intro}</p></div>{canCreate && <Button variant="light" onClick={() => setIsCreateDialogOpen(true)} className="shrink-0 px-5 py-3">{labels.create}</Button>}</header>
    {message && <p className="text-danger-alt">{message}</p>}
    <Modal isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
      <div className="max-w-7xl mx-auto p-2">
        <h2 className="mb-4">{labels.createTitle}</h2>
        <form onSubmit={submit} className="space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.clubName} className="w-full rounded-lg border border-onix bg-pearl px-5 py-3" required autoFocus />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={labels.description} className="w-full rounded-lg border border-onix bg-pearl px-5 py-3" />
          {error && <p className="text-danger-alt">{error}</p>}
          <Button variant="lightAlt" className="px-8 py-4">{labels.create}</Button>
        </form>
      </div>
    </Modal>
    <section className="grid gap-4 sm:grid-cols-2">
      {clubs.map((club) => {
        const canAccess = isAdmin || club.membershipStatus === "APPROVED";
        const isPending = club.membershipStatus === "PENDING";
        const content = (
          <>
            <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md bg-onix">
              <Image src={club.workCover || "/placeholder.svg?=v1"} alt={`Cover for ${club.workTitle ?? club.name}`} fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase text-sand">{club.status === "ACTIVE" ? labels.active : labels.archived}</p>
              <h2 className="mt-2 truncate">{club.name}</h2>
              {club.workTitle && (
                <div className="mt-1 min-w-0 text-sm text-sand">
                  <p className="truncate">{club.workTitle} <span>· {titleCase(workSectionLabel(club))} · {titleCase(workConditionLabel(club))}</span></p>
                  {club.workVotes !== null && <p className="mt-1">{club.workVotes} {labels.votes}</p>}
                </div>
              )}
              {club.description && <p className="mt-2 line-clamp-2">{club.description}</p>}
              <p className="mt-3 flex items-center gap-2 text-sm text-sand"><UsersRoundIcon size={16} />{club.participantCount} {labels.participants}</p>
            </div>
          </>
        );
        return <article key={club.id} className="rounded-lg bg-blackamber p-4">{canAccess ? <Link href={`/${lang}/clubs/${club.slug}`} className="flex gap-4 transition-all duration-300 hover:text-lilah">{content}</Link> : <div className="flex gap-4">{content}</div>}{!canAccess && club.status === "ACTIVE" && <div className="mt-4">{isPending ? <p className="text-sm text-sand">{labels.invitePending}</p> : <Button variant="lightAlt" onClick={() => void requestJoin(club.slug)} className="px-4 py-2 text-sm">{labels.requestJoin}</Button>}</div>}</article>;
      })}
      {!clubs.length && <p>{labels.empty}</p>}
    </section>
  </div>;
}
