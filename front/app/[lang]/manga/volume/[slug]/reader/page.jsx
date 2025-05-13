export default function VolumeReaderPage({ params }) {
  const { slug, lang } = params;

  return (
    <main className="min-h-screen p-4">
      <h1>Lector para el volumen: {slug}</h1>
      {/* Aquí irá el lector CBZ más adelante */}
    </main>
  );
}
