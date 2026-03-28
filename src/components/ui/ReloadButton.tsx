"use client";

import { RefreshCwIcon } from "lucide-react";

export default function ReloadButton() {
  return (
    <button
      onClick={() => location.reload()}
      className="text-onix p-2 rounded-lg border border-neutral-300 hover:border-lilah transition-all duration-300 cursor-pointer"
    >
      <RefreshCwIcon size={20} />
    </button>
  );
}
