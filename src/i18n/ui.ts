// Language set and native names are copied from kingshot-rally-web/src/i18n
// so a player sees the same switcher on both sites.
export const SUPPORTED = ['en', 'de', 'tr', 'fr', 'pl', 'zh', 'ar', 'ja', 'es', 'pt'] as const;
export type Lang = (typeof SUPPORTED)[number];

export const NAMES: Record<Lang, string> = {
  en: 'English', de: 'Deutsch', tr: 'Türkçe', fr: 'Français', pl: 'Polski',
  zh: '中文', ar: 'العربية', ja: '日本語', es: 'Español', pt: 'Português',
};

export const RTL_LANGS = new Set<Lang>(['ar']);
export const isRtl = (lang: Lang) => RTL_LANGS.has(lang);

/** Locales whose headings and body need a Noto face Archivo cannot cover. */
export const SCRIPT_FONT: Partial<Record<Lang, string>> = {
  zh: 'Noto+Sans+SC:wght@400;700;900',
  ja: 'Noto+Sans+JP:wght@400;700;900',
  ar: 'Noto+Kufi+Arabic:wght@400;700;900',
};

import en from './locales/en.json';
import de from './locales/de.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';
import pl from './locales/pl.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import ja from './locales/ja.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const DICTS: Record<Lang, Record<string, string>> = { en, de, tr, fr, pl, zh, ar, ja, es, pt };

/** Returns the current language from a URL like /es/super-bear. */
export function langFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return (SUPPORTED as readonly string[]).includes(first) ? (first as Lang) : 'en';
}

/**
 * Translator for `lang`. Missing keys fall back to English so a partly
 * translated locale still renders a complete page.
 * `vars` fills {placeholders} with facts from src/content/event.ts.
 */
export function useTranslations(lang: Lang) {
  return function t(key: string, vars: Record<string, string | number> = {}): string {
    const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (m, name) =>
      name in vars ? String(vars[name]) : m,
    );
  };
}

/**
 * The site is served from a subdirectory on GitHub Pages, so every internal
 * URL needs that prefix. BASE_URL is "/" in dev and "/unt-info/" in the build;
 * strip the trailing slash so callers can append their own.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Prefixes a path with the base and the locale, except for the default locale. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.replace(/^\/+/, '');
  const locale = lang === 'en' ? '' : `/${lang}`;
  return `${BASE}${locale}/${clean}`;
}

/** Prefixes a file in public/ with the base, e.g. asset('favicon.svg'). */
export function asset(path: string): string {
  return `${BASE}/${path.replace(/^\/+/, '')}`;
}
