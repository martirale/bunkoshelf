import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getUserSubscriptions } from "@/actions/web-push";
import SubscriptionsTable from "@/components/profile/SubscriptionsTable";
import { BellIcon } from "lucide-react";

export default async function NotificationsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();
  if (!user) return <p>No autorizado</p>;

  const { subscriptions = [] } = await getUserSubscriptions();

  return (
    <>
      <h2 className="flex items-center mb-4">
        <BellIcon size={28} className="mr-2" />
        {intl.profile.notifications}
      </h2>

      <SubscriptionsTable subscriptions={subscriptions} intl={intl} />
    </>
  );
}
