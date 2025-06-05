import "server-only";

export const getDictionary = async (locale) => {
  const modules = await Promise.all([
    import(`./dictionaries/${locale}/home.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/misc.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/login.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/noauth.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/sidebar.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/libraries.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/manga.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/reader.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/favorites.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/profile.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/settings.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/alerts.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/tooltip.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/toast.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/search.json`).then((m) => m.default),
    import(`./dictionaries/${locale}/filters.json`).then((m) => m.default),
  ]);

  return Object.assign({}, ...modules);
};
