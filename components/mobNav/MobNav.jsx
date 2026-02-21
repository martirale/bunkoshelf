import { getDictionary } from "@/lib/i18n/Dictionary";
import MobNavContent from "./MobNavContent";

export default async function MobNav({ lang }) {
  const intl = await getDictionary(lang);

  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavContent lang={lang} intl={intl} />
    </div>
  );
}
