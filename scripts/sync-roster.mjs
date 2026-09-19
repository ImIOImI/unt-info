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
 *  Players move between alliances constantly and are back before the
 *  event, so sitting outside UNT today says nothing about whether somebody
 *  plays on Sunday. Anyone named in the operation order belongs on the
 *  page, and this script resolves them wherever they currently are: the
 *  alliance roster in one call for the many, then one call each for the
 *  handful who have wandered off.
 * ─────────────────────────────────────────────────────────────────────────
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KID = 976;
const TAG = 'UNT';
const API = 'https://api.mightpulse.com/v1';
/** Avatar paths are relative; this host 302s them to the game's CDN. */
const CDN = 'https://mightpulse.com';

const ROOT = path.resolve(import.meta.dirname, '..');
const LEGIONS = path.join(ROOT, 'src/content/legions.json');
const ROSTER = path.join(ROOT, 'src/content/roster.json');
const AVATARS = path.join(ROOT, 'src/avatars');

const force = process.argv.includes('--force');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every entry in the file that names a player, wherever it is nested. */
function* players(node) {
  if (Array.isArray(node)) { for (const v of node) yield* players(v); return; }
  if (node && typeof node === 'object') {
    if ('id' in node) { yield node; return; }
    for (const v of Object.values(node)) yield* players(v);
  }
}

const token = (await fs.readFile(path.join(os.homedir(), '.mightpulse-token'), 'utf8')).trim();
const auth = { Authorization: `Bearer ${token}` };

const res = await fetch(`${API}/alliances/${KID}/${TAG}?include=info,roster`, { headers: auth });
if (!res.ok) throw new Error(`alliance fetch failed: ${res.status} ${res.statusText}`);
const body = await res.json();
const members = body.members ?? [];
if (!members.length) throw new Error('alliance returned no members — refusing to write');
const byId = new Map(members.map((m) => [m.governor_id, m]));
console.log(`${TAG} roster: ${members.length} members`);

const legions = JSON.parse(await fs.readFile(LEGIONS, 'utf8'));
const entries = [...players(legions)];

const roster = {};
const elsewhere = [];   // plays for us, currently in another alliance
const nameOnly = [];    // no account found — the order's spelling is all we have
const wanted = [];

for (const e of entries) {
  if (e.id === null) { nameOnly.push(e._name); continue; }

  let name, rank, avatarUrl, alliance;
  const m = byId.get(e.id);
  if (m) {
    ({ nick_name: name, alliance_rank_label: rank, avatar_url: avatarUrl } = m);
    alliance = TAG;
  } else {
    // Not in UNT right now. Normal — look them up directly.
    await pause(1100); // 60/min
    const r = await fetch(`${API}/players/${e.id}`, { headers: auth });
    if (!r.ok) { nameOnly.push(`${e._name} (id ${e.id} → HTTP ${r.status})`); continue; }
    const p = (await r.json()).player;
    name = p.nick_name;
    rank = p.alliance?.rank_label ?? null;
    avatarUrl = p.avatar_url;
    alliance = p.alliance?.abbr ?? null;
    elsewhere.push(`${name} → ${alliance ?? 'no alliance'}`);
  }

  // The file's copy of the name is a convenience for whoever edits it, so
  // it is rewritten from the API every run and can never drift.
  e._name = name;
  delete e.unverified;

  const custom = avatarUrl?.startsWith('/cdn/');
  roster[e.id] = { name, rank, alliance, avatar: custom ? `${e.id}.png` : null };
  if (custom) wanted.push({ id: e.id, url: avatarUrl });
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
  await pause(120);
}

// Record in the file itself that nobody has ever matched these to an account.
for (const e of entries) if (e.id === null) e.unverified = true;

await fs.writeFile(LEGIONS, JSON.stringify(legions, null, 2) + '\n');
await fs.writeFile(ROSTER, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  kingdom: KID, tag: TAG,
  players: roster,
}, null, 2) + '\n');

const stock = Object.values(roster).filter((p) => !p.avatar).length;
console.log(`placed ${entries.length} · resolved ${Object.keys(roster).length}`);
console.log(`avatars: ${got} downloaded, ${skipped} already present, ${stock} on a stock icon`);

// Informational, not a problem: people swap alliances between events.
if (elsewhere.length) {
  console.log(`\nCurrently outside ${TAG} (${elsewhere.length}) — back before the event:`);
  for (const line of elsewhere) console.log(`  ${line}`);
}

// Worth a second look, because a name nobody can find is a name nobody can
// search for in chat either. Not fatal — the page still shows it as written.
if (nameOnly.length) {
  console.log(`\nNo account found, showing the name as written (${nameOnly.length}):`);
  for (const n of nameOnly) console.log(`  ${n}`);
  console.log('If one of these is a typo, fixing it in legions.json earns them a portrait.');
}
