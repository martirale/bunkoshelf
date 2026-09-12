import { BookCopyIcon } from "lucide-react";
import { listBookVolumes } from "@/lib/db/books/library";
import { listBookProgressByIds } from "@/lib/db/books/library";
import { verifySession } from "@/lib/auth/verifySession";
import type { Dictionary, Locale } from "@/lib/types";
import BookGrid from "../BookGrid";

export default async function VolumesIndex({ lang, intl }: { lang: Locale; intl: Dictionary }) {
  const user = await verifySession();
  const books = await listBookVolumes();
  const progressById = user ? await listBookProgressByIds(user.id, books.map((book) => book.id)) : {};
  return <><div className="mb-4 flex items-center"><h2 className="flex items-center text-base md:text-lg"><BookCopyIcon size={28} className="mr-2" />{intl.libraries.books as string}</h2></div><BookGrid books={books} lang={lang} intl={intl} progressById={progressById} /></>;
}
