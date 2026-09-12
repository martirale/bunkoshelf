"use client";

import { useState } from "react";
import { BookOpenCheckIcon, PlusIcon, RepeatIcon } from "lucide-react";
import type { BookReadingEntry } from "@/lib/db/books/reading";
import type { Dictionary } from "@/lib/types";
import BookReadingEntryForm from "./BookReadingEntryForm";

interface BookReadingHistoryProps {
  volumeId: string;
  entries: BookReadingEntry[];
  intl: Dictionary;
}

export default function BookReadingHistory({ volumeId, entries, intl }: BookReadingHistoryProps) {
  const books = intl.books as Record<string, string>;
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BookReadingEntry | null>(null);

  const openAdd = () => {
    setEditingEntry(null);
    setIsOpen(true);
  };

  const openEdit = (entry: BookReadingEntry) => {
    setEditingEntry(entry);
    setIsOpen(true);
  };

  return (
    <div>
      <button
        onClick={openAdd}
        className="mb-4 flex cursor-pointer items-center gap-1 text-sm uppercase text-lilah transition-colors duration-300 hover:text-sand"
      >
        <PlusIcon size={18} />
        {books.addEntry}
      </button>

      {entries.length === 0 ? (
        <p className="text-neutral-500">{books.noReadingEntries}</p>
      ) : (
        <div className="relative">
          {entries.map((entry, index) => {
            const reread = index < entries.length - 1;
            return <div key={entry.id} className="relative pb-4 last:pb-0">
              <button
                type="button"
                onClick={() => openEdit(entry)}
                className="group inline-flex cursor-pointer items-start gap-4 text-left"
              >
                {reread ? <RepeatIcon size={20} className="text-lilah transition-colors duration-300 group-hover:text-sand" /> : <BookOpenCheckIcon size={20} className="text-lilah transition-colors duration-300 group-hover:text-sand" />}
                <span className="flex flex-col">
                  <span className="leading-none text-sand">{reread ? books.reread : books.firstRead}</span>
                  <span className="mt-1 text-sm text-neutral-500">{entry.readAt}</span>
                </span>
              </button>
              {index < entries.length - 1 && <div className="absolute bottom-[4px] left-[9px] top-[24px] w-[2px] bg-lilah" />}
            </div>;
          })}
        </div>
      )}

      <BookReadingEntryForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        volumeId={volumeId}
        entry={editingEntry}
        intl={intl}
      />
    </div>
  );
}
