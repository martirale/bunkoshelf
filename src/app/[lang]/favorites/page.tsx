import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/verifySession";
import { getFavoriteSectionCounts } from "@/lib/db/library";

interface FavoritesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { lang = "es" } = await params;
  const user = await verifySession();

  if (user) {
    const counts = await getFavoriteSectionCounts(user.id);
    const destinations = [
      [counts.mangaSeries, `/${lang}/favorites/manga`],
      [counts.mangaVolumes, `/${lang}/favorites/manga/volumes`],
      [counts.comicSeries, `/${lang}/favorites/comic`],
      [counts.comicVolumes, `/${lang}/favorites/comic/volumes`],
      [counts.otherSeries, `/${lang}/favorites/others`],
      [counts.otherVolumes, `/${lang}/favorites/others/volumes`],
    ] as const;
    const destination = destinations.find(([count]) => count > 0)?.[1];

    if (destination) redirect(destination);
  }

  redirect(`/${lang}/favorites/manga/volumes`);
}
