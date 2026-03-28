import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import SidebarMisc from "@/components/ui/SidebarMisc";
import ProfileNav from "@/components/profile/ProfileNav";
import { UserRoundIcon } from "lucide-react";
import type { Locale, DictionarySection } from "@/lib/types";

interface ProfileLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  const user = await verifySession();

  const profile = intl.profile as DictionarySection;

  return (
    <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
      <SidebarMisc>
        {!user || !user.name ? (
          <h2 className="flex items-center text-onix">
            <UserRoundIcon size={28} className="mr-2" />
            {profile.title as string}
          </h2>
        ) : (
          <h2 className="flex items-center text-onix">
            <UserRoundIcon size={28} className="mr-2" />
            {profile.greeting as string} {user.name}
          </h2>
        )}

        <ProfileNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto">
        <div className="mb-24 md:mb-4">{children}</div>
      </div>
    </div>
  );
}
