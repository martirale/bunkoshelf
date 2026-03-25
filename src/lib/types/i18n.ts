export type Locale = "es" | "en";

export interface DictionarySection {
  [key: string]: string | DictionarySection;
}

export type Dictionary = Record<string, DictionarySection>;
