import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "@/components/profile/ProfileForm";
import { UserRoundPenIcon } from "lucide-react";
import type { Locale, DictionarySection } from "@/lib/types";

interface UpdateProfilePageProps {
  params: Promise<{ lang: string }>;
}

function ProfileFormSkeleton() {
  return (
    <div>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-lg bg-sand animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function UpdateProfileContent({ params }: UpdateProfilePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const profile = intl.profile as DictionarySection;

  return (
    <>
      <h2 className="flex items-center mb-4">
        <UserRoundPenIcon size={28} className="mr-2" />
        {profile.updateProfile as string}
      </h2>
      <ProfileForm lang={lang} user={user} intl={intl} />
    </>
  );
}

export default function UpdateProfilePage({ params }: UpdateProfilePageProps) {
  return (
    <Suspense fallback={<ProfileFormSkeleton />}>
      <UpdateProfileContent params={params} />
    </Suspense>
  );
}
