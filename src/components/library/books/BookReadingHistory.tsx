import { BookOpenCheckIcon, RepeatIcon } from "lucide-react";
import type { BookReadingEntry } from "@/lib/db/books/reading";
import type { Dictionary } from "@/lib/types";

export default function BookReadingHistory({ entries, intl }: { entries: BookReadingEntry[]; intl: Dictionary }) {
  const books = intl.books as Record<string, string>;

  if (entries.length === 0) return <p className="text-neutral-500">{books.noReadingEntries}</p>;

  return <div className="relative">
    {entries.map((entry, index) => {
      const reread = index < entries.length - 1;
      return <div key={entry.id} className="relative pb-4 last:pb-0">
        <div className="inline-flex items-start gap-4">
          {reread ? <RepeatIcon size={20} className="text-lilah" /> : <BookOpenCheckIcon size={20} className="text-lilah" />}
          <div className="flex flex-col">
            <span className="leading-none text-sand">{reread ? books.reread : books.firstRead}</span>
            <span className="mt-1 text-sm text-neutral-500">{entry.readAt}</span>
          </div>
        </div>
        {index < entries.length - 1 && <div className="absolute bottom-[4px] left-[9px] top-[24px] w-[2px] bg-lilah" />}
      </div>;
    })}
  </div>;
}
