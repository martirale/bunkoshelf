import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import VolumesIndex from "@/components/library/manga/grid/VolumesIndex";
import type { Locale } from "@/lib/types";
async function Content({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) { const { lang = "es" } = await params; const { page = "1", author, genre, tag } = await searchParams; const intl = await getDictionary(lang as Locale); return <VolumesIndex lang={lang as Locale} intl={intl} page={Number.parseInt(page, 10) || 1} authorFilter={author} genreFilter={genre} tagFilter={tag} scope="comic" section="comic" />; }
export default function ComicVolumesPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) { return <Suspense fallback={null}><Content {...props} /></Suspense>; }
