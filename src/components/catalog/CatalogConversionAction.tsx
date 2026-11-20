"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRightIcon, Loader2Icon } from "lucide-react";
import { convertLibrarySeries } from "@/actions/series-conversion";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import { useToast } from "@/components/ToastProvider";
import { getConvertedSeriesPath } from "@/lib/seriesConversion";
import type { OneshotSection } from "@/lib/librarySection";
import type { Dictionary } from "@/lib/types";

export default function CatalogConversionAction({ intl, volumeId, section, source, isOneshot }: {
  intl: Dictionary;
  volumeId: string;
  section: OneshotSection;
  source: string;
  isOneshot: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { confirm } = useAlertDialog()!;
  const { addToast } = useToast()!;
  const catalog = intl.catalog as Record<string, string>;
  const labels = intl.catalog.conversionMessages as Record<string, string>;
  const label = isOneshot ? labels.toSeries : labels.toOneshot;
  const target = getConvertedSeriesPath(source, !isOneshot);

  async function convert() {
    if (!target || pending) return;
    setPending(true);
    try {
      const confirmed = await confirm({
        title: label,
        description: source === target ? labels.confirmExistingPath : labels.confirm.replace("{source}", () => source).replace("{target}", () => target),
      });
      if (!confirmed) return;
      const result = await convertLibrarySeries({ volumeId, section, expectedPath: source, oneshot: !isOneshot });
      if (!result.ok) {
        addToast({ title: catalog.conversion, description: labels[result.error] ?? labels.unavailable, variant: "error" });
        return;
      }
      addToast({
        title: catalog.conversion,
        description: result.cleanupPending ? labels.cleanupPending : labels.done,
        variant: "success",
      });
      router.refresh();
    } catch {
      addToast({ title: catalog.conversion, description: labels.unavailable, variant: "error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={convert}
      disabled={pending || !target}
      title={target ? label : labels.unsafeStorage}
      aria-label={pending ? labels.pending : target ? label : labels.unsafeStorage}
      aria-busy={pending}
      className="border border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <Loader2Icon size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        <ArrowLeftRightIcon size={16} aria-hidden="true" />
      )}
    </button>
  );
}
