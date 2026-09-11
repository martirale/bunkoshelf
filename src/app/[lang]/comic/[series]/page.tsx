import { Suspense } from "react";
import DetailSkeleton from "@/components/library/manga/DetailSkeleton";
import { OthersSeriesPageContent } from "@/app/[lang]/others/[series]/page";

export default function ComicSeriesPage(props: { params: Promise<{ lang: string; series: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  return <Suspense fallback={<DetailSkeleton kind="series" />}><OthersSeriesPageContent {...props} section="comic" /></Suspense>;
}
