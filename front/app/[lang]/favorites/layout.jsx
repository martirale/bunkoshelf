import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarMisc from "@/components/ui/SidebarMisc";
import FavoritesNav from "@/components/favorites/FavoritesNav";
import { Heart } from "lucide-react";

export default async function FavoritesLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
      <SidebarMisc>
        <h2 className="flex items-center text-onix">
          <Heart className="w-7 h-7 mr-2" />
          {intl.favorites.title}
        </h2>

        <FavoritesNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4 overflow-y-auto">
        <div className="mb-24 md:mb-0">{children}</div>
      </div>
    </div>
  );
}
