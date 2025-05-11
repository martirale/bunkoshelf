import Link from "next/link";
import Image from "next/image";

export default function MangaCard({
  title,
  href,
  isSeries,
  isOneshot,
  volumeCount,
  cover,
  intl,
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden bg-onix border border-blackamber rounded-lg hover:bg-blackamber transition-all duration-300"
    >
      <div className="relative aspect-[7/10] w-full bg-zinc-800">
        {isOneshot && (
          <span className="absolute top-2 right-2 z-10 bg-heather group-hover:bg-lilah text-xs uppercase py-0.5 px-1 rounded">
            Oneshot
          </span>
        )}
        <Image
          src={cover || "/fallback-cover.png?v=1"}
          alt={`Cover for ${title}`}
          fill
          className="object-cover z-0"
        />
      </div>

      <div className="p-3">
        <h3 className="text-xs leading-6 line-clamp-2 group-hover:text-heather transition-all duration-300">
          {title}
        </h3>
        {isSeries && volumeCount != null && (
          <p className="mt-1 text-xs uppercase">
            {volumeCount} {intl.manga.volumes}
          </p>
        )}
      </div>
    </Link>
  );
}
