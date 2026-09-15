"use client";

import { useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePwa } from "@/components/pwa/PwaProvider";
import Button from "@/components/ui/Button";
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
  const { online } = usePwa();

  const goToPage = (page: number) => {
    if (isPending || page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    const href = `${pathname}?${params.toString()}`;

    if (!online) {
      window.history.replaceState({}, "", href);
      window.dispatchEvent(new Event("bunko:offline-navigate"));
      return;
    }

    startTransition(() => router.replace(href));
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <Button
        type="button"
        variant="dark"
        size="icon"
        disabled={currentPage === 1 || isPending}
        onClick={() => goToPage(currentPage - 1)}
        className="size-11 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeftIcon size={20} />
      </Button>
      <span className="px-2">
        {(intl as Record<string, DictionarySection>).reader.page as string} {currentPage} / {totalPages}
      </span>
      <Button
        type="button"
        variant="dark"
        size="icon"
        disabled={currentPage === totalPages || isPending}
        onClick={() => goToPage(currentPage + 1)}
        className="size-11 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRightIcon size={20} />
      </Button>
    </div>
  );
}
