"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckIcon, CopyIcon } from "lucide-react";
import {
  addClubCandidate,
  addClubMember,
  addClubMilestone,
  archiveClub,
  completeClubCycle,
  confirmClubCandidates,
  createClubCycle,
  deleteClub,
  removeClubCandidate,
  removeClubMember,
  reviewClubMember,
  selectClubWork,
  voteForClubCandidate,
} from "@/actions/clubs";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import Button from "@/components/ui/Button";
import type {
  ClubCandidate,
  ClubCycle,
  ClubMember,
  ClubUser,
  ReadingClub,
  ClubSourceType,
} from "@/lib/db/clubs";
import type { Dictionary } from "@/lib/types";

type Work = {
  id: string;
  title: string;
  section: string;
  type: ClubSourceType;
  is_oneshot: boolean;
};
type Milestone = {
  id: string;
  position: number;
  label: string;
  target_date: string;
};

function displayName(name: string | null, lastname: string | null, username: string) {
  return [name, lastname].filter(Boolean).join(" ") || username;
}

export default function ClubDashboard({
  club,
  cycles,
  members,
  activities,
  activeCandidates,
  milestones,
  works,
  readingVolumes,
  users,
  isManager,
  inviteToken,
  lang,
  intl,
}: {
  club: ReadingClub;
  cycles: ClubCycle[];
  members: ClubMember[];
  activities: Array<{
    id: string;
    type: string;
    created_at: Date;
    username: string;
    name: string | null;
    lastname: string | null;
    label: string | null;
  }>;
  activeCandidates: ClubCandidate[];
  milestones: Milestone[];
  works: Work[];
  readingVolumes: Array<{
    slug: string;
    title: string;
    kind: string;
    manga_style: string | null;
  }>;
  users: ClubUser[];
  isManager: boolean;
  inviteToken: string | null;
  lang: string;
  intl: Dictionary;
}) {
  const router = useRouter();
  const { confirm } = useAlertDialog()!;
  const [inviteCopied, setInviteCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [message, setMessage] = useState("");
  const [candidateValues, setCandidateValues] = useState<string[]>([""]);
  const labels = intl.clubs as Record<string, string>;
  const errorMessage = (value: string) =>
    value === "Voting must be closed before choosing a work"
      ? labels.votingMustClose
      : labels[value] ?? value;
  const bookLabels = intl.books as Record<string, string>;
  const libraryLabels = intl.libraries as Record<string, string>;
  const mangaLabels = intl.manga as Record<string, string>;
  const sidebarLabels = intl.sidebar as Record<string, string>;
  const active = cycles.find((cycle) => cycle.status === "READING");
  const draft = cycles.find((cycle) => cycle.status === "DRAFT");
  const voting = cycles.find((cycle) => cycle.status === "VOTING");
  const invite = inviteToken
    ? `${origin}/${lang}/clubs/join/${inviteToken}`
    : "";
  const refresh = () => router.refresh();
  const availableUsers = users.filter(
    (user) => !members.some(
      (member) => member.userId === user.id && ["APPROVED", "PENDING"].includes(member.status),
    ),
  );
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(invite, window.location.origin).toString(),
      );
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1800);
    } catch {
      setMessage(labels.copyInviteFailed);
    }
  };
  const submitCycle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createClubCycle(club.slug, {
      title: String(data.get("title")),
      voteClosesAt: String(data.get("voteClosesAt") || ""),
    });
    if (!result.success) setMessage(errorMessage(result.error));
    else {
      form.reset();
      refresh();
    }
  };
  const submitMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get("userId") ?? "");
    const result = await addClubMember(club.slug, userId);
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const submitMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await addClubMilestone(club.slug, active.id, {
      label: String(data.get("label")),
      position: Number(data.get("position")),
      targetDate: String(data.get("targetDate")),
    });
    if (!result.success) setMessage(errorMessage(result.error));
    else {
      form.reset();
      refresh();
    }
  };
  const selectWork = async (cycle: ClubCycle, value: string) => {
    const [sourceType, sourceId] = value.split(":") as [ClubSourceType, string];
    const result =
      cycle.status === "VOTING"
        ? await addClubCandidate(club.slug, cycle.id, sourceType, sourceId)
        : await selectClubWork(club.slug, cycle.id, sourceType, sourceId);
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const memberStatus = (status: ClubMember["status"]) =>
    labels[status.toLowerCase()];
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setCandidateValues([""]), [draft?.id]);
  const titleCase = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const workSectionLabel = (type: ClubSourceType, section: string | null) =>
    type === "BOOK_SERIES"
      ? bookLabels.book
      : section === "comic"
        ? sidebarLabels.comic.replace(/s$/, "")
        : libraryLabels.manga;
  const workConditionLabel = (
    type: ClubSourceType,
    section: string | null,
    isOneshot: boolean,
  ) =>
    isOneshot
      ? type === "BOOK_SERIES"
        ? mangaLabels.othersOneshot
        : section === "comic"
          ? mangaLabels.comicOneshot
          : mangaLabels.oneshot
      : mangaLabels.series.replace(/:$/, "");
  const workLabel = (
    work: Pick<Work, "title" | "type" | "section" | "is_oneshot">,
  ) =>
    `${work.title} · ${titleCase(workSectionLabel(work.type, work.section))} · ${titleCase(workConditionLabel(work.type, work.section, work.is_oneshot))}`;
  const candidateLabel = (candidate: ClubCandidate) =>
    `${candidate.title ?? "—"} · ${titleCase(workSectionLabel(candidate.source_type, candidate.section))} · ${titleCase(workConditionLabel(candidate.source_type, candidate.section, candidate.is_oneshot))}`;
  const workValue = (work: Pick<Work, "type" | "id">) =>
    `${work.type}:${work.id}`;
  const readingWorkValues = new Set(
    cycles
      .filter(
        (cycle) =>
          cycle.status === "READING" && cycle.selectedType && cycle.selectedId,
      )
      .map((cycle) => `${cycle.selectedType}:${cycle.selectedId}`),
  );
  const draftWorks = (index: number) =>
    works.filter(
      (work) =>
        !readingWorkValues.has(workValue(work)) &&
        !candidateValues.some(
          (value, candidateIndex) =>
            candidateIndex !== index && value === workValue(work),
        ),
    );
  const votingWorks = works.filter(
    (work) =>
      !readingWorkValues.has(workValue(work)) &&
      !activeCandidates.some(
        (candidate) =>
          `${candidate.source_type}:${candidate.source_id}` === workValue(work),
      ),
  );
  const voteForCandidate = async (candidate: ClubCandidate) => {
    if (!voting) return;
    const result = await voteForClubCandidate(
      club.slug,
      voting.id,
      candidate.id,
    );
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const chooseCandidate = async (candidate: ClubCandidate) => {
    if (!voting) return;
    const result = await selectClubWork(
      club.slug,
      voting.id,
      candidate.source_type,
      candidate.source_id,
    );
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const confirmCandidateRemoval = async (candidateId: string) => {
    if (
      !voting ||
      !(await confirm({
        title: labels.removeCandidateTitle,
        description: labels.removeCandidateDescription,
        confirmLabel: labels.removeCandidate,
        destructive: true,
      }))
    )
      return;
    const result = await removeClubCandidate(club.slug, voting.id, candidateId);
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const confirmMemberRemoval = async (memberId: string) => {
    if (
      !(await confirm({
        title: labels.removeMemberTitle,
        description: labels.removeMemberDescription,
        confirmLabel: labels.removeMember,
        destructive: true,
      }))
    )
      return;
    const result = await removeClubMember(club.slug, memberId);
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const confirmArchive = async () => {
    if (
      !(await confirm({
        title: labels.archiveTitle,
        description: labels.archiveDescription,
        confirmLabel: labels.archive,
        destructive: true,
      }))
    )
      return;
    const result = await archiveClub(club.slug);
    if (!result.success) setMessage(errorMessage(result.error));
    else refresh();
  };
  const confirmClubDeletion = async () => {
    if (
      !(await confirm({
        title: labels.deleteClubTitle,
        description: labels.deleteClubDescription,
        confirmLabel: labels.deleteClub,
        destructive: true,
        irreversible: true,
      }))
    )
      return;
    const result = await deleteClub(club.slug);
    if (!result.success) return setMessage(errorMessage(result.error));
    router.push(`/${lang}/clubs`);
    router.refresh();
  };
  return (
    <div className="p-4 space-y-6">
      <header className="flex justify-between gap-4 items-start">
        <div>
          <p className="text-sm uppercase text-sand">{labels.clubLabel}</p>
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">
            {club.name}
          </h1>
          {club.description && <p className="mt-2">{club.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {club.status === "ARCHIVED" && (
            <span className="bg-neutral-700 rounded-md px-3 py-1 text-xs uppercase">
              {labels.archived}
            </span>
          )}
          {isManager && club.status === "ARCHIVED" && (
            <button
              onClick={confirmClubDeletion}
              className="text-xs uppercase text-danger-alt hover:underline cursor-pointer"
            >
              {labels.deleteClub}
            </button>
          )}
        </div>
      </header>
      {message && <p className="text-danger-alt">{message}</p>}
      {active && (
        <section className="rounded-lg bg-blackamber p-4">
          <div className="flex gap-4">
            <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md bg-onix">
              <Image
                src={active.workCover || "/placeholder.svg?=v1"}
                alt={`Cover for ${active.workTitle ?? active.title}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase text-sand">{labels.readingNow}</p>
              <h2 className="mt-2">{active.workTitle ?? active.title}</h2>
              <p className="mt-2">{labels.readingPace}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded bg-onix">
                  <div
                    className="h-full rounded bg-lilah"
                    style={{ width: `${milestone.position}%` }}
                  />
                </div>
                <span className="w-14 text-right">{milestone.position}%</span>
                <span>
                  {milestone.label} · {milestone.target_date}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {readingVolumes.map((volume) => (
              <Link
                key={volume.slug}
                href={`/${lang}/clubs/${club.slug}/read/${volume.kind}/${volume.slug}`}
                className="font-bold px-5 py-2 rounded-lg leading-none uppercase text-sand bg-onix border border-onix hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
              >
                {labels.read} {volume.title}
              </Link>
            ))}
          </div>
          {isManager && (
            <Button
              variant="accent"
              onClick={async () => {
                const result = await completeClubCycle(club.slug, active.id);
                if (!result.success) setMessage(errorMessage(result.error));
                else refresh();
              }}
              className="mt-5 px-4 py-2 text-xs"
            >
              {labels.finishCycle}
            </Button>
          )}
        </section>
      )}
      {voting && (
        <section className="bg-blackamber p-4 rounded-lg">
          <p className="text-xs uppercase text-sand">{labels.voting}</p>
          <h2 className="mt-2">{voting.title}</h2>
          <p>
            {labels.closes}:{" "}
            {voting.voteClosesAt
              ? new Date(voting.voteClosesAt).toLocaleDateString(lang)
              : labels.noDate}
          </p>
          <div className="mt-4 grid gap-2">
            {activeCandidates.map((candidate) => (
              <div
                key={candidate.id}
                role="button"
                tabIndex={0}
                aria-label={`${labels.voting}: ${candidate.title ?? "—"}`}
                onClick={() => void voteForCandidate(candidate)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void voteForCandidate(candidate);
                  }
                }}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-onix px-4 py-3 transition-colors hover:bg-neutral-700"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-blackamber">
                    <Image
                      src={candidate.cover || "/placeholder.svg?=v1"}
                      alt={`Cover for ${candidate.title ?? ""}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <p className="min-w-0 text-left">
                    {candidateLabel(candidate)}{" "}
                    <span className="text-sand">
                      · {candidate.votes} {labels.votes}
                    </span>
                  </p>
                </div>
                {isManager && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    className="flex shrink-0 items-center gap-4"
                  >
                    <button
                      onClick={() => void chooseCandidate(candidate)}
                      className="text-xs uppercase hover:underline cursor-pointer"
                    >
                      {labels.choose}
                    </button>
                    <button
                      onClick={() => void confirmCandidateRemoval(candidate.id)}
                      className="text-xs uppercase text-danger-alt hover:underline cursor-pointer"
                    >
                      {labels.removeCandidate}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="min-w-0 min-h-44 bg-blackamber p-4 rounded-lg">
          <h2>{labels.participants}</h2>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex gap-3 items-center">
                <div className="flex-1">
                  <p>{displayName(member.name, member.lastname, member.username)}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-xs uppercase text-sand">
                      {memberStatus(member.status)}
                    </p>
                    {isManager &&
                      member.status === "APPROVED" &&
                      member.userId !== club.ownerId && (
                        <button
                          onClick={() => void confirmMemberRemoval(member.id)}
                          className="text-xs uppercase text-danger-alt hover:underline cursor-pointer"
                        >
                          {labels.remove}
                        </button>
                      )}
                  </div>
                  {member.status === "APPROVED" && (
                    <div className="h-2 bg-onix rounded mt-1">
                      <div
                        className="h-full bg-lilah rounded"
                        style={{
                          width: `${Math.round((member.progress ?? 0) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <span>
                  {member.status === "APPROVED"
                    ? `${Math.round((member.progress ?? 0) * 100)}%`
                    : ""}
                </span>
                {isManager && member.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const result = await reviewClubMember(
                          club.slug,
                          member.id,
                          "APPROVED",
                        );
                        if (!result.success) setMessage(errorMessage(result.error));
                        else refresh();
                      }}
                      className="text-xs uppercase hover:underline cursor-pointer"
                    >
                      {labels.accept}
                    </button>
                    <button
                      onClick={async () => {
                        const result = await reviewClubMember(
                          club.slug,
                          member.id,
                          "REJECTED",
                        );
                        if (!result.success) setMessage(errorMessage(result.error));
                        else refresh();
                      }}
                      className="text-xs uppercase text-danger-alt hover:underline cursor-pointer"
                    >
                      {labels.reject}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 min-h-44 bg-blackamber p-4 rounded-lg">
          <h2>{labels.activity}</h2>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <p key={activity.id}>
                <span className="font-bold">
                  {displayName(activity.name, activity.lastname, activity.username)}
                </span>{" "}
                {activity.type === "COMPLETED"
                  ? labels.completedReading
                  : `${labels.reachedMilestone} ${activity.label ?? ""}`}
                .
              </p>
            ))}
            {!activities.length && <p>{labels.noActivity}</p>}
          </div>
        </div>
      </section>
      {isManager && club.status === "ACTIVE" && (
        <section className="bg-blackamber p-4 rounded-lg space-y-4">
          <h2>{labels.manage}</h2>
          {invite && (
            <button
              type="button"
              onClick={() => void copyInvite()}
              title={inviteCopied ? labels.inviteCopied : labels.copyInvite}
              aria-label={
                inviteCopied ? labels.inviteCopied : labels.copyInvite
              }
              className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg border border-neutral-700 bg-onix px-5 text-left text-lg text-sand transition-colors duration-300 hover:border-pearl"
            >
              <span className="min-w-0 flex-1 truncate">{invite}</span>
              {inviteCopied ? (
                <CheckIcon size={20} className="shrink-0 text-lilah" />
              ) : (
                <CopyIcon size={20} className="shrink-0" />
              )}
            </button>
          )}
          {availableUsers.length > 0 && (
            <form onSubmit={submitMember} className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
              <select name="userId" aria-label={labels.selectUser} defaultValue="" required className="h-14 rounded-lg border border-neutral-700 bg-onix px-5 text-sand">
                <option value="" disabled>{labels.selectUser}</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>{`${displayName(user.name, user.lastname, user.username)} (@${user.username})`} · {user.role}</option>
                ))}
              </select>
              <Button variant="lightAlt" className="px-8 py-4">{labels.addMember}</Button>
            </form>
          )}
          <form
            onSubmit={submitCycle}
            className="grid gap-4 xl:grid-cols-2 xl:items-end"
          >
            <input
              name="title"
              required
              placeholder={labels.nextCycle}
              className="h-14 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
            />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="grid gap-2 text-sm uppercase">
                {labels.voteDeadlineOptional}
                <input
                  name="voteClosesAt"
                  type="date"
                  className="h-14 text-lg text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
                />
              </label>
              <Button variant="light" className="h-14 px-5">
                {labels.createCycle}
              </Button>
            </div>
          </form>
          {draft && (
            <div className="space-y-3 pt-2">
              <p>{draft.title}</p>
              {candidateValues.map((value, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={value}
                    onChange={(event) =>
                      setCandidateValues((values) =>
                        values.map((candidate, candidateIndex) =>
                          candidateIndex === index
                            ? event.target.value
                            : candidate,
                        ),
                      )
                    }
                    className="h-14 flex-1 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
                  >
                    <option value="">{labels.chooseWork}</option>
                    {draftWorks(index).map((work) => (
                      <option
                        key={`${work.type}:${work.id}`}
                        value={`${work.type}:${work.id}`}
                      >
                        {workLabel(work)}
                      </option>
                    ))}
                  </select>
                  {candidateValues.length > 1 && (
                    <button
                      onClick={() =>
                        setCandidateValues((values) =>
                          values.filter(
                            (_, candidateIndex) => candidateIndex !== index,
                          ),
                        )
                      }
                      className="text-xs uppercase text-danger-alt hover:underline cursor-pointer"
                    >
                      {labels.removeCandidate}
                    </button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="dark"
                  onClick={() =>
                    setCandidateValues((values) => [...values, ""])
                  }
                  className="px-4 py-2"
                >
                  {labels.addCandidate}
                </Button>
                <Button
                  variant="light"
                  onClick={async () => {
                    const uniqueValues = new Set(candidateValues);
                    if (
                      candidateValues.some((value) => !value) ||
                      uniqueValues.size !== candidateValues.length
                    )
                      return setMessage(labels.chooseDifferentWorks);
                    if (
                      candidateValues.length > 1 &&
                      (!draft.voteClosesAt ||
                        new Date(draft.voteClosesAt) <= new Date())
                    )
                      return setMessage(labels.voteDeadlineRequired);
                    const candidates = candidateValues.map((value) => {
                      const [sourceType, sourceId] = value.split(":") as [
                        ClubSourceType,
                        string,
                      ];
                      return { sourceType, sourceId };
                    });
                    const result = await confirmClubCandidates(
                      club.slug,
                      draft.id,
                      candidates,
                    );
                    if (!result.success) setMessage(errorMessage(result.error));
                    else refresh();
                  }}
                  className="px-4 py-2"
                >
                  {candidateValues.length === 1
                    ? labels.confirmReading
                    : labels.startVote}
                </Button>
              </div>
            </div>
          )}
          {voting && (
            <div className="pt-2">
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value)
                    void selectWork(voting, event.target.value);
                }}
                className="h-14 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
              >
                <option value="">{labels.addCandidate}</option>
                {votingWorks.map((work) => (
                  <option
                    key={`${work.type}:${work.id}`}
                    value={`${work.type}:${work.id}`}
                  >
                    {workLabel(work)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => void confirmArchive()}
              className="w-fit text-xs uppercase text-danger-alt hover:underline cursor-pointer"
            >
              {labels.archive}
            </button>
            <button
              onClick={() => void confirmClubDeletion()}
              className="w-fit text-xs uppercase text-danger-alt hover:underline cursor-pointer"
            >
              {labels.deleteClub}
            </button>
          </div>
        </section>
      )}
      <section className="bg-blackamber p-4 rounded-lg">
        <h2>{labels.milestones}</h2>
        {active ? (
          <form onSubmit={submitMilestone} className="mt-4 grid gap-3">
            <input
              name="label"
              required
              placeholder={labels.milestoneLabel}
              className="h-14 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
            />
            <div className="grid gap-3 md:grid-cols-[10rem_minmax(12rem,1fr)_auto] md:items-end">
              <input
                name="position"
                type="number"
                min="1"
                max="100"
                required
                placeholder={labels.milestonePosition}
                className="h-14 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
              />
              <input
                name="targetDate"
                type="date"
                required
                className="h-14 text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 transition-all duration-300"
              />
              <Button variant="dark" className="h-14 px-5">
                {labels.addMilestone}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-4">{labels.selectWorkForMilestones}</p>
        )}
      </section>
    </div>
  );
}
