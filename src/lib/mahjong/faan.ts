// HK old-style 番 (faan) scoring rules.
// Cap: 13番 (per user preference). Patterns >= cap are reported but capped on total.

import {
  isDragon, isFlower, isHonor, isTerminal, isTerminalOrHonor, isWind, parseTile, type Tile,
} from "./tiles";
import {
  decomposeStandardHand, isSevenPairs, isThirteenOrphans, type Hand, type Meld, type SpecialHand,
} from "./hand";

export const FAAN_CAP = 13;

export type FaanReason = {
  pattern: string;     // e.g. "對對糊"
  faan: number;
  description?: string;
};

export type ScoreResult = {
  faan: number;             // capped at FAAN_CAP
  rawFaan: number;          // pre-cap
  reasons: FaanReason[];
  isLimit: boolean;         // true if rawFaan >= FAAN_CAP
};

// ---- helpers ----

function meldSuit(m: Meld): "m" | "p" | "s" | "z" | "f" {
  return parseTile(m.tiles[0]).suit;
}

function meldIsTerminalOrHonor(m: Meld): boolean {
  return m.tiles.every(isTerminalOrHonor);
}

function meldIsHonor(m: Meld): boolean {
  return m.tiles.every(isHonor);
}

function meldIsDragon(m: Meld): boolean {
  return m.tiles.every(isDragon);
}

function meldIsWind(m: Meld): boolean {
  return m.tiles.every(isWind);
}

function meldIsTriplet(m: Meld): boolean {
  return m.kind === "pung" || m.kind === "kong";
}

// ---- pattern detectors (standard hands) ----

function scorePingWu(hand: Hand): FaanReason | null {
  // 平糊: all chows, pair must not be dragons, won by ron (討糊), pair not seat/round wind valuable
  // HK old-style commonly: all chows + pair is not a yakuhai (dragon/seat/round wind)
  const sets = hand.melds.filter((m) => m.kind !== "pair");
  if (!sets.every((m) => m.kind === "chow")) return null;
  const pair = hand.pair;
  if (meldIsDragon(pair)) return null;
  if (meldIsWind(pair)) {
    if (pair.tiles[0] === hand.seatWind) return null;
    if (pair.tiles[0] === hand.roundWind) return null;
  }
  return { pattern: "平糊", faan: 1 };
}

function scorePoonPoonWu(hand: Hand): FaanReason | null {
  // 對對糊: all pungs/kongs + pair
  const sets = hand.melds.filter((m) => m.kind !== "pair");
  if (!sets.every(meldIsTriplet)) return null;
  return { pattern: "對對糊", faan: 3 };
}

function scoreFlush(hand: Hand): FaanReason | null {
  const nonFlowerMelds = hand.melds;
  const suits = new Set(nonFlowerMelds.map(meldSuit));
  const hasHonor = suits.has("z");
  const numberSuits = [...suits].filter((s) => s === "m" || s === "p" || s === "s");

  if (numberSuits.length === 1 && !hasHonor) {
    return { pattern: "清一色", faan: 7 };
  }
  if (numberSuits.length === 1 && hasHonor) {
    return { pattern: "混一色", faan: 3 };
  }
  if (numberSuits.length === 0 && hasHonor) {
    return { pattern: "字一色", faan: FAAN_CAP, description: "limit hand" };
  }
  return null;
}

function scoreDragons(hand: Hand): FaanReason | null {
  const dragonSets = hand.melds.filter((m) => m.kind !== "pair" && meldIsDragon(m));
  const dragonPair = meldIsDragon(hand.pair);
  if (dragonSets.length === 3) return { pattern: "大三元", faan: FAAN_CAP, description: "limit hand" };
  if (dragonSets.length === 2 && dragonPair) return { pattern: "小三元", faan: 4 };
  return null;
}

function scoreWinds(hand: Hand): FaanReason | null {
  const windSets = hand.melds.filter((m) => m.kind !== "pair" && meldIsWind(m));
  const windPair = meldIsWind(hand.pair);
  if (windSets.length === 4) return { pattern: "大四喜", faan: FAAN_CAP, description: "limit hand" };
  if (windSets.length === 3 && windPair) return { pattern: "小四喜", faan: FAAN_CAP, description: "limit hand" };
  return null;
}

function scoreAllTerminalsHonors(hand: Hand): FaanReason | null {
  if (hand.melds.every(meldIsTerminalOrHonor)) {
    // distinguish 清么九 (terminals only, no honors) vs 字一色 (honors only) vs 混么九 (terminals + honors)
    const hasNumber = hand.melds.some((m) => !meldIsHonor(m));
    const hasHonor = hand.melds.some(meldIsHonor);
    if (hasNumber && !hasHonor) return { pattern: "清么九", faan: FAAN_CAP, description: "limit hand" };
    // 混么九 (mixed terminals + honors) is commonly 4番 in HK
    if (hasNumber && hasHonor) return { pattern: "混么九", faan: 4 };
  }
  return null;
}

function scoreConcealedTriplets(hand: Hand): FaanReason | null {
  // 四暗刻 — four concealed pungs/kongs (limit)
  // 三暗刻 — three concealed pungs/kongs (not officially scored in HK old-style, omitted)
  const concealedTriplets = hand.melds.filter((m) => meldIsTriplet(m) && m.concealed);
  if (concealedTriplets.length === 4) return { pattern: "四暗刻", faan: FAAN_CAP, description: "limit hand" };
  return null;
}

function scoreSelfDrawAndConcealed(hand: Hand): FaanReason[] {
  const out: FaanReason[] = [];
  if (hand.selfDraw) out.push({ pattern: "自摸", faan: 1 });
  if (hand.concealed) out.push({ pattern: "門前清", faan: 1 });
  return out;
}

function scoreDragonPungs(hand: Hand): FaanReason[] {
  // each dragon pung/kong = 1番
  const out: FaanReason[] = [];
  for (const m of hand.melds) {
    if (m.kind === "pair") continue;
    if (meldIsDragon(m)) {
      const { num } = parseTile(m.tiles[0]);
      const name = num === 5 ? "中" : num === 6 ? "發" : "白";
      out.push({ pattern: `${name}番`, faan: 1 });
    }
  }
  return out;
}

function scoreWindPungs(hand: Hand): FaanReason[] {
  const out: FaanReason[] = [];
  for (const m of hand.melds) {
    if (m.kind === "pair") continue;
    if (!meldIsWind(m)) continue;
    const tile = m.tiles[0];
    if (tile === hand.seatWind) out.push({ pattern: "自風", faan: 1 });
    if (tile === hand.roundWind) out.push({ pattern: "圈風", faan: 1 });
  }
  return out;
}

function scoreFlowers(hand: Hand): FaanReason[] {
  if (hand.flowers.length === 8) {
    return [{ pattern: "八仙過海", faan: FAAN_CAP, description: "all 8 flowers — limit hand" }];
  }
  const out: FaanReason[] = [];
  const { num: seatNum } = parseTile(hand.seatWind);
  // own flower indices: seat E(1) -> 1f & 5f, S(2) -> 2f & 6f, W(3) -> 3f & 7f, N(4) -> 4f & 8f
  for (const f of hand.flowers) {
    const { num } = parseTile(f);
    if (num === seatNum || num === seatNum + 4) {
      const name = num <= 4 ? ["春","夏","秋","冬"][num - 1] : ["梅","蘭","菊","竹"][num - 5];
      out.push({ pattern: `花牌 ${name}`, faan: 1 });
    }
  }
  // 4 own flowers (very rare, e.g. all 春夏秋冬 for East) — not separately scored in v1
  return out;
}

function scoreSpecialContext(hand: Hand): FaanReason[] {
  const out: FaanReason[] = [];
  if (hand.lastTile) out.push({ pattern: "海底撈月", faan: 1 });
  if (hand.robbingKong) out.push({ pattern: "搶槓", faan: 1 });
  if (hand.kongBloom) out.push({ pattern: "槓上開花", faan: 1 });
  if (hand.heavenly) out.push({ pattern: "天糊", faan: FAAN_CAP, description: "limit hand" });
  if (hand.earthly) out.push({ pattern: "地糊", faan: FAAN_CAP, description: "limit hand" });
  return out;
}

// ---- main entry ----

export function scoreStandardHand(hand: Hand): ScoreResult {
  const reasons: FaanReason[] = [];

  const ping = scorePingWu(hand); if (ping) reasons.push(ping);
  const poon = scorePoonPoonWu(hand); if (poon) reasons.push(poon);
  const flush = scoreFlush(hand); if (flush) reasons.push(flush);
  const dragons = scoreDragons(hand); if (dragons) reasons.push(dragons);
  const winds = scoreWinds(hand); if (winds) reasons.push(winds);
  const term = scoreAllTerminalsHonors(hand); if (term) reasons.push(term);
  const concealed = scoreConcealedTriplets(hand); if (concealed) reasons.push(concealed);

  reasons.push(...scoreDragonPungs(hand));
  reasons.push(...scoreWindPungs(hand));
  reasons.push(...scoreSelfDrawAndConcealed(hand));
  reasons.push(...scoreFlowers(hand));
  reasons.push(...scoreSpecialContext(hand));

  return finalize(reasons);
}

export function scoreSpecial(sp: SpecialHand): ScoreResult {
  if (sp.kind === "thirteen-orphans") {
    return finalize([{ pattern: "十三么", faan: FAAN_CAP, description: "limit hand" }]);
  }
  // seven-pairs is NOT a standard HK old-style win — keep for future tables
  return finalize([{ pattern: "七對", faan: 4, description: "not standard HK old-style" }]);
}

function finalize(reasons: FaanReason[]): ScoreResult {
  const raw = reasons.reduce((s, r) => s + r.faan, 0);
  return {
    rawFaan: raw,
    faan: Math.min(raw, FAAN_CAP),
    reasons,
    isLimit: raw >= FAAN_CAP,
  };
}

// ---- top-level: figure out which kind of hand it is and score ----

export function scoreHand(input: {
  concealedTiles: Tile[];
  exposedMelds: Meld[];
  flowers: Tile[];
  winningTile: Tile;
  selfDraw: boolean;
  concealed: boolean;
  seatWind: Tile;
  roundWind: Tile;
  lastTile?: boolean;
  robbingKong?: boolean;
  kongBloom?: boolean;
  heavenly?: boolean;
  earthly?: boolean;
}): ScoreResult {
  const allTiles = [...input.concealedTiles, ...input.exposedMelds.flatMap((m) => m.tiles)];
  const nonFlowerCount = allTiles.length;

  if (nonFlowerCount === 14 && isThirteenOrphans(allTiles)) {
    return scoreSpecial({
      kind: "thirteen-orphans",
      tiles: allTiles,
      flowers: input.flowers,
      winningTile: input.winningTile,
      selfDraw: input.selfDraw,
      seatWind: input.seatWind,
      roundWind: input.roundWind,
    });
  }
  if (nonFlowerCount === 14 && isSevenPairs(allTiles) && input.exposedMelds.length === 0) {
    return scoreSpecial({
      kind: "seven-pairs",
      tiles: allTiles,
      flowers: input.flowers,
      winningTile: input.winningTile,
      selfDraw: input.selfDraw,
      seatWind: input.seatWind,
      roundWind: input.roundWind,
    });
  }

  const decomp = decomposeStandardHand({
    concealedTiles: input.concealedTiles,
    exposedMelds: input.exposedMelds,
    flowers: input.flowers,
  });
  if (!decomp) {
    return {
      faan: 0, rawFaan: 0, isLimit: false,
      reasons: [{ pattern: "未糊", faan: 0, description: "tiles do not form a valid winning hand" }],
    };
  }

  return scoreStandardHand({
    melds: decomp.melds,
    pair: decomp.pair,
    flowers: input.flowers,
    winningTile: input.winningTile,
    selfDraw: input.selfDraw,
    concealed: input.concealed,
    seatWind: input.seatWind,
    roundWind: input.roundWind,
    lastTile: input.lastTile,
    robbingKong: input.robbingKong,
    kongBloom: input.kongBloom,
    heavenly: input.heavenly,
    earthly: input.earthly,
  });
}
