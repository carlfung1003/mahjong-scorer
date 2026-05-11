# 計番 · 廣東牌 — Mahjong Scorer

Snap a photo of your winning Hong Kong mahjong hand. Get the 番 breakdown instantly.

Live: https://mahjong.carlfung.dev

## What it does

1. **Upload / snap** a photo of your 14-tile winning hand (plus any exposed melds and 花 set aside).
2. **Claude Haiku 4.5 vision** identifies every tile and returns them in MPSZ notation.
3. **Manual correction step** — tap any misread tile to fix before scoring.
4. **HK old-style 番 engine** decomposes the hand and applies the rule table, capped at 13番.
5. **Optional shareable link** — save the result to Turso and copy a public URL.

## Rules implemented (HK old-style, 13番 cap)

| 番 | Patterns |
|---|---|
| 1 | 平糊, 自摸, 門前清, 中/發/白番, 自風, 圈風, 海底撈月, 搶槓, 槓上開花, 自家花牌 |
| 3 | 對對糊, 混一色 |
| 4 | 小三元, 混么九 |
| 7 | 清一色 |
| 13 (滿糊) | 大三元, 小四喜, 大四喜, 字一色, 清么九, 四暗刻, 十三么, 八仙過海, 天糊, 地糊 |

Patterns >= 13 are capped on total but listed individually in the breakdown.

## Tile notation (MPSZ)

| Suit | Tiles |
|---|---|
| `m` | 萬 1m..9m |
| `p` | 筒 1p..9p |
| `s` | 索 1s..9s |
| `z` | 1z=東 2z=南 3z=西 4z=北 5z=中 6z=發 7z=白 |
| `f` | 1f=春 2f=夏 3f=秋 4f=冬 5f=梅 6f=蘭 7f=菊 8f=竹 |

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- Claude Haiku 4.5 vision via `@anthropic-ai/sdk`
- Prisma 7 + Turso (libSQL) for shareable score persistence
- Zod for input validation
- Deployed on Vercel

## Local dev

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY (required)
# fill in TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (optional — only needed for share links)

npm install
npm run dev
```

`Calculate` works without Turso. `Save & share` requires Turso env vars.

## Roadmap

- **v2:** payout calculation (自摸 vs 食糊, 莊家 multipliers, 包牌)
- House rule presets (different tables score 番 differently)
- Hand log / table history (multi-round play tracker)
- Mobile PWA install

## License

MIT
