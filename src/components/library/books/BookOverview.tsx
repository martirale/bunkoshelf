import { BookCheckIcon, BookPlusIcon } from "lucide-react";
import type { Dictionary } from "@/lib/types";
import { listBookVolumes, listRecentlyReadBooks } from "@/lib/db/books/library";
import { verifySession } from "@/lib/auth/verifySession";
import BookRowCarousel from "./row/BookRowCarousel";

interface BookOverviewProps { lang: string; intl: Dictionary; }

export default async function BookOverview({ lang, intl }: BookOverviewProps) {
  const [books, user] = await Promise.all([listBookVolumes({ limit: 20 }), verifySession()]);
  if (!books.length) return <p className="p-4 text-center">{(intl.books as Record<string, string>).noBooksIndexed}</p>;
  const recentlyRead = user ? await listRecentlyReadBooks(user.id, 12) : [];
  return <div className="library-overview p-4">
    <div className="library-overview-section"><BookRowCarousel books={books.slice(0, 12)} lang={lang} intl={intl} header={<h2 key="header" className="flex items-center text-base md:text-lg"><BookPlusIcon size={28} className="mr-2" />{intl.libraries.recentlyAdded as string}</h2>} /></div>
    {recentlyRead.length > 0 && <div className="library-overview-section"><BookRowCarousel books={recentlyRead} lang={lang} intl={intl} header={<h2 key="header" className="flex items-center text-base md:text-lg"><BookCheckIcon size={28} className="mr-2" />{intl.libraries.recentlyRead as string}</h2>} /></div>}
  </div>;
}
