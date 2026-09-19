// @ts-check
import { defineConfig } from 'astro/config';

// Locales mirror kingshot-rally-web/src/i18n so both sites offer the same set.
export default defineConfig({
  // Project site on GitHub Pages, so everything is served under /unt-info.
  // Anything building a URL by hand must go through localePath() or asset()
  // in src/i18n/ui.ts, which apply this prefix.
  site: 'https://imioimi.github.io',
  base: '/unt-info',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'tr', 'fr', 'pl', 'zh', 'ar', 'ja', 'es'],
    routing: { prefixDefaultLocale: false },
  },
});
