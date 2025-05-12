import VolumeMangaContent from "@/components/library/VolumeMangaContent";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es", slug } = await params;
  const intl = await getDictionary(lang);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/library/volumes`,
      { cache: "no-store" }
    );

    const { data: entries } = await res.json();
    const volumeEntry = entries.find((item) => item.slug === slug);

    if (!volumeEntry) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Volumen no encontrado."}
        </div>
      );
    }

    return <VolumeMangaContent volumeData={volumeEntry} intl={intl} />;
  } catch (error) {
    console.error("Error al obtener datos del volumen:", error);
    return (
      <div className="text-center mt-8">
        {intl?.errors?.serverError || "Error al cargar el volumen."}
      </div>
    );
  }
}
