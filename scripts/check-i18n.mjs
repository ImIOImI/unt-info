/**
 * Checks every locale against English.
 *
 * Two ways a translation breaks quietly: a key goes missing, so that string
 * silently falls back to English and nobody notices; or a {placeholder} gets
 * translated or dropped, so a number, time or name never lands in the
 * sentence. Both survive a successful build, so they are checked here.
 *
 * Run with `npm run check:i18n`. CI runs it before the site is built.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../src/i18n/locales/', import.meta.url).pathname;
const load = (f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const en = load('en.json');
const enKeys = Object.keys(en).sort();
const locales = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'en.json').sort();

let failed = 0;

for (const file of locales) {
  const dict = load(file);
  const problems = [];

  const keys = Object.keys(dict).sort();
  const missing = enKeys.filter((k) => !(k in dict));
  const extra = keys.filter((k) => !(k in en));
  if (missing.length) problems.push(`missing ${missing.length}: ${missing.join(', ')}`);
  if (extra.length) problems.push(`not in en: ${extra.join(', ')}`);

  for (const key of enKeys) {
    if (!(key in dict)) continue;
    const want = placeholders(en[key]);
    const got = placeholders(dict[key]);
    if (want.join() !== got.join()) {
      problems.push(`${key}: placeholders {${want.join('} {')}} became {${got.join('} {')}}`);
    }
    if (typeof dict[key] !== 'string' || dict[key].trim() === '') {
      problems.push(`${key}: empty`);
    }
  }

  const name = file.replace('.json', '');
  if (problems.length) {
    failed++;
    console.error(`✗ ${name}`);
    for (const p of problems) console.error(`    ${p}`);
  } else {
    console.log(`✓ ${name}  ${keys.length} keys`);
  }
}

if (failed) {
  console.error(`\n${failed} locale(s) out of step with en.json`);
  process.exit(1);
}
console.log(`\nAll ${locales.length} locales match en.json (${enKeys.length} keys).`);
