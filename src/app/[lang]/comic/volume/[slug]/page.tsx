import { Suspense } from "react";
import DetailSkeleton from "@/components/library/manga/DetailSkeleton";
import { OthersVolumePageContent } from "@/app/[lang]/others/volume/[slug]/page";

export default function ComicVolumePage(props: { params: Promise<{ lang: string; slug: string }> }) {
  return <Suspense fallback={<DetailSkeleton kind="volume" />}><OthersVolumePageContent {...props} section="comic" /></Suspense>;
}
