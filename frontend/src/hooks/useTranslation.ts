import { useSettingsStore } from "../store/useSettingsStore";
import { ru } from "../locales/ru";
import { en } from "../locales/en";

const dictionaries = { en, ru };

export type TranslationKey = keyof typeof ru;
export type Language = "ru" | "en";

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  const t = (key: TranslationKey): string => {
    const dictionary = dictionaries[language];
    return dictionary[key] || key;
  };

  return { t, language };
}

export function translate(key: TranslationKey, language: Language) {
  const dictionary = dictionaries[language];
  return dictionary[key] || key;
}
