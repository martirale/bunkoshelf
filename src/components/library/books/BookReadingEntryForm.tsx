"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PenLineIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import {
  createBookReadingEntry,
  deleteBookReadingEntry,
  updateBookReadingEntry,
} from "@/actions/books-reading-history";
import type { Dictionary } from "@/lib/types";

interface BookReadingEntry {
  id: string;
  readAt: string;
}

interface BookReadingEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  volumeId: string;
  entry: BookReadingEntry | null;
  intl: Dictionary;
}

export default function BookReadingEntryForm({
  isOpen,
  onClose,
  volumeId,
  entry,
  intl,
}: BookReadingEntryFormProps) {
  const books = intl.books as Record<string, string>;
  const [readAt, setReadAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { confirm } = useAlertDialog()!;
  const isEdit = Boolean(entry);

  useEffect(() => {
    if (isOpen) setReadAt(entry?.readAt ?? "");
  }, [entry, isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!readAt) return;

    setIsLoading(true);
    const result = isEdit
      ? await updateBookReadingEntry({ entryId: entry!.id, readAt })
      : await createBookReadingEntry({ volumeId, readAt });
    setIsLoading(false);

    if (result.success) window.location.reload();
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: books.deleteReadingEntry,
      description: (intl.alerts?.confirmDelete as string) || "Are you sure?",
      destructive: true,
      irreversible: true,
    });
    if (!confirmed) return;

    setIsLoading(true);
    const result = await deleteBookReadingEntry({ entryId: entry!.id });
    setIsLoading(false);

    if (result.success) window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-6 flex items-center">
        <PenLineIcon size={24} className="mr-2" />
        {isEdit ? books.editEntry : books.addEntry}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm uppercase">{books.date}</label>
          <input
            type="date"
            value={readAt}
            onChange={(event) => setReadAt(event.target.value)}
            className="w-full rounded-lg border border-onix bg-pearl px-5 py-3"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer rounded-lg border border-sand bg-sand px-8 py-4 font-bold leading-none uppercase text-onix transition-all duration-300 hover:border-onix hover:bg-onix hover:text-sand disabled:opacity-50"
          >
            {books.save}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="cursor-pointer rounded-lg border border-red-700 bg-red-700 px-8 py-4 font-bold leading-none uppercase text-sand transition-all duration-300 hover:bg-red-800 disabled:opacity-50"
            >
              {books.deleteEntry}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
