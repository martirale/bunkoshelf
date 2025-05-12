import { getDictionary } from "@/lib/i18n/serverDictionary";
import {
  LibraryBig,
  BookMarked,
  BookPlus,
  BookDown,
  BookCheck,
} from "lucide-react";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return <></>;
}
