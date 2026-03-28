"use client";

import { TrashIcon } from "lucide-react";
import { clearLogs } from "@/actions/admin-logs";

interface ClearLogsButtonProps {
  onClear?: () => void;
}

export default function ClearLogsButton({ onClear }: ClearLogsButtonProps) {
  async function handleClick() {
    const confirmed = confirm("¿Seguro que deseas limpiar el log?");
    if (!confirmed) return;

    const result = await clearLogs();

    if (result?.success) {
      if (onClear) {
        onClear();
      } else {
        window.location.reload();
      }
    } else {
      alert("No se pudo limpiar el log.");
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
