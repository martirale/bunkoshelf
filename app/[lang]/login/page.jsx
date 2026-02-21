import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/Dictionary";
import LoginForm from "./LoginForm";
import MainLogo from "@/components/ui/MainLogo";
import { initAdmin } from "@/actions/init-admin";

export default async function LoginPage({ params }) {
  const { lang = "es" } = await params;

  await connection();
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
