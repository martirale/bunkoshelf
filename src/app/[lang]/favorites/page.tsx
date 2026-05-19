import { redirect } from "next/navigation";

interface FavoritesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { lang = "es" } = await params;

  redirect(`/${lang}/favorites/manga`);
}
