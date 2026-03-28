import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getUserSubscriptions } from "@/actions/web-push";
import SubscriptionsTable from "@/components/profile/SubscriptionsTable";
import { BellIcon } from "lucide-react";
import type { Locale, DictionarySection } from "@/lib/types";

interface NotificationsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  const user = await verifySession();
  if (!user) return <p>No autorizado</p>;

  const result = await getUserSubscriptions();
  const subscriptions = result?.subscriptions ?? [];

  const profile = intl.profile as DictionarySection;

  return (
    <>
      <h2 className="flex items-center mb-4">
        <BellIcon size={28} className="mr-2" />
        {profile.notifications as string}
      </h2>

      <SubscriptionsTable subscriptions={subscriptions} intl={intl} />
    </>
  );
}
