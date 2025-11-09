"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  currentPage,
  totalPages,
  lang,
  intl,
  basePath,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`/${lang}/manga${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="p-3 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300 disabled:hidden"
      >
        <ChevronLeftIcon size={20} />
      </button>
      <span className="px-2">
        {intl.reader.page} {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="p-3 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300 disabled:hidden"
      >
        <ChevronRightIcon size={20} />
      </button>
    </div>
  );
}
