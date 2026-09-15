import { BookCopyIcon } from "lucide-react";
import { listBookVolumes } from "@/lib/db/books/library";
import { listBookProgressByIds } from "@/lib/db/books/library";
import { verifySession } from "@/lib/auth/verifySession";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import type { Dictionary, Locale } from "@/lib/types";
import BookGrid from "../BookGrid";

export default async function VolumesIndex({
  lang,
  intl,
  authorFilter,
  genreFilter,
  tagFilter,
}: {
  lang: Locale;
  intl: Dictionary;
  authorFilter?: string;
  genreFilter?: string;
  tagFilter?: string;
}) {
  const user = await verifySession();
  const authorNames = authorFilter?.trim() ? authorFilter.split(",").map((author) => author.trim()).filter(Boolean) : undefined;
  const genreNames = genreFilter?.trim() ? genreFilter.split(",").map((genre) => genre.trim()).filter(Boolean) : undefined;
  const tagNames = tagFilter?.trim() ? tagFilter.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined;
  const books = await listBookVolumes({ authorNames, genreNames, tagNames });
  const progressById = user ? await listBookProgressByIds(user.id, books.map((book) => book.id)) : {};
  return <><div className="mb-4 flex items-center"><h2 className="mr-4 flex items-center text-base md:text-lg"><BookCopyIcon size={28} className="mr-2" />{intl.libraries.books as string}</h2><FiltersDrawer intl={intl} library="books" /></div><BookGrid books={books} lang={lang} intl={intl} progressById={progressById} /></>;
}
