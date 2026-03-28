import HeroKeepRead from "@/components/home/manga/HeroKeepRead";
import RowNewVols from "@/components/home/manga/RowNewVols";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ReloadButton from "@/components/ui/ReloadButton";
import PushButton from "@/components/ui/PushButton";
import type { Locale, DictionarySection } from "@/lib/types";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  const home = intl.home as DictionarySection;

  return (
    <>
      <div className="relative">
        <div className="fixed inset-0 -z-10 bg-seigaiha-pattern-w" />
        <div className="fixed inset-0 -z-20 bg-pearl" />
        <div
          className={clsx(
            "bg-pearl flex flex-col p-4 mb-24 gap-4",
            "md:flex-row md:mb-0"
          )}
        >
          <div className="w-full md:w-1/2">
            <HeroKeepRead lang={lang as Locale} intl={intl} vapidPublicKey={process.env.VAPID_PUBLIC_KEY} />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div className="group">
              <div className="hidden md:flex justify-end gap-2">
                <PushButton lang={lang as Locale} intl={intl} vapidPublicKey={process.env.VAPID_PUBLIC_KEY} />
                <ReloadButton />
              </div>

              <ReaderStatsPanel
                lang={lang as Locale}
                intl={intl}
                mdCols="md:grid-cols-3 mt-4"
              />
              <div className="flex justify-center ml-4 mt-2 md:justify-end md:ml-0">
                <Link
                  href={`/${lang}/profile`}
                  className={clsx(
                    "text-onix w-max flex items-center text-base",
                    "hover:underline transition-all duration-300"
                  )}
                >
                  {home.goToProfile as string}
                  <ChevronRightIcon size={20} className="ml-1" />
                </Link>
              </div>
            </div>

            <RowNewVols lang={lang as Locale} intl={intl} />
          </div>
        </div>
      </div>
    </>
  );
}
