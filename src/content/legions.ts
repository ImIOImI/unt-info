/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ORDER OF BATTLE — who plays Swordland, and where.
 *
 *  Two files behind this one, because they change on different clocks:
 *
 *    legions.json  Hand-edited. WHO is in which zone doing what, by
 *                  governor_id. The `_name` beside each id is there so the
 *                  file is readable; it is rewritten by the sync script and
 *                  is never the source of truth.
 *
 *    roster.json   Generated. Never hand-edit. Current names, ranks and
 *                  portrait filenames, straight from MightPulse.
 *
 *  `npm run sync:roster` refreshes the second from the first.
 *
 *  Why ids and not names: Kingshot names carry characters a human copy
 *  mangles silently. Fifteen of the first forty names on this site were
 *  typed with a normal space where the game uses U+00A0 — identical on
 *  screen, a different string underneath. Players also rename themselves.
 *  An id survives both.
 *
 *  `holds` is the building that player locks down. Where a building has a
 *  twin, `qual` says which one — the four Abbeys by zone colour, the two
 *  Sanctums by west and east. Both are keys into qual.* in the locales, so
 *  word order stays the translator's to decide.
 *
 *  Zone keys must match EVENT.swordland.plan.zones in event.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */
import legionsData from './legions.json';
import rosterData from './roster.json';

/** One person as the team sheet places them. */
export type Player = {
  /** MightPulse governor_id, or null for someone we could not find in game. */
  id: number | null;
  /** Exactly what the game prints. From roster.json where we have an id. */
  name: string;
  /** Alliance rank, R1–R5 or Leader. Unknown for an unresolved player. */
  rank: string | null;
  /** File stem in src/avatars/, or null — stock icon, or nobody found. */
  avatar: string | null;
  /**
   * True when no account matched the name in the operation order. They stay
   * on the sheet, because dropping them would contradict the order's own
   * headcount, but the page marks them and the sync script keeps complaining.
   */
  unverified: boolean;
  holds?: string;
  qual?: string;
};

export type Zone = {
  lead: Player;
  holders: readonly Player[];
  flex: readonly Player[];
};

export type Legion = {
  n: number;
  zones: Record<string, Zone>;
  subs: readonly Player[];
};

type RawPlayer = {
  id: number | null; _name: string; unverified?: boolean;
  holds?: string; qual?: string;
};

const ROSTER = rosterData.players as Record<string, {
  name: string; rank: string | null; avatar: string | null;
}>;

/** When we have an id the game's copy wins; otherwise fall back to the order. */
function hydrate(p: RawPlayer): Player {
  const known = p.id !== null ? ROSTER[String(p.id)] : undefined;
  return {
    id: p.id,
    name: known?.name ?? p._name,
    rank: known?.rank ?? null,
    avatar: known?.avatar ?? null,
    unverified: p.unverified === true || (p.id !== null && !known),
    ...(p.holds ? { holds: p.holds } : {}),
    ...(p.qual ? { qual: p.qual } : {}),
  };
}

export const LEGIONS: readonly Legion[] = (legionsData as {
  n: number;
  zones: Record<string, { lead: RawPlayer; holders: RawPlayer[]; flex: RawPlayer[] }>;
  subs: RawPlayer[];
}[]).map((l) => ({
  n: l.n,
  zones: Object.fromEntries(Object.entries(l.zones).map(([k, z]) => [k, {
    lead: hydrate(z.lead),
    holders: z.holders.map(hydrate),
    flex: z.flex.map(hydrate),
  }])),
  subs: l.subs.map(hydrate),
}));

/** When the roster was last pulled. Shown so a stale sheet is visible. */
export const ROSTER_FETCHED_AT = rosterData.fetchedAt;

/**
 * The letter on a portrait tile when no picture exists. Half this roster
 * starts with a decorative bracket or a tag, so the first CHARACTER is
 * usually the wrong answer — the first letter or digit is the one a player
 * recognises. Falls back to the raw first character for a name with neither.
 */
export const initial = (name: string): string =>
  name.match(/[\p{L}\p{N}]/u)?.[0] ?? name.slice(0, 1);

/** Everyone in a zone, lead first — the order the zone card lists them. */
export const zoneRoll = (z: Zone): readonly Player[] =>
  [z.lead, ...z.holders, ...z.flex];

/** Headcount of a Legion's starters, so the page never hard-codes 30. */
export const starters = (l: Legion): number =>
  Object.values(l.zones).reduce((n, z) => n + zoneRoll(z).length, 0);

/**
 * A zone's objectives in the order it takes them — the "Priority" line the
 * Legion 2 order spells out. Derived from the team sheet rather than
 * written down somewhere that could disagree with it.
 */
export const priority = (z: Zone): readonly Player[] =>
  [z.lead, ...z.holders].filter((p) => p.holds);
