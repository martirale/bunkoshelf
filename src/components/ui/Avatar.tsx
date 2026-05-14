import Image from "next/image";
import clsx from "clsx";

interface AvatarProps {
  name?: string | null;
  lastname?: string | null;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}

export default function Avatar({
  name,
  lastname,
  imageUrl,
  alt,
  className,
  imageClassName,
  textClassName,
}: AvatarProps) {
  const initials = `${name?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase() || "?";

  if (imageUrl) {
    return (
      <div className={clsx("relative overflow-hidden rounded-full bg-lilah", className)}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="192px"
          className={clsx("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full bg-lilah text-pearl flex items-center justify-center font-bold",
        className,
        textClassName
      )}
    >
      {initials}
    </div>
  );
}
