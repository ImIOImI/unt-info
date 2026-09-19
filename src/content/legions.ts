/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ORDER OF BATTLE — who plays Swordland, and where.
 *
 *  Kept out of event.ts because it is a different kind of fact: event.ts is
 *  the rules and the shape of the plan, this is the roster, and the roster
 *  changes every cycle.
 *
 *  `name` is exactly what the game shows, special characters and all.
 *  Uppercasing or transliterating it would break the one job this section
 *  has, which is letting a player match a face to a name in chat. Every
 *  name below was checked against the live roster
 *  (/alliances/976/UNT?include=roster) rather than typed from the order.
 *
 *  `avatar` is the file stem in src/avatars/ — an ASCII form of the same
 *  name, because a filename cannot carry Cherokee syllabics or Arabic. It
 *  doubles as what a player types to find that person in game. A missing
 *  file just renders a lettered tile, so nothing breaks.
 *
 *  `holds` is the building that player locks down. Where a building has a
 *  twin, `qual` says which one — the four Abbeys are told apart by zone
 *  colour, the two Sanctums by west and east. Both are keys into qual.* in
 *  the locales, so word order is the translator's to decide.
 *
 *  The phase a building appears in is NOT repeated here — the page reads it
 *  from EVENT.swordland.buildings, so a holder whose building is not on the
 *  board yet is shown as waiting rather than looking idle.
 *
 *  Zone keys must match EVENT.swordland.plan.zones in event.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Player = {
  name: string;
  avatar: string;
  /** Building key from EVENT.swordland.buildings. Leads hold one too. */
  holds?: string;
  /** Which of a pair: a zone colour for Abbeys, west/east for Sanctums. */
  qual?: string;
};

export type Zone = {
  lead: Player;
  /** Everyone else with a named building. Order is the order shown. */
  holders: readonly Player[];
  /**
   * Rallies, reinforcement, Undercellars and Loot — the duties are the
   * same in every zone and are listed once, under the standing orders.
   */
  flex: readonly Player[];
};

export type Legion = {
  n: number;
  zones: Record<string, Zone>;
  /** The ready reserve. Not attached to a zone until they are called in. */
  subs: readonly Player[];
};

export const LEGIONS: readonly Legion[] = [
  {
    n: 1,
    zones: {
      purple: {
        lead: { name: 'JTLomo', avatar: 'jtlomo', holds: 'belltower' },
        holders: [
          { name: 'Supportᵁᴺᵀ', avatar: 'support', holds: 'abbey', qual: 'purple' },
          { name: '༺ᴵ ᵃᵐ Qᴜєєɴ༻ᵁᴺᵀ', avatar: 'iamqueen', holds: 'mercenary' },
        ],
        flex: [
          { name: 'AkkiLa420BuBuᵁᴺᵀ', avatar: 'akkila420bubu' },
          { name: 'AndreBorges ᵁᴺᵀ', avatar: 'andreborges' },
          { name: 'raV', avatar: 'rav' },
          { name: 'domino', avatar: 'domino' },
          { name: 'Ꭰøɴ Ꭹass2M ᴸᴬᴴ', avatar: 'donyass2m' },
        ],
      },
      blue: {
        lead: { name: 'midgemarine', avatar: 'midgemarine', holds: 'sanctum', qual: 'west' },
        holders: [
          { name: 'BimBam', avatar: 'bimbam', holds: 'abbey', qual: 'blue' },
        ],
        flex: [
          { name: 'SmackBuBuᵁᴺᵀ', avatar: 'smackbubu' },
          { name: 'Uh Angry Gary', avatar: 'uhangrygary' },
          { name: '༺༒ Maximus༒༻ᵁᴺᵀ', avatar: 'maximus' },
          { name: 'Don t ᵁᴺᵀerstand', avatar: 'dontunterstand' },
          { name: 'marimo zoro', avatar: 'marimozoro' },
        ],
      },
      green: {
        lead: { name: 'Duvyverse ᵁᴺᵀ', avatar: 'duvyverse', holds: 'sanctum', qual: 'east' },
        holders: [
          { name: 'Gonzo', avatar: 'gonzo', holds: 'abbey', qual: 'green' },
        ],
        flex: [
          { name: 'Ron Swanson', avatar: 'ronswanson' },
          { name: 'V4Vixxen ᵁᴺᵀ', avatar: 'v4vixxen' },
          { name: 'Henners', avatar: 'henners' },
          { name: 'fady 88', avatar: 'fady88' },
          { name: 'TroyIsMetal', avatar: 'troyismetal' },
        ],
      },
      yellow: {
        // The operation order writes this lead as "PickYourToe"; the game
        // prints PickYourFateᵁᴺᵀ, which is what anyone searching chat will
        // type, so that is what the page shows.
        lead: { name: 'PickYourFateᵁᴺᵀ', avatar: 'pickyourfate', holds: 'stables' },
        holders: [
          { name: 'Demo', avatar: 'demo', holds: 'abbey', qual: 'yellow' },
          { name: 'Zamochᵁᴺᵀ', avatar: 'zamoch', holds: 'reformation' },
        ],
        flex: [
          { name: 'Boshtoiseᵁᴺᵀ', avatar: 'boshtoise' },
          { name: 'Pink Panther', avatar: 'pinkpanther' },
          { name: 'Ꭰøɴ Ꮇaz ᵁᴺᵀ', avatar: 'donmaz' },
          { name: 'Ally', avatar: 'ally' },
          { name: 'LordEBee', avatar: 'lordebee' },
        ],
      },
    },
    subs: [
      { name: 'Drake Taᵁᴺᵀ', avatar: 'draketa' },
      { name: 'LordDan91', avatar: 'lorddan91' },
      { name: 'Freedom', avatar: 'freedom' },
      { name: 'Sartorius', avatar: 'sartorius' },
      { name: 'Khalid1318', avatar: 'khalid1318' },
      { name: 'Loricifero', avatar: 'loricifero' },
      { name: 'Otacon', avatar: 'otacon' },
      { name: 'Matt ᴾᴿᴹ', avatar: 'mattprm' },
      { name: 'Sandro', avatar: 'sandro' },
      { name: 'ThePint', avatar: 'thepint' },
    ],
  },
];

/**
 * The letter on a portrait tile when no picture exists. Half this roster
 * starts with a decorative bracket or a tag, so the first CHARACTER is
 * usually the wrong answer — the first letter or digit is the one a player
 * recognises. Falls back to the raw first character for a name that has
 * neither.
 */
export const initial = (name: string): string =>
  name.match(/[\p{L}\p{N}]/u)?.[0] ?? name.slice(0, 1);

/** Everyone in a zone, lead first — the order the zone card lists them. */
export const zoneRoll = (z: Zone): readonly Player[] =>
  [z.lead, ...z.holders, ...z.flex];

/** Headcount of a Legion's starters, so the page never hard-codes 30. */
export const starters = (l: Legion): number =>
  Object.values(l.zones).reduce((n, z) => n + zoneRoll(z).length, 0);
