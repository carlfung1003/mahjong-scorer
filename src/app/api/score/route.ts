import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreHand } from "@/lib/mahjong/faan";
import { isValidTile, type Tile } from "@/lib/mahjong/tiles";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const TileStr = z.string().refine(isValidTile, "invalid tile");

const InputSchema = z.object({
  concealedTiles: z.array(TileStr),
  exposedMelds: z.array(z.object({
    kind: z.enum(["chow", "pung", "kong"]),
    tiles: z.array(TileStr),
    concealed: z.boolean().default(false),
  })),
  flowers: z.array(TileStr),
  winningTile: TileStr,
  selfDraw: z.boolean(),
  concealedHand: z.boolean(),
  seatWind: TileStr,
  roundWind: TileStr,
  lastTile: z.boolean().optional(),
  robbingKong: z.boolean().optional(),
  kongBloom: z.boolean().optional(),
  heavenly: z.boolean().optional(),
  earthly: z.boolean().optional(),
  save: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = InputSchema.parse(body);

    const result = scoreHand({
      concealedTiles: input.concealedTiles as Tile[],
      exposedMelds: input.exposedMelds.map((m) => ({
        kind: m.kind, tiles: m.tiles as Tile[], concealed: m.concealed,
      })),
      flowers: input.flowers as Tile[],
      winningTile: input.winningTile as Tile,
      selfDraw: input.selfDraw,
      concealed: input.concealedHand,
      seatWind: input.seatWind as Tile,
      roundWind: input.roundWind as Tile,
      lastTile: input.lastTile,
      robbingKong: input.robbingKong,
      kongBloom: input.kongBloom,
      heavenly: input.heavenly,
      earthly: input.earthly,
    });

    let id: string | undefined;
    if (input.save && process.env.TURSO_DATABASE_URL) {
      const row = await prisma.score.create({
        data: {
          concealed: input.concealedTiles.join(","),
          exposedMelds: JSON.stringify(input.exposedMelds),
          flowers: input.flowers.join(","),
          winningTile: input.winningTile,
          selfDraw: input.selfDraw,
          concealedHand: input.concealedHand,
          seatWind: input.seatWind,
          roundWind: input.roundWind,
          faan: result.faan,
          rawFaan: result.rawFaan,
          reasons: JSON.stringify(result.reasons),
          isLimit: result.isLimit,
        },
      });
      id = row.id;
    }

    return NextResponse.json({ ...result, id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: e.issues }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
