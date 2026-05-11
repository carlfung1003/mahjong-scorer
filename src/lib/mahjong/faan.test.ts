// Run with: npx tsx src/lib/mahjong/faan.test.ts
import { scoreHand } from "./faan";
import type { Tile } from "./tiles";

type Case = {
  name: string;
  expectedFaan: number;
  expectedPatterns?: string[];
  input: Parameters<typeof scoreHand>[0];
};

const cases: Case[] = [
  {
    name: "Plain ping wu (平糊), concealed, ron",
    expectedFaan: 2, // 平糊 1 + 門前清 1
    expectedPatterns: ["平糊", "門前清"],
    input: {
      concealedTiles: ["1m","2m","3m","4p","5p","6p","7s","8s","9s","2m","3m","4m","5p","5p"] as Tile[],
      exposedMelds: [],
      flowers: [],
      winningTile: "5p",
      selfDraw: false,
      concealed: true,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "All pungs (對對糊) with one exposed pung — ron",
    expectedFaan: 3, // 對對糊 3 only
    expectedPatterns: ["對對糊"],
    input: {
      concealedTiles: ["1m","1m","1m","4p","4p","4p","7s","7s","7s","9s","9s"] as Tile[],
      exposedMelds: [{ kind: "pung", tiles: ["2m","2m","2m"] as Tile[], concealed: false }],
      flowers: [],
      winningTile: "9s",
      selfDraw: false,
      concealed: false,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Four concealed pungs (四暗刻 — limit) self-draw",
    expectedFaan: 13,
    expectedPatterns: ["四暗刻"],
    input: {
      concealedTiles: ["1m","1m","1m","4p","4p","4p","7s","7s","7s","2m","2m","2m","9s","9s"] as Tile[],
      exposedMelds: [],
      flowers: [],
      winningTile: "9s",
      selfDraw: true,
      concealed: true,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Half flush 混一色 + 對對糊 + 中番",
    expectedFaan: 7, // 混一色 3 + 對對糊 3 + 中番 1 (the 5z pung)
    expectedPatterns: ["對對糊", "混一色", "中番"],
    input: {
      concealedTiles: ["1m","1m","1m","4m","4m","4m","7m","7m","7m","9m","9m"] as Tile[],
      exposedMelds: [{ kind: "pung", tiles: ["5z","5z","5z"] as Tile[], concealed: false }],
      flowers: [],
      winningTile: "9m",
      selfDraw: false,
      concealed: false,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Full flush 清一色 + 平糊 + 門前清",
    expectedFaan: 9, // 清一色 7 + 平糊 1 + 門前清 1
    expectedPatterns: ["清一色", "平糊", "門前清"],
    input: {
      concealedTiles: ["1p","2p","3p","4p","5p","6p","7p","8p","9p","2p","3p","4p","5p","5p"] as Tile[],
      exposedMelds: [],
      flowers: [],
      winningTile: "5p",
      selfDraw: false,
      concealed: true,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Big three dragons 大三元 (limit)",
    expectedFaan: 13,
    expectedPatterns: ["大三元"],
    input: {
      concealedTiles: ["1m","2m","3m","9p","9p"] as Tile[],
      exposedMelds: [
        { kind: "pung", tiles: ["5z","5z","5z"] as Tile[], concealed: false },
        { kind: "pung", tiles: ["6z","6z","6z"] as Tile[], concealed: false },
        { kind: "pung", tiles: ["7z","7z","7z"] as Tile[], concealed: false },
      ],
      flowers: [],
      winningTile: "9p",
      selfDraw: false,
      concealed: false,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Thirteen orphans 十三么 (limit)",
    expectedFaan: 13,
    expectedPatterns: ["十三么"],
    input: {
      concealedTiles: ["1m","9m","1p","9p","1s","9s","1z","2z","3z","4z","5z","6z","7z","1m"] as Tile[],
      exposedMelds: [],
      flowers: [],
      winningTile: "1m",
      selfDraw: false,
      concealed: true,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Small three dragons 小三元 + dragon pung counted once",
    // 小三元 4 + 中番 1 + 發番 1 = 6 (the third dragon is the pair, so it does not add a dragon pung)
    expectedFaan: 6,
    expectedPatterns: ["小三元", "中番", "發番"],
    input: {
      concealedTiles: ["1m","2m","3m","4p","5p","6p","7z","7z"] as Tile[],
      exposedMelds: [
        { kind: "pung", tiles: ["5z","5z","5z"] as Tile[], concealed: false },
        { kind: "pung", tiles: ["6z","6z","6z"] as Tile[], concealed: false },
      ],
      flowers: [],
      winningTile: "6p",
      selfDraw: false,
      concealed: false,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
  {
    name: "Seat + round wind pung (East-East)",
    // 平糊 doesn't apply (pung in hand). Just East pung gives 自風 + 圈風 = 2
    expectedFaan: 2,
    expectedPatterns: ["自風", "圈風"],
    input: {
      concealedTiles: ["1m","2m","3m","4p","5p","6p","7s","8s","9s","5p","5p"] as Tile[],
      exposedMelds: [
        { kind: "pung", tiles: ["1z","1z","1z"] as Tile[], concealed: false },
      ],
      flowers: [],
      winningTile: "5p",
      selfDraw: false,
      concealed: false,
      seatWind: "1z",
      roundWind: "1z",
    },
  },
];

let passed = 0;
let failed = 0;
for (const c of cases) {
  const result = scoreHand(c.input);
  const ok = result.faan === c.expectedFaan;
  const patternsMatch = !c.expectedPatterns || c.expectedPatterns.every((p) => result.reasons.some((r) => r.pattern === p));
  if (ok && patternsMatch) {
    console.log(`✓ ${c.name} → ${result.faan}番 [${result.reasons.map((r) => r.pattern).join(", ")}]`);
    passed++;
  } else {
    console.log(`✗ ${c.name}`);
    console.log(`  expected ${c.expectedFaan}番 with ${c.expectedPatterns?.join(", ") ?? "any"}`);
    console.log(`  got      ${result.faan}番 (raw ${result.rawFaan}) [${result.reasons.map((r) => `${r.pattern}+${r.faan}`).join(", ")}]`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
