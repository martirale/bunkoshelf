import MangaCard from "./MangaCard";

export default async function LibraryGrid({ lang, intl }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/library/manga`
  );
  const { data: entries } = await res.json();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {entries.map((entry) => {
        const isSeries = entry.volumes.length > 1 || entry.metadata;
        const isOneshot = !isSeries;
        const slug = entry.title.toLowerCase().replace(/\s+/g, "-");
        const href = isSeries
          ? `/${lang}/manga/${slug}`
          : `/${lang}/manga/volume/${slug}`;

        return (
          <MangaCard
            key={entry.title}
            title={entry.title}
            href={href}
            isSeries={isSeries}
            isOneshot={isOneshot}
            volumeCount={isSeries ? entry.volumes.length : null}
            cover={null}
            intl={intl}
            className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
          />
        );
      })}
    </div>
  );
}
