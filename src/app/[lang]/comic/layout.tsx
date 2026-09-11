import { Suspense } from "react";
import HeroKeepRead from "@/components/library/manga/row/HeroKeepRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";
import type { ReactNode } from "react";

export default async function ComicLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  return <><Suspense fallback={null}><HeroKeepRead lang={lang as Locale} intl={intl} scope="comic" section="comic" /></Suspense><div className="mb-24 md:mb-4">{children}</div></>;
}
