import { getDictionary } from "@/lib/i18n/Dictionary";
import { Construction } from "lucide-react";

export default async function FavBooksPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
      <Construction className="w-16 h-16" />
      <h2 className="font-roboto text-center">{intl.misc.coming}</h2>
    </div>
  );
}
