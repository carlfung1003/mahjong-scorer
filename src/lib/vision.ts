// Photo → tile list via Claude Haiku 4.5 vision.
// Returns concealed tiles, exposed melds, and flowers in MPSZ notation.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const MeldSchema = z.object({
  kind: z.enum(["chow", "pung", "kong"]),
  tiles: z.array(z.string()),
  concealed: z.boolean().default(false),
});

const DetectionSchema = z.object({
  concealedTiles: z.array(z.string()),
  exposedMelds: z.array(MeldSchema),
  flowers: z.array(z.string()),
  notes: z.string().optional(),
});

export type Detection = z.infer<typeof DetectionSchema>;

const SYSTEM = `You are a Hong Kong mahjong tile recognition assistant.

You will receive a photo of a winning mahjong hand (廣東牌). Identify every tile and return STRICT JSON.

Tile encoding (MPSZ):
- m = 萬 (characters): 1m..9m
- p = 筒/餅 (dots/circles): 1p..9p
- s = 索/條 (bamboo/sticks): 1s..9s
- z = honors: 1z=東 2z=南 3z=西 4z=北 5z=中(red dragon) 6z=發(green dragon) 7z=白(white dragon, often blank or framed)
- f = flowers: 1f=春 2f=夏 3f=秋 4f=冬 5f=梅 6f=蘭 7f=菊 8f=竹

Distinguish:
- "concealedTiles": tiles in the player's hand, face up, not part of declared melds. Should be 14 tiles minus 3*number_of_exposed_melds.
- "exposedMelds": pung/kong (and rarely chow) the player declared during play. Usually shown to the side, slightly rotated or set apart.
- "flowers": 花 / 季 tiles set off to the side (not part of the 14).

Output STRICT JSON matching this schema:
{
  "concealedTiles": string[],   // e.g. ["1m","2m","3m","5p","5p"]
  "exposedMelds": [
    { "kind": "pung"|"kong"|"chow", "tiles": string[], "concealed": boolean }
  ],
  "flowers": string[],
  "notes": string                // optional: anything unclear or ambiguous
}

If you cannot identify a tile with confidence, omit it and mention in notes. Do not invent tiles.
Return ONLY the JSON object — no commentary, no markdown fences.`;

export async function detectTilesFromImage(args: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<Detection> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: args.mediaType, data: args.imageBase64 },
          },
          {
            type: "text",
            text: "Identify every tile in this winning mahjong hand. Return strict JSON only.",
          },
        ],
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // strip possible code fences just in case
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return DetectionSchema.parse(parsed);
}
