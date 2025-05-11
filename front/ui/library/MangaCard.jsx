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
  isDragging,
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col overflow-hidden bg-blackamber border border-blackamber rounded-lg hover:bg-blackamber transition-all duration-300 ${
        isDragging ? "cursor-grabbing" : "cursor-pointer"
      }`}
    >
      <div className="relative aspect-[7/10] w-full bg-zinc-800 flex-shrink-0">
        {isOneshot && (
          <span className="absolute top-2 right-2 z-10 bg-lilah text-xs uppercase py-0.5 px-1 rounded">
            Oneshot
          </span>
        )}
        <Image
          src={cover || "/placeholder.svg?=v1"}
          alt={`Cover for ${title}`}
          fill
          className="object-cover z-0"
        />
      </div>

      <div className="flex flex-col justify-between p-3 h-24">
        <h3 className="text-xs leading-6 line-clamp-2 group-hover:text-lilah transition-all duration-300">
          {title}
        </h3>

        {isSeries && volumeCount != null && (
          <p className="mt-2 text-xs uppercase text-zinc-400">
            {volumeCount} {intl.manga.volumes}
          </p>
        )}
      </div>
    </Link>
  );
}
