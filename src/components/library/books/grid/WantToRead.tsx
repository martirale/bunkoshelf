import { BookmarkIcon } from "lucide-react";
import { verifySession } from "@/lib/auth/verifySession";
import { listBookProgressByIds, listBookVolumes } from "@/lib/db/books/library";
import type { Dictionary, Locale } from "@/lib/types";
import BookGrid from "../BookGrid";

export default async function WantToRead({ lang, intl }: { lang: Locale; intl: Dictionary }) {
  const user = await verifySession();
  const books = await listBookVolumes();
  const progressById = user ? await listBookProgressByIds(user.id, books.map((book) => book.id)) : {};
  const unread = books.filter((book) => !progressById[book.id]?.isRead);
  return <><div className="mb-4 flex items-center"><h2 className="flex items-center text-base md:text-lg"><BookmarkIcon size={28} className="mr-2" />{intl.libraries.toRead as string}</h2></div><BookGrid books={unread} lang={lang} intl={intl} progressById={progressById} /></>;
}
