import { ui } from './ui';

export function useTranslations(lang: keyof typeof ui = "es") {
  return function t(key: keyof typeof ui[typeof lang]) {
    return (ui[lang] as any)[key];
  }
}