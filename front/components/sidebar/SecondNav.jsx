import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function SecondNav({ intl, className }) {
  return (
    <>
      <div className={`mt-8 space-y-2 ${className}`}>
        <Link
          href="https://bunko.amlab.site/referencia/app"
          target="_blank"
          rel="noopener"
          className="flex items-center p-4 rounded-lg leading-none border border-blackamber hover:bg-onix hover:border-pearl transition-all duration-300"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          {intl.noauth.guide}
        </Link>
      </div>
    </>
  );
}
