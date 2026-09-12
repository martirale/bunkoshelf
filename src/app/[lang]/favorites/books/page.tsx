import SeriesIndexFav from "@/components/library/books/grid/SeriesIndexFav";
import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function FavoriteBooksPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const { lang } = await params;
  const { page: pageRaw = "1" } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <SeriesIndexFav lang={lang as Locale} intl={intl} page={Number.parseInt(pageRaw, 10) || 1} />;
}
