import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import MobNavButton from "./MobNavButton";

export default async function MobNav({ lang }) {
  const intl = await getDictionary(lang);
  const user = await verifySession();

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <MobNavButton intl={intl} user={user} />
    </div>
  );
}
