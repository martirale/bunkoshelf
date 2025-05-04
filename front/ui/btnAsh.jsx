import Link from "next/link";

export default function BtnAsh({
  children,
  href,
  type = "button",
  className = "",
  ...props
}) {
  const baseClasses = `flex items-center justify-center p-4 rounded-lg leading-none bg-blackamber border border-sand hover:border-denim transition-all duration-300 cursor-pointer ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={baseClasses} {...props}>
      {children}
    </button>
  );
}
