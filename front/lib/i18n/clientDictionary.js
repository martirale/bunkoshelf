"use client";

import { useState, useEffect } from "react";

// Client dictionaries are pre-loaded and bundled with the client code
const dictionaries = {
  en: async () => (await import("./dictionaries/en.json")).default,
  es: async () => (await import("./dictionaries/es.json")).default,
};

// React hook for client components
export function useClientDictionary(locale) {
  const [intl, setIntl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDictionary() {
      try {
        setLoading(true);
        // Make sure we have a valid locale, default to 'es'
        const validLocale = locale && dictionaries[locale] ? locale : "es";
        const dict = await dictionaries[validLocale]();
        setIntl(dict);
      } catch (error) {
        console.error("Error loading dictionary:", error);
        // Fallback to empty object to prevent crashes
        setIntl({});
      } finally {
        setLoading(false);
      }
    }

    loadDictionary();
  }, [locale]);

  return { intl, loading };
}
