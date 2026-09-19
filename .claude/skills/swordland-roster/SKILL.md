---
name: swordland-roster
description: Update who plays Swordland for UNITY (UNT, Kingshot kingdom 976) on the unt-info site — swapping players between zones, promoting a substitute, replacing a zone lead, or applying a whole new Legion roster. Use this skill whenever the user mentions changing the Swordland roster, team sheet, order of battle, legions, zone assignments, substitutes, or says someone has joined, left, been swapped, or been promoted in a Legion — even if they do not name the site or the repo. Also use it when the user asks who is in a zone, or reports that a name on the site looks wrong.
---

# Updating the Swordland roster

The zones, the roles, the priorities and the standing orders are settled and
do not move. What changes, most weeks, is **which person sits in which slot**.
That is the whole job here.

## The one rule that matters

**Never type a player's name into a data file.** Put their `governor_id`
there and let the sync script fetch the name.

This is not fussiness. Kingshot names are built from Cherokee syllabics,
small capitals, Cyrillic lookalikes and non-breaking spaces — `Ꭰøɴ Ꮇaz ᵁᴺᵀ`
is "Don Maz" in three scripts, and `Ron Swanson` has a U+00A0 in it that is
pixel-identical to a space. Fifteen of the first forty names on this site
were typed by hand and every one of them was subtly wrong, which quietly
broke the only thing the roster section is for: letting somebody copy a name
into chat and find that person.

An id cannot be mistyped that way, and it survives a rename.

## Files

| File | Who owns it |
|---|---|
| `src/content/legions.json` | You. Who is in which slot, by id. |
| `src/content/roster.json` | The sync script. Never hand-edit. |
| `src/avatars/<id>.png` | The sync script. |
| `src/content/event.ts` | Zones, orders, priorities — *not* people. |

A slot looks like this. `_name` is a human-readable label the sync script
rewrites; it is never the source of truth:

```json
{ "id": 105743115, "_name": "JTLomo", "holds": "belltower" }
```

Zone shape is fixed: each zone has one `lead`, zero or more `holders` (each
with a `holds`, and a `qual` where the building has a twin), and a `flex`
array. `subs` sits at the Legion level. Moving a person means moving their
id between these; leave `holds` and `qual` attached to the *slot*, not the
person, because the building does not change when the player does.

## Workflow

### 1. Resolve every name to an id

Run the bundled resolver before touching any file:

```bash
node .claude/skills/swordland-roster/scripts/resolve-names.mjs "Ally" "Saleh" "DaY"
node .claude/skills/swordland-roster/scripts/resolve-names.mjs --wide "MSC"   # search the kingdom
```

It reports **how** each name matched, which is the point:

- `ok` — exact or tag-insensitive. Safe to use.
- `CHECK` — prefix, substring or fuzzy. Probably right, show the user.
- `AMBIGUOUS` — several candidates. Ask; never pick one yourself.
- `NO MATCH` — nobody in UNT. Try `--wide` before concluding anything.

Orders are written casually: "Saleh" means `ox Saleh ox`, "DaY" means
`『 DaYı 』`, "Don Abood" means `Ꭰøɴ Ꭺboood ᴸᴬᴴ`. The resolver handles these,
but it guesses, so anything below `ok` goes back to the user in plain words
before it goes in a file.

Some names resolve to nobody because they are nicknames the game has never
heard of — "PickYourToe" is what the operation order calls
`PickYourFateᵁᴺᵀ`. Ask rather than inventing a match.

### 2. Being in another alliance is not a problem

Players swap alliances between events and are back in UNT in time to play,
so `MSC ᴾᴿᴹ` showing up in OPC is ordinary churn, not an error. **If the
operation order names somebody, they go on the page**, and `--wide` exists
precisely so you can find their id wherever they happen to be sitting today.

`npm run sync:roster` resolves them individually and lists who is currently
elsewhere as information. Do not treat that list as a problem to fix, do not
drop anyone from the sheet over it, and do not promote a substitute to
"cover" a gap. Leadership decides who plays; the page reports what the order
says.

The only thing worth raising is a name that matches **no account anywhere** —
usually a typo, and worth mentioning because a name nobody can find is a name
nobody can search for in chat either. It still renders, just without a
portrait.

### 3. Edit `legions.json`, then sync

```bash
npm run sync:roster            # names, ranks, portraits — one API call
npm run sync:roster -- --force # re-download every avatar
```

The script rewrites `roster.json`, downloads any portrait it does not have,
and refreshes every `_name`. It costs one call for the alliance plus one per
player currently outside it, so it stays well inside the 60/min limit.

Portraits come from the game, uploads and stock hero art alike. Two players
who picked the same hero look alike here because they look alike in game,
and the tile exists to be recognised rather than to be unique. Only the
"never chose a picture" silhouette falls back to a lettered tile — rendering
the game's own placeholder reads as a broken image, not as faithfulness.

### 4. Verify before shipping

```bash
npm run build     # also runs check:i18n
```

Then confirm the things a build cannot:

- Headcounts. Both Legions should field 30 and hold 10 in reserve. The page
  counts the sheet, so a wrong number means a wrong sheet. A player being in
  another alliance does not change the count — they are still on the team.
- No duplicate ids anywhere, within or across Legions.
- Every zone still has a lead, and every building still has exactly one
  holder across the four zones: four Abbeys, two Sanctums, and one each of
  the Bell Tower, Royal Stables, Mercenary Camp and Hall of Reformation.
  The Swordshrine belongs to nobody on purpose.

```bash
node -e '
const L=require("./src/content/legions.json");
for (const l of L) {
  const ids=[], holds=[];
  for (const [z,Z] of Object.entries(l.zones))
    for (const p of [Z.lead,...Z.holders,...Z.flex]) {
      ids.push(p.id); if (p.holds) holds.push(`${p.qual??""}${p.holds}`);
    }
  const subs=l.subs.map(s=>s.id);
  const dup=[...ids,...subs].filter((v,i,a)=>v!==null&&a.indexOf(v)!==i);
  console.log(`legion ${l.n}: ${ids.length} starters, ${subs.length} subs`,
    `| buildings ${holds.sort().join(",")}`, dup.length?`| DUPLICATE ${dup}`:"");
}'
```

### 5. Ship it

This repo deploys from `main`, so finishing means deploying:

```bash
git add -A && git commit    # say what changed about the roster and why
git push origin main
gh run list --repo ImIOImI/unt-info --limit 1   # wait for success
```

Then sync the canonical copy at `/home/troy/repos/kingshot/unt-info` and
delete the working clone from `/home/troy/claude-agent/`, per the user's
standing workflow. Commit as `troy.knapp@gmail.com`.

## Reporting back

Lead with anything that needs a human decision — a name that would not
resolve anywhere, a headcount that no longer adds up, two people in one slot.
Those matter more than the diff. Who is currently in which alliance is
background, not a finding. Then say what changed and give the live link:
<https://imioimi.github.io/unt-info/swordland/>
