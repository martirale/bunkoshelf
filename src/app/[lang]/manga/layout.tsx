import { Suspense } from "react";
import HeroKeepRead from "@/components/library/manga/row/HeroKeepRead";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";
import type { ReactNode } from "react";

interface MangaLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

async function MangaLayoutContent({ children, params }: MangaLayoutProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const othersLibraryEnabled = await isOthersLibraryEnabled();
  const scope = getLibraryScope("manga", othersLibraryEnabled);

  return (
    <>
      <Suspense fallback={null}>
        <HeroKeepRead
          lang={lang as Locale}
          intl={intl}
          scope={scope}
        />
      </Suspense>

      <div className="mb-24 md:mb-4">{children}</div>
    </>
  );
}

export default function MangaLayout(props: MangaLayoutProps) {
  return (
    <Suspense fallback={null}>
      <MangaLayoutContent {...props} />
    </Suspense>
  );
}
