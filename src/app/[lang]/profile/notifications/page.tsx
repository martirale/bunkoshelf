import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getUserSubscriptions } from "@/actions/web-push";
import SubscriptionsTable from "@/components/profile/SubscriptionsTable";
import { BellIcon } from "lucide-react";
import type { Locale, DictionarySection } from "@/lib/types";

interface NotificationsPageProps {
  params: Promise<{ lang: string }>;
}

function NotificationsSkeleton() {
  return (
    <div>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-48 w-full rounded-lg bg-sand animate-pulse" />
    </div>
  );
}

async function NotificationsContent({ params }: NotificationsPageProps) {
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

export default function NotificationsPage({ params }: NotificationsPageProps) {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContent params={params} />
    </Suspense>
  );
}
