import { getDictionary } from "@/lib/i18n/Dictionary";
import AlertBox from "@/ui/AlertBox";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <AlertBox
        title={intl.toastDev.appDevelopTt}
        description={intl.toastDev.appDevelop}
        variant="warning"
      />
    </div>
  );
}
