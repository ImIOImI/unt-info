/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE YOU FILL IN.
 *
 *  Everything here is language-neutral: numbers, times, names, IDs. The
 *  translated sentences in src/i18n/locales/*.json wrap around these values,
 *  so changing a number here updates all nine languages at once.
 *
 *  Anything still wrapped in TODO() renders on the page as a loud orange
 *  badge, so nothing ships as a confident-looking invention.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const TODO = (question: string) => `TODO: ${question}`;
export const isTodo = (v: unknown): v is string =>
  typeof v === 'string' && v.startsWith('TODO:');

export const EVENT = {
  alliance: {
    tag: 'UNT',
    /** What the tag stands for. Shown under the mark in the footer. */
    name: 'Unity',
    /** Kingshot kingdom number. */
    kingdom: '976',
  },

  /**
   * ─── Swordland Showdown ───────────────────────────────────────────────
   *
   * Alliance-vs-alliance, on its own map, one hour long. The mechanics
   * below are game facts and hold for everyone; how UNITY plays them is the
   * part that is ours, and it lives under "UNITY's plan" further down.
   *
   * Anything not confirmed is a TODO() so it shows as a badge instead of
   * shipping as a confident invention.
   */
  swordland: {
    /** Only the strongest N alliances by power may register at all. */
    topAlliances: 20,

    /**
     * A Legion is the unit that takes the field. An alliance may register
     * two; alliance rewards follow Legion 1's result, so Legion 1 takes the
     * stronger accounts. Personal rewards follow personal Relic Point rank
     * in both, which is why a seat in Legion 2 is still worth taking.
     */
    legion: {
      perAlliance: 2,
      mains: 30,
      subs: 10,
      /** Unclaimed main slots open to substitutes this far into the match. */
      subsAfterMinutes: 3,
    },

    matchMinutes: 60,

    /**
     * A known occurrence, in UTC, for the countdown on the page. Every other
     * one is this plus a multiple of `everyDays`.
     */
    schedule: {
      anchor: TODO('What date and time (UTC) is the next Swordland Showdown on 976?'),
      everyDays: 14,
      /** How long the countdown reads "running now" before it rolls over. */
      windowMinutes: 60,
    },

    /**
     * Joining does not mean you can act. The map is locked for the opening
     * few minutes — you are on the field and can do nothing with it.
     *
     * Note this is the same window in which unclaimed main slots open to the
     * substitutes (legion.subsAfterMinutes), so the roster being reinforced
     * is not final until it closes.
     */
    opening: {
      lockMinutes: 3,
    },

    /** Minutes. The heal cooldown is what forces the attack/support swap. */
    cooldowns: {
      /** Leaving mid-battle costs this long, but fully heals your troops. */
      heal: 12,
      teleport: 10,
      /** Holding the Royal Stables halves it. This is the halved figure. */
      teleportWithStables: 5,
    },

    /**
     * Relic Points per 10,000 enemy power defeated. Attacking pays about
     * twice what defending pays, which is the whole argument for spending
     * troops forward instead of sitting on a building.
     */
    payout: {
      attack: 80,
      defend: 40,
    },

    /**
     * When a building flips, this share of the alliance points banked on it
     * is still sitting there to be taken. The rest was already credited.
     */
    stealPercent: 50,

    /**
     * The three phases, by what unlocks. The clock markers are NOT documented
     * anywhere reliable — read them off a live match and replace the TODO()s.
     * Phase 1 is the only one known to start at the opening whistle.
     */
    phases: [
      { key: 'one', at: 0 },
      { key: 'two', at: 15 },
      { key: 'three', at: TODO('How many minutes in does each Undercellar wave arrive?') },
    ],

    /**
     * Every building on the map and what it pays, in Relic Points.
     *
     * `first` is the one-time First Control bonus for being first to fully
     * occupy it; `perMin` is the ongoing rate while you hold it. Alliance and
     * personal points are tracked separately and both are paid at once.
     *
     * `count` is how many of that building are on the map — it matters:
     * two Sanctums out-earn the single Swordshrine, which the page works out
     * from these numbers rather than asserting.
     *
     * `opensAtPhase` is which phase puts it on the board. `bonus` names a
     * standing effect while held; the text lives in bonus.<key>.
     *
     * Ordered by alliance first-capture value, richest first.
     */
    buildings: [
      { key: 'swordshrine', count: 1, opensAtPhase: 2,
        alliance: { first: 9000, perMin: 1800 },
        personal: { first: 4500, perMin: 900 }, bonus: null },
      { key: 'sanctum', count: 2, opensAtPhase: 1,
        alliance: { first: 6000, perMin: 1200 },
        personal: { first: 3000, perMin: 600 }, bonus: null },
      { key: 'abbey', count: 4, opensAtPhase: 1,
        alliance: { first: 3000, perMin: 600 },
        personal: { first: 1500, perMin: 300 }, bonus: null },
      { key: 'belltower', count: 1, opensAtPhase: 1,
        alliance: { first: 1200, perMin: 240 },
        personal: { first: 600, perMin: 120 }, bonus: 'capture' },
      { key: 'stables', count: 1, opensAtPhase: 1,
        alliance: { first: 1200, perMin: 240 },
        personal: { first: 600, perMin: 120 }, bonus: 'teleport' },
      { key: 'reformation', count: 1, opensAtPhase: 2,
        alliance: { first: 1200, perMin: 240 },
        personal: { first: 600, perMin: 120 }, bonus: 'damage' },
      { key: 'mercenary', count: 1, opensAtPhase: 2,
        alliance: { first: 1200, perMin: 240 },
        personal: { first: 600, perMin: 120 }, bonus: 'weaken' },
    ],

    /** Undercellars arrive in waves, not at random. */
    undercellarWaves: 2,

    /**
     * ─── UNITY's plan ──────────────────────────────────────────────────
     *
     * Everything from here down is how WE play the match, not how the game
     * works. This is the part that is ours; the rest above is public fact
     * and is the same for whoever we are drawn against.
     *
     * Who is in each zone lives in src/content/legions.ts — this is the
     * shape, that is the roster.
     * ───────────────────────────────────────────────────────────────────
     */
    plan: {
      /**
       * The map is cut into four colour zones and every starter belongs to
       * exactly one. Order here is the order the operation order lists them
       * and the order the page shows them.
       *
       * `dir` is where the zone sits on the map — the colour is what the
       * game shows, the compass point is how people actually talk about it.
       *
       * `undercellars` is how many spawn inside that zone, read off the
       * battlefield map. They are NOT spread evenly: two zones have two
       * each and two have none, which is why the number is per zone rather
       * than a single total. The page states this and leaves what to do
       * about it to the zone leads.
       *
       * Each key needs zone.<key>.name, .dir, .motto and .flex in the
       * locales, a colour in the .zone rules in src/styles/global.css, and
       * a matching entry in LEGIONS[].zones.
       */
      zones: [
        { key: 'purple', undercellars: 2 },
        { key: 'blue', undercellars: 0 },
        { key: 'green', undercellars: 0 },
        { key: 'yellow', undercellars: 2 },
      ],

      /**
       * Buildings no zone owns. Leadership calls the rotation onto these as
       * the match develops, which is exactly why they are not on anybody's
       * card — a zone that walks off its own objective to chase the centre
       * has cost more than the centre is worth.
       */
      sharedObjectives: ['swordshrine'],

      /**
       * Standing orders, in the priority they resolve. When two of them
       * pull in different directions the earlier one wins, which is the
       * whole point of writing them in an order. Each key has
       * order.<key>.title / .body.
       */
      orders: ['objectives', 'secondary', 'nofreelance', 'communicate', 'nowaste', 'shrine'],

      /**
       * What a flex player does, in the same priority order. Identical in
       * all four zones, so it is stated once here rather than four times.
       * Each key has flex.<key>.
       */
      flexDuties: ['rally', 'reinforce', 'gather', 'loot'],
    },
  },

} as const;
