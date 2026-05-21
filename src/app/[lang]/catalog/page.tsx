import { redirect } from "next/navigation";

interface CatalogPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { lang = "es" } = await params;

  redirect(`/${lang}/catalog/library`);
}
