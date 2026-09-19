"use client";

import { useState, useEffect, type FormEvent } from "react";
import { PenLineIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import {
  createReadingEntry,
  updateReadingEntry,
  deleteReadingEntry,
} from "@/actions/readingHistory";
import { useResourceMutation } from "@/lib/client/resourceState";
import type { Dictionary } from "@/lib/types";

interface ReadingEntry {
  id: string;
  readAt: string | null;
}

interface ReadingEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  volumeId: string;
  entry: ReadingEntry | null;
  intl: Dictionary;
}

export default function ReadingEntryForm({
  isOpen,
  onClose,
  volumeId,
  entry,
  intl,
}: ReadingEntryFormProps) {
  const [readAt, setReadAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { confirm } = useAlertDialog()!;
  const mutateResource = useResourceMutation();

  const isEdit = !!entry;

  useEffect(() => {
    if (isOpen) {
      setReadAt(entry?.readAt || "");
    }
  }, [isOpen, entry]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!readAt) return;

    setIsLoading(true);

    const result = await mutateResource({
      resource: "manga-volume",
      id: volumeId,
      patch: { isRead: true },
      mutate: () => isEdit
        ? updateReadingEntry({ entryId: entry!.id, readAt })
        : createReadingEntry({ volumeId, readAt }),
      isSuccess: (value) => Boolean(value?.success),
      getConfirmedPatch: (value) => value?.progress,
    });

    setIsLoading(false);

    if (result?.success) {
      window.dispatchEvent(new Event("bunko:challenge-updated"));
      onClose();
    }
  };

  const handleDelete = async () => {
    const confirmResult = await confirm({
      title: intl.manga.deleteReadingEntry as string,
      description: (intl.alerts?.confirmDelete as string) || "Are you sure?",
      destructive: true,
      irreversible: true,
    });
    if (!confirmResult) return;

    setIsLoading(true);
    const result = await mutateResource({
      resource: "manga-volume",
      id: volumeId,
      patch: {},
      mutate: () => deleteReadingEntry({ entryId: entry!.id }),
      isSuccess: (value) => Boolean(value?.success),
      getConfirmedPatch: (value) => value?.progress,
    });
    setIsLoading(false);

    if (result?.success) {
      window.dispatchEvent(new Event("bunko:challenge-updated"));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="flex items-center mb-6">
        <PenLineIcon size={24} className="mr-2" />
        {isEdit ? (intl.manga.editEntry as string) : (intl.manga.addEntry as string)}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm uppercase mb-1">
            {intl.manga.date as string}
          </label>
          <input
            type="date"
            value={readAt}
            onChange={(e) => setReadAt(e.target.value)}
            className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
            required
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            variant="lightAlt"
            className="px-8 py-4 disabled:opacity-50"
          >
            {intl.manga.save as string}
          </Button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-red-700 border border-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {intl.manga.deleteEntry as string}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
