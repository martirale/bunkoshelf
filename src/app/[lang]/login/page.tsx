import { getDictionary } from "@/lib/i18n/Dictionary";
import LoginForm from "./LoginForm";
import MainLogo from "@/components/ui/MainLogo";
import { initAdmin } from "@/actions/init-admin";
import type { Locale } from "@/lib/types";

interface LoginPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang = "es" } = await params;

  await initAdmin();

  const intl = await getDictionary(lang);

  return (
    <>
      <div className="mt-16 p-4 flex flex-col items-center">
        <MainLogo width={300} height={60} />
        <LoginForm lang={lang} intl={intl} />
      </div>
    </>
  );
}
