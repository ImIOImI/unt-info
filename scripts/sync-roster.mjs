#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Refresh names, ranks and portraits from MightPulse.
 *
 *  Run it: npm run sync:roster   (add --force to re-download every avatar)
 *
 *  src/content/legions.json says WHO is where, by governor_id. Everything
 *  else about a player — how their name is spelled today, what rank they
 *  hold, which portrait they use — belongs to the game, so this script
 *  fetches it rather than letting anyone type it.
 *
 *  That is not pedantry. Kingshot names carry characters a human copy
 *  silently mangles: 15 of the first 40 names on this site were typed with
 *  a normal space where the game uses U+00A0, which looks identical and is
 *  not the same string. An id cannot be mistyped that way.
 *
 *  Costs one API call for the whole alliance, plus one image fetch per
 *  portrait we do not already have.
 * ─────────────────────────────────────────────────────────────────────────
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KID = 976;
const TAG = 'UNT';
const API = `https://api.mightpulse.com/v1/alliances/${KID}/${TAG}?include=info,roster`;
/** Avatar paths are relative; this host 302s them to the game's CDN. */
const CDN = 'https://mightpulse.com';

const ROOT = path.resolve(import.meta.dirname, '..');
const LEGIONS = path.join(ROOT, 'src/content/legions.json');
const ROSTER = path.join(ROOT, 'src/content/roster.json');
const AVATARS = path.join(ROOT, 'src/avatars');

const force = process.argv.includes('--force');

/** Every entry in the file that names a player, wherever it is nested. */
function* players(node) {
  if (Array.isArray(node)) { for (const v of node) yield* players(v); return; }
  if (node && typeof node === 'object') {
    if ('id' in node) { yield node; return; }
    for (const v of Object.values(node)) yield* players(v);
  }
}

const token = (await fs.readFile(path.join(os.homedir(), '.mightpulse-token'), 'utf8')).trim();

const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
if (!res.ok) throw new Error(`alliance fetch failed: ${res.status} ${res.statusText}`);
const body = await res.json();
const members = body.members ?? [];
if (!members.length) throw new Error('alliance returned no members — refusing to write');
const byId = new Map(members.map((m) => [m.governor_id, m]));
console.log(`roster: ${members.length} members`);

const legions = JSON.parse(await fs.readFile(LEGIONS, 'utf8'));
const entries = [...players(legions)];

const roster = {};
const gone = [];
const unresolved = [];
const wanted = [];

for (const e of entries) {
  if (e.id === null) { unresolved.push(e._name); continue; }
  const m = byId.get(e.id);
  if (!m) { gone.push(`${e.id} (${e._name})`); continue; }

  // The file's copy of the name is a convenience for whoever edits it, so
  // it is rewritten from the API every run and can never drift.
  e._name = m.nick_name;

  const custom = m.avatar_url?.startsWith('/cdn/');
  roster[e.id] = {
    name: m.nick_name,
    rank: m.alliance_rank_label,
    avatar: custom ? `${e.id}.png` : null,
  };
  if (custom) wanted.push({ id: e.id, url: m.avatar_url });
}

await fs.mkdir(AVATARS, { recursive: true });
let got = 0, skipped = 0;
for (const { id, url } of wanted) {
  const dest = path.join(AVATARS, `${id}.png`);
  if (!force && existsSync(dest)) { skipped++; continue; }
  const img = await fetch(CDN + url, { redirect: 'follow' });
  if (!img.ok) { console.warn(`  avatar ${id}: ${img.status}`); continue; }
  const buf = Buffer.from(await img.arrayBuffer());
  if (buf.length < 512) { console.warn(`  avatar ${id}: suspiciously small, skipped`); continue; }
  await fs.writeFile(dest, buf);
  got++;
  await new Promise((r) => setTimeout(r, 120)); // stay well inside 60/min
}

await fs.writeFile(LEGIONS, JSON.stringify(legions, null, 2) + '\n');
await fs.writeFile(ROSTER, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  kingdom: KID, tag: TAG,
  players: roster,
}, null, 2) + '\n');

const stock = entries.filter((e) => e.id && roster[e.id] && !roster[e.id].avatar).length;
console.log(`placed ${entries.length} · resolved ${Object.keys(roster).length}`);
console.log(`avatars: ${got} downloaded, ${skipped} already present, ${stock} on a stock icon`);

// A roster problem is the point of running this, so it is loud and it
// fails the build rather than scrolling past in a log.
if (gone.length) console.error(`\nNO LONGER IN THE ALLIANCE:\n  ${gone.join('\n  ')}`);
if (unresolved.length) console.error(`\nNEVER MATCHED TO AN ACCOUNT:\n  ${unresolved.join('\n  ')}`);
if (gone.length || unresolved.length) {
  console.error('\nFix src/content/legions.json — a name on the team sheet that nobody can find in game is worse than a gap.');
  process.exitCode = 1;
}
