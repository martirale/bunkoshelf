"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DictionarySection } from "@/lib/types";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  lang: string;
  intl: DictionarySection;
  basePath: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  lang,
  intl,
  basePath,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
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
        {(intl as Record<string, DictionarySection>).reader.page as string} {currentPage} / {totalPages}
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
