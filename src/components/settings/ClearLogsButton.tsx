"use client";

import { TrashIcon } from "lucide-react";
import { clearLogs } from "@/actions/admin-logs";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import type { Dictionary } from "@/lib/types";

interface ClearLogsButtonProps {
  intl: Dictionary;
  onClear?: () => void;
}

export default function ClearLogsButton({ intl, onClear }: ClearLogsButtonProps) {
  const { alert, confirm } = useAlertDialog()!;

  async function handleClick() {
    const confirmed = await confirm({
      title: intl.alerts.clearLogsTitle as string,
      description: intl.alerts.clearLogsDescription as string,
      destructive: true,
      irreversible: true,
    });
    if (!confirmed) return;

    const result = await clearLogs();

    if (result?.success) {
      if (onClear) {
        onClear();
      } else {
        window.location.reload();
      }
    } else {
      await alert({
        title: intl.alerts.clearLogsErrorTitle as string,
        description: intl.alerts.clearLogsErrorDescription as string,
      });
    }
  }

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-md border border-neutral-800 bg-blackamber hover:border-danger-alt hover:bg-danger cursor-pointer transition-all duration-300"
    >
      <TrashIcon size={16} />
    </button>
  );
}
