import { getDictionary } from "@/lib/i18n/Dictionary";
import { ConstructionIcon } from "lucide-react";

export default async function FavBooksPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] md:h-[94vh] gap-4 p-4">
      <ConstructionIcon size={64} />
      <h2 className="font-roboto text-center">{intl.misc.coming}</h2>
    </div>
  );
}
