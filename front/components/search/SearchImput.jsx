"use client";

import { openSearchModal } from "@/hooks/useSearchModal";
import { Search } from "lucide-react";

export default function SearchInput() {
  return (
    <div
      className="flex items-center w-full max-w-xs mt-4"
      onClick={openSearchModal}
    >
      <Search className="w-4 h-4 text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Buscar título o autor"
        className="w-full p-2 bg-onix text-white rounded-md cursor-pointer focus:outline-none"
        readOnly
      />
    </div>
  );
}
