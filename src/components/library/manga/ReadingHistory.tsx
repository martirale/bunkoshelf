"use client";

import { useState } from "react";
import {
  BookOpenCheckIcon,
  RepeatIcon,
  PlusIcon,
  ArchiveRestoreIcon,
} from "lucide-react";
import { createReadingEntry } from "@/actions/readingHistory";
import ReadingEntryForm from "./ReadingEntryForm";
import type { Dictionary } from "@/lib/types";

interface ReadingEntry {
  id: string;
  readAt: string | null;
}

interface ReadingHistoryProps {
  volumeId: string;
  intl: Dictionary;
  initialEntries: ReadingEntry[];
  firstRead: string | null;
}

export default function ReadingHistory({
  volumeId,
  intl,
  initialEntries,
  firstRead,
}: ReadingHistoryProps) {
  const [entries, setEntries] = useState(initialEntries || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReadingEntry | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const canMigrate = firstRead && entries.length === 0;

  const isReread = (index: number) => index < entries.length - 1;
  const isLast = (index: number) => index === entries.length - 1;

  const openAdd = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const openEdit = (entry: ReadingEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    const result = await createReadingEntry({ volumeId, readAt: firstRead! });
    if (result?.success) {
      window.location.reload();
    }
    setIsMigrating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-1 text-sm uppercase text-lilah hover:text-sand transition-colors duration-300 cursor-pointer"
        >
          <PlusIcon size={18} />
          {intl.manga.addEntry as string}
        </button>

        {canMigrate && (
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-1 text-sm uppercase text-lilah hover:text-sand transition-colors duration-300 cursor-pointer disabled:opacity-50"
          >
            <ArchiveRestoreIcon size={16} />
            {intl.manga.migrateEntry as string}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-neutral-500">{intl.manga.noEntries as string}</p>
      ) : (
        <div className="relative">
          {entries.map((entry, index) => (
            <div key={entry.id} className="relative pb-4 last:pb-0">
              <div
                className="inline-flex items-start gap-4 cursor-pointer group"
                onClick={() => openEdit(entry)}
              >
                <div className="relative">
                  {isReread(index) ? (
                    <RepeatIcon
                      size={20}
                      className="text-lilah group-hover:text-sand transition-colors duration-300"
                    />
                  ) : (
                    <BookOpenCheckIcon
                      size={20}
                      className="text-lilah group-hover:text-sand transition-colors duration-300"
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sand leading-none">
                    {isReread(index) ? (intl.manga.reread as string) : (intl.manga.firstRead as string)}
                  </span>
                  <span className="text-neutral-500 text-sm mt-1">
                    {entry.readAt}
                  </span>
                </div>
              </div>

              {!isLast(index) && (
                <div className="absolute left-[9px] top-[24px] bottom-[4px] w-[2px] bg-lilah" />
              )}
            </div>
          ))}
        </div>
      )}

      <ReadingEntryForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        volumeId={volumeId}
        entry={editingEntry}
        intl={intl}
      />
    </div>
  );
}
