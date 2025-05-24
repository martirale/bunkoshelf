import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarLogo from "./siebarLogo";
import SecondNav from "./SecondNav";
import MainNav from "./MainNav";
import AdminNav from "./AdminNav";
import FooterNav from "./FooterNav";
import { verifySession } from "@/lib/auth/verifySession";
import Search from "./Search";

export default async function Sidebar({ lang }) {
  const intl = await getDictionary(lang);
  const user = await verifySession();

  return (
    <>
      <aside className="hidden md:flex md:w-3/12 2xl:w-2/12 bg-blackamber flex-col justify-between p-4">
        <h1 className="hidden">Bunko Shelf</h1>

        <SidebarLogo />

        {!user && <SecondNav intl={intl} className="flex-1" />}

        {user && (
          <div className="flex-1">
            <Search lang={lang} intl={intl} />

            <MainNav intl={intl} />
            {user.isAdmin && <AdminNav intl={intl} />}
          </div>
        )}

        <FooterNav intl={intl} />
      </aside>
    </>
  );
}
