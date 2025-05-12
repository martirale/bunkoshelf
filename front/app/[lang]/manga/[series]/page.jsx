import SerieMangaContent from "@/components/library/SerieMangaContent";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es", series } = await params;
  const intl = await getDictionary(lang);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/library/manga/series`,
      {
        cache: "no-store",
      }
    );

    const { data: entries } = await res.json();
    const serie = entries.find((item) => item.slug === series);

    if (!serie) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Serie no encontrada."}
        </div>
      );
    }

    return <SerieMangaContent serieData={serie} lang={lang} intl={intl} />;
  } catch (error) {
    console.error("Error al obtener datos de la serie:", error);
    return (
      <div className="text-center mt-8">
        {intl?.errors?.serverError || "Error al cargar la serie."}
      </div>
    );
  }
}
