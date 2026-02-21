import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarLogo from "./siebarLogo";
import SearchModal from "@/components/search/SearchModal";
import SidebarContent from "./SidebarContent";

export default async function Sidebar({ lang }) {
  const intl = await getDictionary(lang);

  return (
    <>
      <aside className="hidden md:flex md:w-[35%] lg:w-[25%] xl:w-[21%] 2xl:w-[17%] bg-blackamber flex-col justify-between p-4">
        <h1 className="hidden">Bunko Shelf</h1>

        <SidebarLogo />

        <SidebarContent lang={lang} intl={intl} />
      </aside>

      <SearchModal lang={lang} intl={intl} />
    </>
  );
}
