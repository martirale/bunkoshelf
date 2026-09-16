import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getAppSettings } from "@/lib/db/appSettings";
import ParentalControlForm from "@/components/profile/ParentalControlForm";
import type { Locale } from "@/lib/types";

export default async function ProfileParentalControlPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [user, intl, settings] = await Promise.all([verifySession(), getDictionary(lang as Locale), getAppSettings()]);
  if (!user) notFound();
  return <ParentalControlForm user={user} globallyEnabled={settings.parentalControlEnabled} globalMode={settings.parentalControlMode} lang={lang as Locale} intl={intl} />;
}
