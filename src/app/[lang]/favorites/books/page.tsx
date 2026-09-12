import { verifySession } from "@/lib/auth/verifySession";
import { listBookVolumes } from "@/lib/db/books/library";
import { query } from "@/lib/db/query";
import BookGrid from "@/components/library/books/BookGrid";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function FavoriteBooksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const books = intl.books as Record<string, string>;
  if (!user) return <p className="p-4 text-center">{books.signInFavorites}</p>;
  const ids = await query<{ volume_id: string }>("SELECT volume_id FROM user_to_books WHERE user_id=$1 AND is_favorite=TRUE", [user.id]);
  const all = await listBookVolumes();
  const favoriteIds = new Set(ids.map((item) => item.volume_id));
  return <main><h1 className="p-4 text-2xl">{books.favoriteBooks}</h1><BookGrid books={all.filter((book) => favoriteIds.has(book.id))} lang={lang} intl={intl} /></main>;
}
