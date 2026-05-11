// Tile representation for Hong Kong old-style mahjong.
// Encoding (MPSZ + f):
//   m = 萬 (characters)   1m..9m
//   p = 筒/餅 (dots)      1p..9p
//   s = 索/條 (bamboo)    1s..9s
//   z = honors            1z=東 2z=南 3z=西 4z=北 5z=中(red) 6z=發(green) 7z=白
//   f = flowers (1..4 = 春夏秋冬, 5..8 = 梅蘭菊竹)

export type Suit = "m" | "p" | "s" | "z" | "f";
export type Tile = `${number}${Suit}`;

export const HONOR_NAMES: Record<number, string> = {
  1: "東", 2: "南", 3: "西", 4: "北",
  5: "中", 6: "發", 7: "白",
};

export const FLOWER_NAMES: Record<number, string> = {
  1: "春", 2: "夏", 3: "秋", 4: "冬",
  5: "梅", 6: "蘭", 7: "菊", 8: "竹",
};

export const SEAT_WINDS = ["E", "S", "W", "N"] as const;
export type Seat = (typeof SEAT_WINDS)[number];

export const SEAT_TO_HONOR: Record<Seat, Tile> = {
  E: "1z", S: "2z", W: "3z", N: "4z",
};

const TILE_RE = /^([1-9])([mps])$|^([1-7])z$|^([1-8])f$/;

export function isValidTile(t: string): t is Tile {
  return TILE_RE.test(t);
}

export function parseTile(t: string): { num: number; suit: Suit } {
  if (!isValidTile(t)) throw new Error(`invalid tile: ${t}`);
  const num = parseInt(t.slice(0, -1), 10);
  const suit = t.slice(-1) as Suit;
  return { num, suit };
}

export function tileName(t: Tile): string {
  const { num, suit } = parseTile(t);
  if (suit === "z") return HONOR_NAMES[num];
  if (suit === "f") return FLOWER_NAMES[num];
  if (suit === "m") return `${num}萬`;
  if (suit === "p") return `${num}筒`;
  return `${num}索`;
}

export function isHonor(t: Tile): boolean {
  return t.endsWith("z");
}

export function isFlower(t: Tile): boolean {
  return t.endsWith("f");
}

export function isTerminal(t: Tile): boolean {
  const { num, suit } = parseTile(t);
  return (suit === "m" || suit === "p" || suit === "s") && (num === 1 || num === 9);
}

export function isTerminalOrHonor(t: Tile): boolean {
  return isTerminal(t) || isHonor(t);
}

export function isDragon(t: Tile): boolean {
  if (!isHonor(t)) return false;
  const { num } = parseTile(t);
  return num >= 5 && num <= 7;
}

export function isWind(t: Tile): boolean {
  if (!isHonor(t)) return false;
  const { num } = parseTile(t);
  return num >= 1 && num <= 4;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  const suitOrder: Record<Suit, number> = { m: 0, p: 1, s: 2, z: 3, f: 4 };
  return [...tiles].sort((a, b) => {
    const ap = parseTile(a);
    const bp = parseTile(b);
    if (ap.suit !== bp.suit) return suitOrder[ap.suit] - suitOrder[bp.suit];
    return ap.num - bp.num;
  });
}
