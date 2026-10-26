"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { createLogicalSeries, updateLogicalSeries } from "@/actions/logical-series";
import { validateLogicalSeries, type LogicalSeriesMember, type LogicalSeriesOption, type LogicalSeriesSection, type LogicalSeriesDetails } from "@/lib/logicalSeries";
import { useToast } from "@/components/ToastProvider";
import type { Dictionary } from "@/lib/types";

export default function LogicalSeriesDialog({ intl, options, initialSeries }: { intl: Dictionary; options: LogicalSeriesOption[]; initialSeries?: LogicalSeriesDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(initialSeries?.title ?? "");
  const [section, setSection] = useState<LogicalSeriesSection>(initialSeries?.section ?? "manga");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<LogicalSeriesMember[]>(initialSeries?.members ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast()!;
  const labels = intl.catalog as Record<string, string>;
  const dialogTitle = initialSeries ? labels.editLogicalSeries : labels.createLogicalSeries;
  const unavailable = initialSeries ? labels.logicalSeriesUpdateUnavailable : labels.logicalSeriesUnavailable;
  const sections: Array<{ value: LogicalSeriesSection; label: string }> = [
    { value: "manga", label: labels.mangaColumn },
    { value: "comic", label: labels.comicColumn },
    { value: "books", label: labels.booksColumn },
    { value: "other", label: labels.othersColumn },
  ];
  const available = options.filter((option) => option.section === section);
  const matches = available.filter((option) => !members.some((member) => member.id === option.id)
    && option.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const ordered = [...members].sort((a, b) => a.position - b.position);
  const inputClass = "bg-pearl border border-onix rounded-lg w-full px-5 py-3";

  function open() {
    if (initialSeries) {
      setTitle(initialSeries.title);
      setSection(initialSeries.section);
      setMembers(initialSeries.members.map((member) => ({ ...member })));
      setSearch("");
      setError(null);
    }
    setIsOpen(true);
  }

  function close() {
    if (!pending) setIsOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { title, section, members };
    if (!validateLogicalSeries(input)) {
      setError(labels.logicalSeriesInvalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = initialSeries ? await updateLogicalSeries(initialSeries.id, input) : await createLogicalSeries(input);
      if (!result.ok) {
        setError(unavailable);
        return;
      }
      addToast({ title: dialogTitle, description: initialSeries ? labels.logicalSeriesUpdated : labels.logicalSeriesCreated, variant: "success" });
      setIsOpen(false);
      if (initialSeries) {
        const url = new URL(window.location.href);
        url.searchParams.delete("page");
        router.replace(`${url.pathname}${url.search}`);
      } else {
        setTitle("");
        setMembers([]);
        setSearch("");
      }
      router.refresh();
    } catch {
      setError(unavailable);
    } finally {
      setPending(false);
    }
  }

  return <>
    {initialSeries ? <button type="button" onClick={open} className="flex items-center gap-1 text-xs uppercase cursor-pointer hover:underline">
      <PencilIcon size={11} />{dialogTitle}
    </button> : <Button type="button" variant="light" size="small" onClick={open}>{dialogTitle}</Button>}
    <Modal isOpen={isOpen} onClose={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="logical-series-heading" className="max-w-7xl mx-auto p-2 max-h-[75dvh] overflow-y-auto">
        <h2 id="logical-series-heading" className="mb-4">{dialogTitle}</h2>
        <p className="mb-4 text-sm">{labels.logicalSeriesDescription}</p>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
            <div role="group" aria-label={labels.libraryColumn} className="flex flex-wrap gap-2">
              {sections.map((item) => <button
                key={item.value}
                type="button"
                aria-pressed={section === item.value}
                disabled={Boolean(initialSeries) && section !== item.value}
                onClick={() => { if (section === item.value) return; setSection(item.value); setMembers([]); setSearch(""); setError(null); }}
                className={`font-bold px-6 py-2 rounded-lg leading-none uppercase transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  section === item.value
                    ? "text-sand bg-onix border border-onix"
                    : "text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix"
                }`}
              >{item.label}</button>)}
            </div>
            <label className="block space-y-1">
              <span>{labels.titleColumn}</span>
              <input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span>{labels.logicalSeriesSearch}</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} />
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-sand p-2">
              {matches.length ? matches.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-3 px-2 py-2">
                <input type="checkbox" checked={false} onChange={() => setMembers((current) => [...current, { id: option.id, position: Math.max(0, ...current.map((member) => member.position)) + 1 }])} />
                <span>{option.title} <span className="text-sm">({option.volumeCount})</span></span>
              </label>) : <p className="p-2 text-sm">{labels.logicalSeriesEmpty}</p>}
            </div>
            {members.length > 0 && <div className="space-y-2">
              <p className="text-sm">{labels.logicalSeriesOrderHelp}</p>
              {ordered.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-lg bg-sand p-3">
                <label className="w-24 shrink-0 space-y-1">
                  <span>{labels.logicalSeriesOrder}</span>
                  <input type="number" min={1} max={2147483647} step={1} required value={member.position || ""} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, position: Number(event.target.value) } : item))} className={inputClass} />
                </label>
                <span className="min-w-0 flex-1">{available.find((option) => option.id === member.id)?.title}</span>
                <button type="button" className="cursor-pointer text-sm underline" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}>{labels.logicalSeriesRemove}</button>
              </div>)}
            </div>}
            {error && <p role="alert" className="text-danger-alt">{error}</p>}
            <div className="text-right">
              <Button type="submit" variant="lightAlt" disabled={pending} className="px-8 py-4 disabled:cursor-not-allowed disabled:opacity-50">{pending ? labels.logicalSeriesSaving : initialSeries ? labels.logicalSeriesSave : labels.createLogicalSeries}</Button>
            </div>
          </fieldset>
        </form>
      </div>
    </Modal>
  </>;
}
