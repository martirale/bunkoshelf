"use client";

import { useRouter } from "next/navigation";
import MangaReader, { type MangaReaderPosition } from "@/components/reader/MangaReader";
import EpubReader from "@/components/reader/EpubReader";
import { syncReadingProgress } from "@/actions/progress";
import { useResourceMutation } from "@/lib/client/resourceState";
import type { Dictionary } from "@/lib/types";

export default function ClubReader({ kind, volume, returnHref, intl }: { kind: "manga" | "books"; volume: { id: string; slug: string; title: string; mangaStyle?: string | null; layout?: "reflowable" | "pre-paginated" }; returnHref: string; intl: Dictionary }) {
  const router = useRouter();
  const mutateResource = useResourceMutation();
  const closeReader = () => router.push(returnHref);
  const closeMangaReader = async (position: MangaReaderPosition | null) => {
    try {
      if (position) {
        const isFinished = position.lastPage >= position.totalPages - 1;
        const result = await mutateResource({
          resource: "manga-volume",
          id: volume.id,
          patch: isFinished ? { isRead: true } : {},
          mutate: () => syncReadingProgress({
            volumeSlug: volume.slug,
            ...position,
          }),
          isSuccess: (value) => Boolean(value && "success" in value && value.success),
          refresh: false,
        });
        if (result && "success" in result && result.success && isFinished) {
          window.dispatchEvent(new Event("bunko:challenge-updated"));
        }
      }
    } catch (error) {
      console.error("Error syncing club reading progress:", error);
    } finally {
      closeReader();
    }
  };
  if (kind === "books") return <EpubReader isOpen onClose={closeReader} progressResourceId={volume.id} slug={volume.slug} title={volume.title} layout={volume.layout ?? "reflowable"} intl={intl} />;
  return <MangaReader isOpen onClose={closeMangaReader} slug={volume.slug} intl={intl} isYoureiMode={false} readingDirection={volume.mangaStyle === "YesLTR" || volume.mangaStyle === "No" ? "ltr" : "rtl"} volumeId={volume.id} communityRating={null} initialPersonalRating={null} mangaTitle={volume.title} />;
}
