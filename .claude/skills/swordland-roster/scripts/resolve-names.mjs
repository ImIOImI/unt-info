#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Turn the names somebody wrote down into governor_ids.
 *
 *    node resolve-names.mjs "JTLomo" "Saleh" "DaY"
 *    node resolve-names.mjs --wide "MSC" "GGs"      # search the kingdom
 *    node resolve-names.mjs --json "Ally"           # machine-readable
 *    node resolve-names.mjs --file names.txt        # one name per line
 *
 *  This exists because matching these names by eye is a trap. Three things
 *  go wrong, and all three have already bitten this repo:
 *
 *    1. Invisible characters. Kingshot names are full of U+00A0 and other
 *       spaces that look exactly like a normal one. Fifteen of the first
 *       forty names typed into this site by hand were wrong this way.
 *
 *    2. Short forms. Operation orders write "Saleh" for "ox Saleh ox" and
 *       "DaY" for "『 DaYı 』". A strict match finds neither.
 *
 *    3. Names that are not in the game at all. "PickYourToe" is a nickname
 *       for PickYourFateᵁᴺᵀ; "GGs" matches nobody on the server.
 *
 *  So every result carries HOW it matched, and anything less than certain
 *  is meant to go back to a human rather than be quietly accepted.
 * ─────────────────────────────────────────────────────────────────────────
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KID = 976;
const TAG = 'UNT';
const API = 'https://api.mightpulse.com/v1';
const CACHE = path.join(os.homedir(), '.cache/mightpulse/alliances');
const TTL_MS = 6 * 60 * 60 * 1000;

const argv = process.argv.slice(2);
const wide = argv.includes('--wide');
const asJson = argv.includes('--json');
const fileArg = argv.indexOf('--file');
let names = argv.filter((a) => !a.startsWith('--'));
if (fileArg !== -1) {
  const p = argv[fileArg + 1];
  names = (await fs.readFile(p, 'utf8')).split('\n').map((s) => s.trim()).filter(Boolean);
  names = names.filter((n) => n !== p);
}
if (!names.length) {
  console.error('usage: resolve-names.mjs [--wide] [--json] [--file names.txt] "Name" ...');
  process.exit(2);
}

const token = (await fs.readFile(path.join(os.homedir(), '.mightpulse-token'), 'utf8')).trim();

async function alliance(tag) {
  await fs.mkdir(CACHE, { recursive: true });
  const f = path.join(CACHE, `${KID}-${tag}.json`);
  if (existsSync(f)) {
    const st = await fs.stat(f);
    if (Date.now() - st.mtimeMs < TTL_MS) {
      return JSON.parse(await fs.readFile(f, 'utf8'));
    }
  }
  const res = await fetch(`${API}/alliances/${KID}/${tag}?include=info,roster`,
    { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    // A stale copy beats nothing when the API is having a moment.
    if (existsSync(f)) return JSON.parse(await fs.readFile(f, 'utf8'));
    throw new Error(`${tag}: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  await fs.writeFile(f, JSON.stringify(body, null, 2));
  return body;
}

/**
 * Letters chosen for their SHAPE, not their meaning. Kingshot players build
 * names out of Cherokee syllabics, small capitals and Cyrillic that happen
 * to look like Latin — Ꭰøɴ Ꮇaz is "Don Maz" written in three scripts.
 *
 * Unicode normalisation does not help: Ꭰ is Cherokee letter A, which merely
 * resembles a D, so NFKD leaves it alone and the strip-to-ASCII step then
 * deletes it. Deleting it turns "Ꭰøɴ Ꭺboood" into "boood", which matches
 * nothing. Mapping by appearance is the only thing that works here.
 */
const SHAPE = {
  // Cherokee used as Latin
  'Ꭰ': 'd', 'Ꭺ': 'a', 'Ꮇ': 'm', 'Ꭹ': 'y', 'Ꮿ': 'c',
  'Ꮆ': 'k', 'Ᏺ': 'p', 'Ꮋ': 'h', 'Ꮲ': 'r', 'Ꮺ': 's',
  'Ꮴ': 'w', 'Ꮾ': 'l', 'Ꮌ': 'e',
  // small capitals
  'ɴ': 'n', 'ᴜ': 'u', 'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c',
  'ᴅ': 'd', 'ᴇ': 'e', 'ɢ': 'g', 'ʜ': 'h', 'ɪ': 'i',
  'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ᴏ': 'o',
  'ᴘ': 'p', 'ʀ': 'r', 'ᴛ': 't', 'ᴠ': 'v', 'ᴡ': 'w',
  'ʏ': 'y', 'ᴢ': 'z', 'ꜰ': 'f', 'ǫ': 'q',
  // Cyrillic and Greek homoglyphs
  'є': 'e', 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p',
  'с': 'c', 'у': 'y', 'х': 'x', 'к': 'k', 'м': 'm',
  'т': 't', 'в': 'b', 'н': 'h', 'і': 'i', 'ѕ': 's',
  'ο': 'o', 'ι': 'i', 'ν': 'v', 'ρ': 'p', 'τ': 't',
  // Latin letters NFKD will not fold
  'ø': 'o', 'Ø': 'o', 'ı': 'i', 'ł': 'l', 'đ': 'd',
  'ð': 'd', 'þ': 'p', 'æ': 'ae', 'œ': 'oe', 'ß': 'ss',
  '×': 'x',
};
const SHAPE_RE = new RegExp(`[${Object.keys(SHAPE).join('')}]`, 'gu');
const fold = (s) => s.replace(SHAPE_RE, (c) => SHAPE[c]);

/**
 * Fold a name down to comparable letters: map the lookalikes, decompose so
 * ᵁᴺᵀ becomes UNT and accents detach, drop invisible spaces, keep a-z0-9.
 * Folded twice because NFKD can expose a lookalike that was hidden inside a
 * composed character.
 */
const norm = (s) => fold(fold(s).normalize('NFKD'))
  .replace(/[̀-ͯ]/g, '')
  .replace(/[   ​-‍﻿]/g, ' ')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

/** Dice coefficient on character bigrams — 1.0 identical, 0 nothing shared. */
function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = (x) => {
    const m = new Map();
    for (let i = 0; i < x.length - 1; i++) {
      const g = x.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ga = grams(a), gb = grams(b);
  let shared = 0;
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0);
  return (2 * shared) / ((a.length - 1) + (b.length - 1));
}

/** Alliance tags ride on the end of most names and are not part of them. */
const stripTag = (n) => n.replace(/(unt|lah|prm|bam|opc|nyx|hex|pro)+$/g, '');

function indexOf(members, tag) {
  return members
    .map((m) => ({ m, tag, n: norm(m.nick_name), s: stripTag(norm(m.nick_name)) }))
    // A name in a non-Latin script folds to "", and an empty needle is
    // inside every haystack — so it would match everything. Drop those from
    // the candidate pool; they can only be resolved by hand.
    .filter((c) => c.s.length > 0);
}

/** Tiers, most trustworthy first. The tier is the point of this script. */
function findIn(cands, written) {
  const w = norm(written);
  const ws = stripTag(w);
  if (!ws) return { tier: 'unmatchable-script', hits: [] };
  let hits = cands.filter((c) => c.n === w);
  if (hits.length) return { tier: 'exact', hits };
  hits = cands.filter((c) => c.s === ws);
  if (hits.length) return { tier: 'tag-insensitive', hits };
  hits = cands.filter((c) => c.s.startsWith(ws) || ws.startsWith(c.s));
  if (hits.length) return { tier: 'prefix', hits };
  hits = cands.filter((c) => c.n.includes(ws) || ws.includes(c.s));
  if (hits.length) return { tier: 'substring', hits };
  // Last resort: whoever looks closest. A near-miss surfaced for a human to
  // reject is far better than a silent "not found" that sends somebody on a
  // kingdom-wide hunt for a player who was in front of them all along.
  const scored = cands
    .map((c) => ({ c, score: Math.max(similarity(ws, c.s), similarity(w, c.n)) }))
    .filter((x) => x.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (scored.length) {
    return { tier: 'fuzzy', hits: scored.map((x) => x.c), scores: scored.map((x) => x.score) };
  }
  return { tier: 'none', hits: [] };
}

const unt = await alliance(TAG);
let cands = indexOf(unt.members ?? [], TAG);

const results = [];
for (const written of names) {
  let r = findIn(cands, written);
  results.push({ written, ...r });
}

// Only sweep the rest of the kingdom for names UNT could not explain — it
// is ~50 extra calls, and a Legion player is normally in UNT anyway.
if (wide && results.some((r) => r.hits.length === 0)) {
  const ranks = await (async () => {
    const f = path.join(os.homedir(), '.cache/mightpulse/ranks', `${KID}.json`);
    if (existsSync(f)) return JSON.parse(await fs.readFile(f, 'utf8'));
    const res = await fetch(`${API}/kingdoms/${KID}/ranks?limit=100`,
      { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, JSON.stringify(body, null, 2));
    return body;
  })();

  const tags = (ranks.boards ?? [])
    .find((b) => b.key === 'alliance_power')?.rows
    .filter((r) => (r.member_count ?? 0) >= 5)
    .map((r) => r.abbr)
    .filter((t) => t !== TAG) ?? [];

  process.stderr.write(`widening to ${tags.length} other alliances in ${KID}…\n`);
  for (const tag of tags) {
    if (!results.some((r) => r.hits.length === 0)) break;
    let body;
    try { body = await alliance(tag); } catch { continue; }
    const pool = indexOf(body.members ?? [], tag);
    for (const r of results) {
      if (r.hits.length) continue;
      const got = findIn(pool, r.written);
      if (got.hits.length) { r.tier = got.tier; r.hits = got.hits; }
    }
    await new Promise((res) => setTimeout(res, 1100)); // 60/min
  }
}

const out = results.map((r) => ({
  written: r.written,
  tier: r.tier,
  scores: r.scores,
  certain: r.hits.length === 1 && (r.tier === 'exact' || r.tier === 'tag-insensitive'),
  matches: r.hits.map((h) => ({
    governor_id: h.m.governor_id,
    name: h.m.nick_name,
    alliance: h.tag,
    rank: h.m.alliance_rank_label,
    power: h.m.power,
    inUnt: h.tag === TAG,
  })),
}));

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const r of out) {
    const flag = r.matches.length === 0 ? 'NO MATCH'
      : r.matches.length > 1 ? 'AMBIGUOUS'
      : r.certain ? 'ok' : 'CHECK';
    console.log(`${flag.padEnd(10)} ${JSON.stringify(r.written).padEnd(24)} ${r.tier}`);
    r.matches.forEach((m, i) => {
      const sc = r.scores ? ` ~${(r.scores[i] * 100).toFixed(0)}%` : '';
      console.log(`           -> ${m.governor_id}  ${JSON.stringify(m.name)}  ` +
        `[${m.alliance}${m.inUnt ? '' : ' — NOT IN UNT'}] ${m.rank ?? '?'}${sc}`);
    });
  }
  const bad = out.filter((r) => !r.certain).length;
  console.log(`\n${out.length} asked, ${out.length - bad} certain, ${bad} need a human.`);
}
