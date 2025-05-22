import { getDictionary } from "@/lib/i18n/Dictionary";
import LoginForm from "./LoginForm";
import MainLogo from "@/ui/MainLogo";

export default async function LoginPage({ params }) {
  const { lang = "es" } = await params;

  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/initAdmin`, {
    cache: "no-store",
  });

  const intl = await getDictionary(lang);

  return (
    <div className="mt-16 p-4 flex flex-col items-center">
      <MainLogo width={300} height={60} />
      <LoginForm lang={lang} intl={intl} />
    </div>
  );
}
