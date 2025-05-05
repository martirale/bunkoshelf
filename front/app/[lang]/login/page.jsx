import { getDictionary } from "@/lib/i18n/serverDictionary";
import LoginForm from "./LoginForm";

export default async function LoginPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <LoginForm lang={lang} intl={intl} />
    </div>
  );
}
