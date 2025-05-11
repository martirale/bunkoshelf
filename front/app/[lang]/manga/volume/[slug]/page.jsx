import VolumeMangaContent from "@/components/library/VolumeMangaContent";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <VolumeMangaContent />
    </>
  );
}
