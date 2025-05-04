"use client";

import { createContext, useContext } from "react";

// Create the context
export const TranslationContext = createContext(null);

// Create a provider component
export function TranslationProvider({ dictionary, children }) {
  return (
    <TranslationContext.Provider value={dictionary}>
      {children}
    </TranslationContext.Provider>
  );
}

// Create a hook to use the dictionary
export function useTranslation() {
  const dictionary = useContext(TranslationContext);

  if (!dictionary) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  return dictionary;
}
