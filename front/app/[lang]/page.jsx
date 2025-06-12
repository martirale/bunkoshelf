import HeroKeepRead from "@/components/home/manga/HeroKeepRead";
import RowNewVols from "@/components/home/manga/RowNewVols";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <div
        className={clsx(
          "bg-pearl flex flex-col p-4 mb-24 gap-4",
          "md:flex-row md:mb-0"
        )}
      >
        <div className="w-full md:w-1/2">
          <HeroKeepRead lang={lang} intl={intl} />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between mt-8 md:mt-11">
          <div className="group">
            <ReaderStatsPanel lang={lang} intl={intl} mdCols="md:grid-cols-3" />
            <div className="flex justify-center ml-4 mt-2 md:justify-end md:ml-0">
              <Link
                href={`/${lang}/profile`}
                className={clsx(
                  "text-onix 2xl:text-pearl w-max flex items-center text-base",
                  "group-hover:text-onix hover:underline",
                  "transition-all duration-300"
                )}
              >
                {intl.home.goToProfile}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>
          <RowNewVols lang={lang} intl={intl} />
        </div>
      </div>
    </>
  );
}
