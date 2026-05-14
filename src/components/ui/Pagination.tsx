"use client";

import { useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DictionarySection } from "@/lib/types";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  intl: DictionarySection;
}

export default function Pagination({
  currentPage,
  totalPages,
  intl,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    if (isPending || page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    const href = `${pathname}?${params.toString()}`;

    startTransition(() => {
      router.replace(href);
    });
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1 || isPending}
        onClick={() => goToPage(currentPage - 1)}
        className="p-3 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeftIcon size={20} />
      </button>
      <span className="px-2">
        {(intl as Record<string, DictionarySection>).reader.page as string} {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage === totalPages || isPending}
        onClick={() => goToPage(currentPage + 1)}
        className="p-3 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRightIcon size={20} />
      </button>
    </div>
  );
}
