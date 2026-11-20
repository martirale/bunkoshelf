"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRightIcon } from "lucide-react";
import { convertLibrarySeries } from "@/actions/series-conversion";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/ui/Button";
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
    <Button
      type="button"
      variant="dark"
      size="small"
      onClick={convert}
      disabled={pending || !target}
      title={target ? label : labels.unsafeStorage}
      aria-busy={pending}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
    >
      <ArrowLeftRightIcon size={16} aria-hidden="true" />
      {pending ? labels.pending : label}
    </Button>
  );
}
