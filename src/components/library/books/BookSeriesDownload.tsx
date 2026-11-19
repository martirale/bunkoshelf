"use client";

import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import { usePwa } from "@/components/pwa/PwaProvider";
import type { Dictionary } from "@/lib/types";

export default function BookSeriesDownload({ seriesId, slug, volumeIds, intl }: {
  seriesId: string;
  slug: string;
  volumeIds: string[];
  intl: Dictionary;
}) {
  const { userId } = usePwa();
  return <OfflineDownloadButton userId={userId} section="books" slug={slug} seriesId={seriesId} seriesVolumeIds={volumeIds} intl={intl} />;
}
