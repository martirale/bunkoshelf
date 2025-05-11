import SerieMangaContent from "@/components/library/SerieMangaContent";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <SerieMangaContent />
    </>
  );
}
