import "server-only";
import type { Locale, Dictionary } from "@/lib/types";

const dictionaries: Record<Locale, () => Promise<Record<string, unknown>[]>> = {
  en: () =>
    Promise.all([
      import("./dictionaries/en/home.json").then((m) => m.default),
      import("./dictionaries/en/misc.json").then((m) => m.default),
      import("./dictionaries/en/login.json").then((m) => m.default),
      import("./dictionaries/en/noauth.json").then((m) => m.default),
      import("./dictionaries/en/sidebar.json").then((m) => m.default),
      import("./dictionaries/en/libraries.json").then((m) => m.default),
      import("./dictionaries/en/manga.json").then((m) => m.default),
      import("./dictionaries/en/reader.json").then((m) => m.default),
      import("./dictionaries/en/favorites.json").then((m) => m.default),
      import("./dictionaries/en/profile.json").then((m) => m.default),
      import("./dictionaries/en/settings.json").then((m) => m.default),
      import("./dictionaries/en/alerts.json").then((m) => m.default),
      import("./dictionaries/en/tooltip.json").then((m) => m.default),
      import("./dictionaries/en/toast.json").then((m) => m.default),
      import("./dictionaries/en/search.json").then((m) => m.default),
      import("./dictionaries/en/filters.json").then((m) => m.default),
      import("./dictionaries/en/push.json").then((m) => m.default),
      import("./dictionaries/en/months.json").then((m) => m.default),
      import("./dictionaries/en/stats.json").then((m) => m.default),
    ]),
  es: () =>
    Promise.all([
      import("./dictionaries/es/home.json").then((m) => m.default),
      import("./dictionaries/es/misc.json").then((m) => m.default),
      import("./dictionaries/es/login.json").then((m) => m.default),
      import("./dictionaries/es/noauth.json").then((m) => m.default),
      import("./dictionaries/es/sidebar.json").then((m) => m.default),
      import("./dictionaries/es/libraries.json").then((m) => m.default),
      import("./dictionaries/es/manga.json").then((m) => m.default),
      import("./dictionaries/es/reader.json").then((m) => m.default),
      import("./dictionaries/es/favorites.json").then((m) => m.default),
      import("./dictionaries/es/profile.json").then((m) => m.default),
      import("./dictionaries/es/settings.json").then((m) => m.default),
      import("./dictionaries/es/alerts.json").then((m) => m.default),
      import("./dictionaries/es/tooltip.json").then((m) => m.default),
      import("./dictionaries/es/toast.json").then((m) => m.default),
      import("./dictionaries/es/search.json").then((m) => m.default),
      import("./dictionaries/es/filters.json").then((m) => m.default),
      import("./dictionaries/es/push.json").then((m) => m.default),
      import("./dictionaries/es/months.json").then((m) => m.default),
      import("./dictionaries/es/stats.json").then((m) => m.default),
    ]),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const loader = dictionaries[locale];

  if (!loader) {
    console.error(`Invalid locale: ${locale}`);
    return {};
  }

  const modules = await loader();
  return Object.assign({}, ...modules);
};
