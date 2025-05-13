"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

export default function ReadButtonsSeries({ lang, intl }) {
  return (
    <>
      {/* Read Buttons */}
      <div className="flex flex-row mt-4 gap-2">
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
