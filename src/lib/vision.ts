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

You will receive a photo. Identify the player's WINNING HAND only — a row/group of ~14 face-up tiles deliberately laid out, plus any 花 tiles set off to the side, and any declared 碰/槓 melds.

Tile encoding (MPSZ):
- m = 萬 (characters): 1m..9m
- p = 筒/餅 (dots/circles): 1p..9p
- s = 索/條 (bamboo/sticks): 1s..9s
- z = honors: 1z=東 2z=南 3z=西 4z=北 5z=中(red dragon) 6z=發(green dragon) 7z=白(white dragon, often blank or framed)
- f = flowers: 1f=春 2f=夏 3f=秋 4f=冬 5f=梅 6f=蘭 7f=菊 8f=竹

What to RETURN vs IGNORE:
- "concealedTiles": tiles in the laid-out hand, face up. Total (concealed + exposed melds) should normally be 14.
- "exposedMelds": 碰 (pung) / 槓 (kong) / rarely 上 (chow) the player declared during play, usually set apart from the main row, sometimes one tile rotated.
- "flowers": 花/季 tiles set aside (NOT part of the 14).
- IGNORE: the tile wall (牌山, tiles stacked vertically in long rows around the table), discards scattered in the middle, other players' hands, tiles still face-down. These are NOT the winning hand.

CRITICAL — do not invent tiles:
- If you cannot SEE a clearly-laid-out winning hand in the photo, return all empty arrays and explain in "notes" what IS in the photo. Do not guess.
- Never return tiles you cannot identify with reasonable confidence. Empty is better than wrong.
- If you can only identify some tiles confidently, return only those and say which positions you skipped in "notes".

Output STRICT JSON, no markdown fences, no commentary:
{
  "concealedTiles": string[],
  "exposedMelds": [{ "kind": "pung"|"kong"|"chow", "tiles": string[], "concealed": boolean }],
  "flowers": string[],
  "notes": string
}`;

export async function detectTilesFromImage(args: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<Detection> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
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

  // Sonnet sometimes adds prose ("I'll analyze...") or markdown fences around
  // the JSON. Extract the first balanced { ... } block instead of parsing the
  // whole response.
  const json = extractJsonObject(text);
  if (!json) throw new Error(`Model did not return JSON. Raw: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(json);
  return DetectionSchema.parse(parsed);
}

function extractJsonObject(text: string): string | null {
  // try fenced ```json ... ``` first
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  // otherwise find first balanced { ... }
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
