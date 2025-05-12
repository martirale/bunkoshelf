export default function VolumeMangaContent({ volumeData, intl }) {
  if (!volumeData) {
    return (
      <div className="text-center mt-8">
        {intl?.errors?.notFound ||
          "No se encontró información de este volumen."}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {volumeData.title || volumeData.filename}
      </h1>

      {volumeData.seriesTitle && (
        <p style={{ fontStyle: "italic" }}>Serie: {volumeData.seriesTitle}</p>
      )}

      <div className="mt-4">
        {volumeData.description || "Descripción no disponible."}
      </div>
    </div>
  );
}
