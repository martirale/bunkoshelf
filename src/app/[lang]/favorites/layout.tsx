import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarMisc from "@/components/ui/SidebarMisc";
import FavoritesNav from "@/components/favorites/FavoritesNav";
import { HeartIcon } from "lucide-react";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import type { Locale } from "@/lib/types";
import type { ReactNode } from "react";

interface FavoritesLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

async function FavoritesLayoutContent({
  children,
  params,
}: FavoritesLayoutProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const othersLibraryEnabled = await isOthersLibraryEnabled();

  return (
    <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
      <SidebarMisc>
        <h2 className="flex items-center text-onix">
          <HeartIcon size={28} className="mr-2" />
          {intl.favorites.title as string}
        </h2>

        <FavoritesNav
          intl={intl}
          isOthersEnabled={othersLibraryEnabled}
        />
      </SidebarMisc>

      <div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto">
        <div className="mb-24 md:mb-4">{children}</div>
      </div>
    </div>
  );
}

export default function FavoritesLayout(props: FavoritesLayoutProps) {
  return (
    <Suspense fallback={null}>
      <FavoritesLayoutContent {...props} />
    </Suspense>
  );
}
