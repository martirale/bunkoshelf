import { getDictionary } from "@/lib/i18n/serverDictionary";
import { Bolt } from "lucide-react";
import { getBuildInfo } from "@/lib/utils";
import Link from "next/link";

export default async function SettingsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);
  const { version, changelogUrl, buildDate } = getBuildInfo();

  return (
    <>
      <h2 className="flex items-center mb-8">
        <Bolt className="w-7 h-7 mr-2" />
        {intl.settings.overview}
      </h2>

      <h3 className="text-base mb-2">Información del servidor</h3>
      <p>Detalles básicos sobre tu instancia de Bunko Shelf</p>

      <div className="flex items-center mt-4 gap-8">
        <div>
          <p className="font-bold">Versión semántica</p>
          <Link href={changelogUrl} target="_blank" className="hover:underline">
            v{version}
          </Link>
        </div>

        <p>
          <span className="font-bold">Fecha de compilación</span>
          <br />
          {buildDate}
        </p>
      </div>
    </>
  );
}
