"use client";

import { useState } from "react";
import { isValidTile, type Tile as TileType, tileName } from "@/lib/mahjong/tiles";
import { Tile } from "./Tile";

const ALL_TILES: TileType[] = [
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}m` as TileType),
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}p` as TileType),
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}s` as TileType),
  ...Array.from({ length: 7 }, (_, i) => `${i + 1}z` as TileType),
  ...Array.from({ length: 8 }, (_, i) => `${i + 1}f` as TileType),
];

export function TilePicker({ onPick, onClose }: { onPick: (t: TileType) => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#1c2e26] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pick tile</h3>
          <button className="text-sm text-[#c8a96a]" onClick={onClose}>Close</button>
        </div>
        <div className="grid grid-cols-9 gap-1.5">
          {ALL_TILES.map((t) => (
            <button
              key={t}
              className="tile-chip small"
              onClick={() => { onPick(t); onClose(); }}
              title={tileName(t)}
            >
              {tileName(t)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TileRow({
  tiles,
  onChange,
  label,
}: {
  tiles: TileType[];
  onChange: (next: TileType[]) => void;
  label: string;
}) {
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-[#c8a96a]">{label}</span>
        <button
          className="text-sm text-[#c8a96a] hover:underline"
          onClick={() => setAdding(true)}
        >
          + Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tiles.map((t, i) => (
          <Tile
            key={`${t}-${i}`}
            tile={t}
            onClick={() => setPickIndex(i)}
          />
        ))}
        {tiles.length === 0 && (
          <span className="text-sm text-zinc-500">(none)</span>
        )}
      </div>

      {pickIndex !== null && (
        <TilePicker
          onPick={(t) => {
            const next = [...tiles];
            next[pickIndex] = t;
            onChange(next);
          }}
          onClose={() => setPickIndex(null)}
        />
      )}
      {adding && (
        <TilePicker
          onPick={(t) => onChange([...tiles, t])}
          onClose={() => setAdding(false)}
        />
      )}
      {pickIndex !== null && (
        <div className="mt-2">
          <button
            className="text-xs text-red-400 hover:underline"
            onClick={() => {
              const next = tiles.filter((_, i) => i !== pickIndex);
              onChange(next);
              setPickIndex(null);
            }}
          >
            Remove this tile
          </button>
        </div>
      )}
    </div>
  );
}

export { ALL_TILES, isValidTile };
