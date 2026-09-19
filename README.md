# UNT — alliance site

Informational site for UNITY (UNT) in Kingshot, kingdom 976. Built because
in-game chat is too short and its translator is unreliable: every page is
written in nine languages and leans on screenshots so a player can follow it
without reading much at all.

Static Astro. No client framework, no database, ~1 KB of JavaScript.

Design and scaffolding are shared with
[lah-info](https://github.com/ImIOImI/lah-info); the content is UNITY's own.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Where things live

| What | Where |
|---|---|
| **Event facts and our plan — the file you edit** | `src/content/event.ts` |
| The order of battle — who is in which zone | `src/content/legions.json` |
| Names, ranks, portraits (generated) | `src/content/roster.json` |
| Translated sentences | `src/i18n/locales/<lang>.json` |
| Player portraits | `src/avatars/<avatar>.png` |
| Screenshots and the battlefield map | `src/shots/` |
| Page bodies | `src/components/page/` |
| Design tokens (colour, type, spacing) | `src/styles/global.css` |

## Adding the real details

`src/content/event.ts` holds everything language-neutral — numbers, times,
names. Anything still wrapped in `TODO()` renders on the page as an orange
badge, so an unanswered question is impossible to miss and never ships looking
like a real answer.

The file is split in two on purpose. Everything above the "UNITY's plan"
divider is how the *game* works and is true for every alliance. Everything
below it — the four zones, the standing orders, the flex duties — is how *we*
play it. That is the half to change when the strategy changes, and the page
keeps the two apart so a reader can tell which is which.

## Changing the roster

`src/content/legions.json` is the team sheet: two Legions, four zones each,
every player placed by **governor_id**. Move an id between zones, or swap one
in from the reserve, and you are done.

```bash
npm run sync:roster          # refresh names, ranks and portraits
npm run sync:roster -- --force   # re-download every avatar
```

That makes one API call for the whole alliance and rewrites
`src/content/roster.json`, downloading any portrait it does not already have
into `src/avatars/<governor_id>.png`. It also refreshes the `_name` beside
each id in `legions.json`, which exists purely so the file is readable — it
is never the source of truth.

**Why ids and not names.** Kingshot names carry characters a human copy
mangles. Fifteen of the first forty names on this site were typed with a
normal space where the game uses U+00A0: identical on screen, a different
string underneath. Players also rename themselves — the Yellow lead of Legion
1 is written "PickYourToe" in the operation order and `PickYourFateᵁᴺᵀ` in
game. An id survives both.

The script exits non-zero and names anyone it could not resolve, either
because they left the alliance or because no account matches. They still
render, marked with an orange `?`, because quietly dropping someone would
contradict the order's own headcount.

Headcounts are never written down. The page counts the team sheet, so moving
someone updates every number that mentions them. The zone priority chain is
read off the holders in card order for the same reason.

Players on a stock game icon keep a lettered tile — five identical default
portraits are worse than five distinct letters at the one job the tile has.

## Languages

`en, de, tr, fr, pl, zh, ar, ja, es` — the same set as
[kingshot-rally-timer](https://github.com/ImIOImI/kingshot-rally-timer), so a
player sees a familiar switcher across all our sites. Arabic renders
right-to-left.

Missing keys fall back to English one by one, so a partial language still
renders a complete page.

`npm run check:i18n` compares every locale against `en.json` — same keys, same
`{placeholders}`, nothing empty. It runs as part of `npm run build`, so CI will
not deploy a locale that has drifted. Translate the values and leave the
placeholders alone; numbers, times and names are injected from `event.ts` and
formatted per locale by `Intl`, so they are never written into a sentence.

Locales are added in three places: `astro.config.mjs`, `SUPPORTED` and `NAMES`
in `src/i18n/ui.ts`, and a new `src/i18n/locales/<lang>.json`.

## Deploying

GitHub Pages, via `.github/workflows/deploy.yml` on every push to `main`.
Served under `/unt-info`, which is why every internal URL goes through
`localePath()` or `asset()` in `src/i18n/ui.ts` rather than being written by
hand.
