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

export default function ReadingHistory({
  volumeId,
  intl,
  initialEntries,
  firstRead,
}) {
  const [entries, setEntries] = useState(initialEntries || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const canMigrate = firstRead && entries.length === 0;

  const isReread = (index) => index < entries.length - 1;
  const isLast = (index) => index === entries.length - 1;

  const openAdd = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    const result = await createReadingEntry({ volumeId, readAt: firstRead });
    if (result.success) {
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
          {intl.manga.addEntry}
        </button>

        {canMigrate && (
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-1 text-sm uppercase text-lilah hover:text-sand transition-colors duration-300 cursor-pointer disabled:opacity-50"
          >
            <ArchiveRestoreIcon size={16} />
            {intl.manga.migrateEntry}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-neutral-500">{intl.manga.noEntries}</p>
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
                    {isReread(index) ? intl.manga.reread : intl.manga.firstRead}
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
