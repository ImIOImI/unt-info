/**
 * ─────────────────────────────────────────────────────────────────────────
 *  WHO PLAYS SWORDLAND.
 *
 *  Kept out of event.ts because it is a different kind of fact: event.ts is
 *  the rules and the plan, this is the roster, and the roster changes every
 *  cycle.
 *
 *  `name` is exactly what the game shows, special characters and all.
 *  `avatar` is the file stem in src/avatars/ — an ASCII form of the same
 *  name, because a filename cannot carry Cherokee syllabics or Arabic. It
 *  doubles as what a player types to find that person in game.
 *
 *  `rank` is optional and only marks the R4s and the leader, who get a
 *  highlighted tile so a player can see at a glance who to ask.
 *
 *  Names come from the MightPulse API — /alliances/976/UNT?include=roster
 *  returns the 100 members at `.members[]`. To add a face, drop a PNG at
 *  src/avatars/<avatar>.png; no code change.
 *
 *  The squad keys must match EVENT.swordland.teams[].key in event.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Player = {
  name: string;
  avatar: string;
  rank?: 'R4' | 'Leader';
};

export type Squad = 'attack' | 'jump' | 'support';

export const LEGIONS: readonly {
  n: number;
  squads: Record<Squad, readonly Player[]>;
}[] = [
  { n: 1, squads: { attack: [], jump: [], support: [] } },
  { n: 2, squads: { attack: [], jump: [], support: [] } },
];

export const SQUAD_ORDER = ['attack', 'jump', 'support'] as const;
