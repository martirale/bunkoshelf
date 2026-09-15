"use client";

import { useRouter } from "next/navigation";
import MangaReader from "@/components/reader/MangaReader";
import EpubReader from "@/components/reader/EpubReader";
import type { Dictionary } from "@/lib/types";

export default function ClubReader({ kind, volume, intl }: { kind: "manga" | "books"; volume: { id: string; slug: string; title: string; mangaStyle?: string | null; layout?: "reflowable" | "pre-paginated" }; intl: Dictionary }) {
  const router = useRouter();
  if (kind === "books") return <EpubReader isOpen onClose={() => router.back()} slug={volume.slug} title={volume.title} layout={volume.layout ?? "reflowable"} intl={intl} />;
  return <MangaReader isOpen onClose={() => router.back()} slug={volume.slug} intl={intl} isYoureiMode={false} readingDirection={volume.mangaStyle === "YesLTR" || volume.mangaStyle === "No" ? "ltr" : "rtl"} volumeId={volume.id} communityRating={null} initialPersonalRating={null} mangaTitle={volume.title} />;
}
