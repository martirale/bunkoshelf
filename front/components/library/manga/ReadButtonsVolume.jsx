"use client";

import { BookCheck, EyeClosed, Check, Heart } from "lucide-react";
import Link from "next/link";

export default function ReadButtonsVolume({ lang, intl }) {
  return (
    <>
      {/* Read Buttons */}
      <div className="flex flex-row mt-4 gap-2">
        <Link
          href="#"
          className="flex items-center font-bold px-6 py-4 rounded-lg leading-none uppercase text-sand bg-lilah border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
        >
          <BookCheck className="w-5 h-5 mr-2" />
          {intl.manga.read}
        </Link>
        <Link
          href="#"
          className="flex items-center font-bold p-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
          title="Leer de incógnito"
        >
          <EyeClosed className="w-5 h-5" />
        </Link>
        <Link
          href="#"
          className="p-4 rounded-lg leading-none text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
          title="Marcar como leído"
        >
          <Check className="w-5 h-5" />
        </Link>
        <Link
          href="#"
          className="p-4 rounded-lg leading-none text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
          title="Marcar como favorito"
        >
          <Heart className="w-5 h-5" />
        </Link>
      </div>
    </>
  );
}
