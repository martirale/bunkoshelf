"use client";

import { useEffect, useState } from "react";
import { BookCheckIcon, CheckIcon, HeartIcon, HeartOffIcon } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import { saveOfflineBookState, type OfflineBookVolume } from "@/lib/client/offlineLibrary";
import EpubReader from "@/components/reader/EpubReader";
import Button from "@/components/ui/Button";
import { updateBookReadState } from "@/actions/books-reading";
import {
  publishResourceState,
  useResourceMutation,
  useResourceRefresh,
  useResourceState,
} from "@/lib/client/resourceState";
import type { Dictionary } from "@/lib/types";

interface BookReaderButtonProps {
  volumeId: string;
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
  intl: Dictionary;
  allowOffline?: boolean;
  offlineBook?: OfflineBookVolume;
}

export default function BookReaderButton({ volumeId, slug, title, layout, intl, allowOffline = false, offlineBook }: BookReaderButtonProps) {
  const { online, userId } = usePwa();
  const books = intl.books as Record<string, string>;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isFavorite = false, isRead: onlineRead = false } = useResourceState(
    "book-volume",
    volumeId,
    {},
  );
  const favorite = offlineBook?.isFavorite ?? isFavorite;
  const isRead = offlineBook?.isRead ?? onlineRead;
  const mutateResource = useResourceMutation();
  const refreshResources = useResourceRefresh();

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!online) return;
    fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`)
      .then((response) => response.ok ? response.json() : null)
      .then((progress) => {
        if (allowOffline && userId && progress) void saveOfflineBookState(userId, volumeId, progress).catch(() => undefined);
        publishResourceState("book-volume", volumeId, {
          isFavorite: progress?.isFavorite === true,
          isRead: progress?.isRead === true,
          progression: progress?.progression ?? null,
        });
      })
      .catch(() => undefined);
  }, [allowOffline, online, slug, userId, volumeId]);

  const updateProgress = async (body: { isRead?: boolean; isFavorite?: boolean; progression?: number }) => {
    setIsLoading(true);
    try {
      if (!online && userId) {
        await saveOfflineBookState(userId, volumeId, body, body);
        return;
      }
      const response = await mutateResource({
        resource: "book-volume",
        id: volumeId,
        patch: body,
        mutate: () => fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        isSuccess: (value) => value.ok,
      });
      if (!response.ok) return;
      if (allowOffline && userId) await saveOfflineBookState(userId, volumeId, body).catch(() => undefined);
      if (body.isRead !== undefined) {
        if (body.isRead) window.dispatchEvent(new Event("bunko:challenge-updated"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRead = async () => {
    setIsLoading(true);
    try {
      const nextIsRead = !isRead;
      if (!online && userId) {
        const update = { isRead: nextIsRead, progression: nextIsRead ? 1 : 0 };
        const lastReadAt = nextIsRead ? new Date().toISOString() : undefined;
        await saveOfflineBookState(userId, volumeId, { ...update, lastReadAt }, {
          ...update, lastReadAt, readingDate: nextIsRead ? getLocalDateString() : undefined,
        });
        return;
      }
      const result = await mutateResource({
        resource: "book-volume",
        id: volumeId,
        patch: { isRead: nextIsRead, progression: nextIsRead ? 1 : 0 },
        mutate: () => updateBookReadState({
          slug,
          read: nextIsRead,
          readAt: nextIsRead ? getLocalDateString() : undefined,
        }),
        isSuccess: (value) => value.success,
      });
      if (!result.success) return;
      if (allowOffline && userId) {
        await saveOfflineBookState(userId, volumeId, { isRead: nextIsRead, progression: nextIsRead ? 1 : 0 }).catch(() => undefined);
      }
      if (nextIsRead) window.dispatchEvent(new Event("bunko:challenge-updated"));
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <div className="flex flex-row mt-4 gap-2">
      <Button
        onClick={() => setOpen(true)}
        aria-label={books.read}
        variant="accent"
        size="action"
        className="gap-2"
      >
        <BookCheckIcon size={20} />
        <span className="font-bold uppercase">{books.read}</span>
      </Button>
      <Button
        onClick={() => void toggleRead()}
        disabled={isLoading}
        variant={isRead ? "lightAlt" : "dark"}
        size="actionIcon"
        title={isRead ? books.markUnread : books.markRead}
        aria-label={isRead ? books.markUnread : books.markRead}
      >
        <CheckIcon size={20} />
      </Button>
      <Button
        onClick={() => void updateProgress({ isFavorite: !favorite })}
        disabled={isLoading}
        variant={favorite ? "lightAlt" : "dark"}
        size="actionIcon"
        title={favorite ? books.removeFavorite : books.addFavorite}
        aria-label={favorite ? books.removeFavorite : books.addFavorite}
      >
        {favorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </Button>
      {(allowOffline || offlineBook) && <OfflineDownloadButton userId={userId} section="books" slug={slug} volumeId={volumeId} intl={intl} />}
    </div>
    <EpubReader
      isOpen={open}
      onClose={() => {
        setOpen(false);
        refreshResources();
      }}
      slug={slug}
      progressResourceId={volumeId}
      offlineUserId={allowOffline || offlineBook ? userId : undefined}
      title={title}
      layout={layout}
      intl={intl}
    />
  </>;
}
