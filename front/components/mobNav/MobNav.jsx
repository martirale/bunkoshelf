import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import MobNavButton from "./MobNavButton";

export default async function MobNav({ lang }) {
  const intl = await getDictionary(lang);
  const user = await verifySession();

  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavButton lang={lang} intl={intl} user={user} />
    </div>
  );
}
