// Hand structure: a winning HK mahjong hand decomposed into melds + pair.
// A standard winning hand is 4 sets + 1 pair = 14 tiles (花 are bonus, not counted).

import { parseTile, sortTiles, type Tile } from "./tiles";

export type MeldKind = "chow" | "pung" | "kong" | "pair";

export type Meld = {
  kind: MeldKind;
  tiles: Tile[];      // sorted
  concealed: boolean; // true if formed from concealed tiles (incl. concealed kong)
};

export type Hand = {
  melds: Meld[];      // exactly 4 sets + 1 pair (for standard hands)
  pair: Meld;         // also present in melds; duplicated for convenience
  flowers: Tile[];    // bonus tiles (1f..8f)
  winningTile: Tile;  // the tile that completed the hand
  selfDraw: boolean;  // 自摸
  concealed: boolean; // 門前清 (no melded calls before winning)
  seatWind: Tile;     // 自風 (1z..4z)
  roundWind: Tile;    // 圈風 (1z..4z)
  // optional context
  lastTile?: boolean;   // 海底撈月 (last tile of the wall) — sea-bottom
  robbingKong?: boolean; // 搶槓
  kongBloom?: boolean;   // 槓上開花
  heavenly?: boolean;    // 天糊 dealer first draw
  earthly?: boolean;     // 地糊 non-dealer first discard wins
};

// Special hands that don't decompose into 4-sets-1-pair
export type SpecialHand =
  | { kind: "thirteen-orphans"; tiles: Tile[]; flowers: Tile[]; winningTile: Tile; selfDraw: boolean; seatWind: Tile; roundWind: Tile }
  | { kind: "seven-pairs"; tiles: Tile[]; flowers: Tile[]; winningTile: Tile; selfDraw: boolean; seatWind: Tile; roundWind: Tile };

// === decomposition ===

function countTiles(tiles: Tile[]): Map<Tile, number> {
  const m = new Map<Tile, number>();
  for (const t of tiles) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function* findStandardDecompositions(tiles: Tile[]): Generator<Meld[]> {
  // tiles: concealed tiles only, no flowers, sorted
  const sorted = sortTiles(tiles);
  const counts = countTiles(sorted);

  function* solve(remaining: Map<Tile, number>, melds: Meld[], pairFound: boolean): Generator<Meld[]> {
    // find first tile with count > 0
    let first: Tile | null = null;
    for (const [t, c] of remaining) {
      if (c > 0) { first = t; break; }
    }
    if (!first) {
      // all tiles consumed — valid if we found exactly one pair
      if (pairFound) yield [...melds];
      return;
    }

    const { num, suit } = parseTile(first);
    const cur = remaining.get(first)!;

    // try pair
    if (!pairFound && cur >= 2) {
      const next = new Map(remaining);
      next.set(first, cur - 2);
      yield* solve(next, [...melds, { kind: "pair", tiles: [first, first], concealed: true }], true);
    }

    // try pung
    if (cur >= 3) {
      const next = new Map(remaining);
      next.set(first, cur - 3);
      yield* solve(next, [...melds, { kind: "pung", tiles: [first, first, first], concealed: true }], pairFound);
    }

    // try chow (only m/p/s, num <= 7)
    if ((suit === "m" || suit === "p" || suit === "s") && num <= 7) {
      const t2 = `${num + 1}${suit}` as Tile;
      const t3 = `${num + 2}${suit}` as Tile;
      const c2 = remaining.get(t2) ?? 0;
      const c3 = remaining.get(t3) ?? 0;
      if (c2 > 0 && c3 > 0) {
        const next = new Map(remaining);
        next.set(first, cur - 1);
        next.set(t2, c2 - 1);
        next.set(t3, c3 - 1);
        yield* solve(next, [...melds, { kind: "chow", tiles: [first, t2, t3], concealed: true }], pairFound);
      }
    }
  }

  yield* solve(counts, [], false);
}

// Find a valid 4-melds-1-pair decomposition.
// `concealedTiles` excludes any tiles already declared as exposed melds (pung/kong on the table).
// Returns null if no decomposition exists.
export function decomposeStandardHand(args: {
  concealedTiles: Tile[];
  exposedMelds: Meld[];
  flowers: Tile[];
}): { melds: Meld[]; pair: Meld } | null {
  const need = 4 - args.exposedMelds.length;
  for (const decomp of findStandardDecompositions(args.concealedTiles)) {
    const concealedSets = decomp.filter((m) => m.kind !== "pair");
    const pair = decomp.find((m) => m.kind === "pair");
    if (!pair) continue;
    if (concealedSets.length !== need) continue;
    const all = [...args.exposedMelds, ...concealedSets, pair];
    return { melds: all, pair };
  }
  return null;
}

// Thirteen orphans: 1m 9m 1p 9p 1s 9s + all 7 honors + one duplicate
export function isThirteenOrphans(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const required: Tile[] = ["1m","9m","1p","9p","1s","9s","1z","2z","3z","4z","5z","6z","7z"];
  const counts = countTiles(tiles);
  for (const r of required) {
    if ((counts.get(r) ?? 0) < 1) return false;
  }
  // exactly one tile has count 2, others count 1
  let twos = 0;
  for (const t of tiles) {
    const c = counts.get(t)!;
    if (c > 2) return false;
    if (c === 2 && !required.includes(t)) return false;
  }
  for (const t of required) if (counts.get(t) === 2) twos++;
  return twos === 1;
}

// Seven pairs: 7 distinct pairs (not officially scored in HK old-style, but supported for detection)
export function isSevenPairs(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const counts = countTiles(tiles);
  let pairs = 0;
  for (const c of counts.values()) {
    if (c === 2) pairs++;
    else if (c === 4) pairs += 2; // two pairs of same tile allowed in some rulesets
    else return false;
  }
  return pairs === 7;
}
