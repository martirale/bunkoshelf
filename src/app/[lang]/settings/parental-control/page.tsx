import { notFound } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getAppSettings } from "@/lib/db/appSettings";
import ParentalControlSettings from "@/components/settings/ParentalControlSettings";
import type { Locale } from "@/lib/types";

export default async function ParentalControlSettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  const [user, intl, settings] = await Promise.all([verifySession(), getDictionary(lang as Locale), getAppSettings()]);
  if (!user?.isAdmin) notFound();
  return <><h2 className="mb-4 flex items-center"><ShieldCheckIcon size={28} className="mr-2" />{intl.settings.parentalControl as string}</h2><ParentalControlSettings enabled={settings.parentalControlEnabled} mode={settings.parentalControlMode} lang={lang as Locale} intl={intl} /></>;
}
