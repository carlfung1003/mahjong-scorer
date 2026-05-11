"use client";

import { useState } from "react";
import { sortTiles, SEAT_TO_HONOR, type Tile as TileType } from "@/lib/mahjong/tiles";
import type { ScoreResult } from "@/lib/mahjong/faan";
import { TileRow } from "./TilePicker";
import { Tile } from "./Tile";

type Phase = "upload" | "review" | "result";

type ExposedMeld = { kind: "chow" | "pung" | "kong"; tiles: TileType[]; concealed: boolean };

const SEAT_OPTIONS = [
  { label: "East 東", value: "1z" },
  { label: "South 南", value: "2z" },
  { label: "West 西", value: "3z" },
  { label: "North 北", value: "4z" },
] as const;

export function Scorer() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [concealed, setConcealed] = useState<TileType[]>([]);
  const [exposed, setExposed] = useState<ExposedMeld[]>([]);
  const [flowers, setFlowers] = useState<TileType[]>([]);

  const [winningTile, setWinningTile] = useState<TileType | "">("");
  const [selfDraw, setSelfDraw] = useState(false);
  const [concealedHand, setConcealedHand] = useState(true);
  const [seatWind, setSeatWind] = useState<TileType>(SEAT_TO_HONOR.E);
  const [roundWind, setRoundWind] = useState<TileType>(SEAT_TO_HONOR.E);
  const [lastTile, setLastTile] = useState(false);
  const [robbingKong, setRobbingKong] = useState(false);
  const [kongBloom, setKongBloom] = useState(false);

  const [result, setResult] = useState<ScoreResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handlePhoto(file: File) {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToBase64(file);
      const mediaType = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "detection failed");
      setConcealed(sortTiles((data.concealedTiles ?? []) as TileType[]));
      setExposed((data.exposedMelds ?? []) as ExposedMeld[]);
      setFlowers(sortTiles((data.flowers ?? []) as TileType[]));
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to detect tiles. You can still enter them manually below.");
      setPhase("review");
    } finally {
      setBusy(false);
    }
  }

  async function calculate(save: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (!winningTile) throw new Error("Pick the winning tile first.");
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concealedTiles: concealed,
          exposedMelds: exposed,
          flowers,
          winningTile,
          selfDraw,
          concealedHand,
          seatWind,
          roundWind,
          lastTile, robbingKong, kongBloom,
          save,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "scoring failed");
      setResult(data);
      if (save && data.id) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setShareUrl(`${origin}/score/${data.id}`);
      }
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (phase === "upload") {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <h2 className="text-2xl font-semibold">Snap your winning hand</h2>
        <p className="max-w-md text-center text-zinc-300">
          Take a photo of all 14 tiles (plus any 花/季 set aside).
          We&apos;ll detect them and let you correct any misreads before scoring.
        </p>
        <label className="cursor-pointer rounded-full bg-[#c8a96a] px-6 py-3 font-medium text-[#0b1a14] hover:opacity-90">
          {busy ? "Detecting…" : "Choose / take photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhoto(f);
            }}
            disabled={busy}
          />
        </label>
        <button
          className="text-sm text-zinc-400 underline"
          onClick={() => setPhase("review")}
        >
          Skip — enter tiles manually
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h2 className="mb-2 text-2xl font-semibold">Review tiles</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Tap any tile to change or remove it. The hand should total 14 tiles (concealed + exposed melds), with 花 listed separately.
        </p>

        <TileRow label="Concealed tiles 手牌" tiles={concealed} onChange={(t) => setConcealed(sortTiles(t))} />
        <TileRow label="Flowers 花牌" tiles={flowers} onChange={(t) => setFlowers(sortTiles(t))} />

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm uppercase tracking-wide text-[#c8a96a]">Exposed melds 上牌</span>
            <button
              className="text-sm text-[#c8a96a] hover:underline"
              onClick={() => setExposed([...exposed, { kind: "pung", tiles: [], concealed: false }])}
            >
              + Add meld
            </button>
          </div>
          {exposed.length === 0 && <p className="text-sm text-zinc-500">(no exposed melds)</p>}
          {exposed.map((m, i) => (
            <div key={i} className="mb-3 rounded border border-zinc-700 p-3">
              <div className="mb-2 flex items-center gap-3 text-sm">
                <select
                  value={m.kind}
                  onChange={(e) => {
                    const next = [...exposed];
                    next[i] = { ...next[i], kind: e.target.value as ExposedMeld["kind"] };
                    setExposed(next);
                  }}
                  className="rounded bg-[#1c2e26] px-2 py-1"
                >
                  <option value="chow">chow 上</option>
                  <option value="pung">pung 碰</option>
                  <option value="kong">kong 槓</option>
                </select>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={m.concealed}
                    onChange={(e) => {
                      const next = [...exposed];
                      next[i] = { ...next[i], concealed: e.target.checked };
                      setExposed(next);
                    }}
                  />
                  concealed kong 暗槓
                </label>
                <button
                  className="ml-auto text-xs text-red-400 hover:underline"
                  onClick={() => setExposed(exposed.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
              <TileRow
                label="tiles"
                tiles={m.tiles}
                onChange={(t) => {
                  const next = [...exposed];
                  next[i] = { ...next[i], tiles: t };
                  setExposed(next);
                }}
              />
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-[#11241c] p-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-[#c8a96a]">Winning tile 食糊牌</label>
            <select
              value={winningTile}
              onChange={(e) => setWinningTile(e.target.value as TileType)}
              className="mt-1 w-full rounded bg-[#1c2e26] px-2 py-1.5"
            >
              <option value="">— pick —</option>
              {[...new Set([...concealed, ...exposed.flatMap((m) => m.tiles)])].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#c8a96a]">Seat wind 自風</label>
            <select
              value={seatWind}
              onChange={(e) => setSeatWind(e.target.value as TileType)}
              className="mt-1 w-full rounded bg-[#1c2e26] px-2 py-1.5"
            >
              {SEAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#c8a96a]">Round wind 圈風</label>
            <select
              value={roundWind}
              onChange={(e) => setRoundWind(e.target.value as TileType)}
              className="mt-1 w-full rounded bg-[#1c2e26] px-2 py-1.5"
            >
              {SEAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={selfDraw} onChange={(e) => setSelfDraw(e.target.checked)} />
              自摸 (self-draw)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={concealedHand} onChange={(e) => setConcealedHand(e.target.checked)} />
              門前清 (no exposed melds before winning)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={lastTile} onChange={(e) => setLastTile(e.target.checked)} />
              海底撈月
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={robbingKong} onChange={(e) => setRobbingKong(e.target.checked)} />
              搶槓
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={kongBloom} onChange={(e) => setKongBloom(e.target.checked)} />
              槓上開花
            </label>
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            className="rounded-full bg-[#c8a96a] px-6 py-2.5 font-medium text-[#0b1a14] disabled:opacity-50"
            disabled={busy}
            onClick={() => calculate(false)}
          >
            {busy ? "Calculating…" : "計番 Calculate"}
          </button>
          <button
            className="rounded-full border border-[#c8a96a] px-6 py-2.5 font-medium text-[#c8a96a] disabled:opacity-50"
            disabled={busy}
            onClick={() => calculate(true)}
          >
            Calculate & share link
          </button>
          <button
            className="ml-auto rounded-full px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200"
            onClick={() => setPhase("upload")}
          >
            ← Re-upload
          </button>
        </div>
      </div>
    );
  }

  // result phase
  if (!result) return null;
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="rounded-2xl bg-gradient-to-br from-[#1c2e26] to-[#11241c] p-8 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-wider text-[#c8a96a]">總番</p>
        <p className="my-2 text-7xl font-bold">
          {result.faan}
          <span className="ml-2 text-2xl text-zinc-400">番</span>
        </p>
        {result.isLimit && (
          <p className="text-sm text-[#c8a96a]">滿糊 · limit hand (raw {result.rawFaan}番)</p>
        )}
      </div>

      <h3 className="mb-3 mt-8 text-lg font-semibold">Breakdown</h3>
      <ul className="divide-y divide-zinc-700 rounded-xl bg-[#11241c]">
        {result.reasons.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between px-4 py-3">
            <span>
              <span className="font-medium">{r.pattern}</span>
              {r.description && <span className="ml-2 text-xs text-zinc-500">{r.description}</span>}
            </span>
            <span className="font-mono text-[#c8a96a]">+{r.faan}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {shareUrl ? (
          <>
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded bg-[#1c2e26] px-3 py-2 text-sm font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              className="rounded bg-[#c8a96a] px-4 py-2 text-sm font-medium text-[#0b1a14]"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </button>
          </>
        ) : (
          <button
            className="rounded-full border border-[#c8a96a] px-4 py-2 text-sm text-[#c8a96a]"
            onClick={() => calculate(true)}
          >
            Save & make shareable
          </button>
        )}
        <button
          className="ml-auto rounded-full px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          onClick={() => { setPhase("upload"); setResult(null); setShareUrl(null); setConcealed([]); setExposed([]); setFlowers([]); setWinningTile(""); }}
        >
          New hand
        </button>
      </div>

      <details className="mt-6 rounded-xl bg-[#11241c] p-4 text-sm">
        <summary className="cursor-pointer text-[#c8a96a]">View tiles</summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase text-zinc-500">Concealed</p>
            <div className="flex flex-wrap gap-1.5">{concealed.map((t, i) => <Tile key={i} tile={t} small />)}</div>
          </div>
          {exposed.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase text-zinc-500">Exposed</p>
              {exposed.map((m, i) => (
                <div key={i} className="mb-1 flex flex-wrap gap-1.5">
                  <span className="mr-2 text-xs text-zinc-500">{m.kind}{m.concealed ? " (暗)" : ""}</span>
                  {m.tiles.map((t, j) => <Tile key={j} tile={t} small />)}
                </div>
              ))}
            </div>
          )}
          {flowers.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase text-zinc-500">Flowers</p>
              <div className="flex flex-wrap gap-1.5">{flowers.map((t, i) => <Tile key={i} tile={t} small />)}</div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data URL prefix
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
