import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Tile } from "@/components/Tile";
import type { Tile as TileType } from "@/lib/mahjong/tiles";
import type { FaanReason } from "@/lib/mahjong/faan";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SharedScorePage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.score.findUnique({ where: { id } });
  if (!row) notFound();

  const concealed = row.concealed.split(",").filter(Boolean) as TileType[];
  const flowers = row.flowers.split(",").filter(Boolean) as TileType[];
  const exposed = JSON.parse(row.exposedMelds) as Array<{ kind: string; tiles: TileType[]; concealed: boolean }>;
  const reasons = JSON.parse(row.reasons) as FaanReason[];

  return (
    <main className="min-h-screen px-4 sm:px-8">
      <header className="mx-auto max-w-3xl pt-8 pb-4 text-center">
        <h1 className="font-tc text-3xl font-bold">計番 · 廣東牌</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Shared on {new Date(row.createdAt).toLocaleString()}
        </p>
      </header>

      <div className="mx-auto max-w-2xl py-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#1c2e26] to-[#11241c] p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-wider text-[#c8a96a]">總番</p>
          <p className="my-2 text-7xl font-bold">
            {row.faan}<span className="ml-2 text-2xl text-zinc-400">番</span>
          </p>
          {row.isLimit && (
            <p className="text-sm text-[#c8a96a]">滿糊 · limit hand (raw {row.rawFaan}番)</p>
          )}
        </div>

        <h3 className="mb-3 mt-8 text-lg font-semibold">Breakdown</h3>
        <ul className="divide-y divide-zinc-700 rounded-xl bg-[#11241c]">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between px-4 py-3">
              <span>
                <span className="font-medium">{r.pattern}</span>
                {r.description && <span className="ml-2 text-xs text-zinc-500">{r.description}</span>}
              </span>
              <span className="font-mono text-[#c8a96a]">+{r.faan}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3 rounded-xl bg-[#11241c] p-4 text-sm">
          <div>
            <p className="mb-1 text-xs uppercase text-zinc-500">Concealed tiles</p>
            <div className="flex flex-wrap gap-1.5">{concealed.map((t, i) => <Tile key={i} tile={t} small />)}</div>
          </div>
          {exposed.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase text-zinc-500">Exposed melds</p>
              {exposed.map((m, i) => (
                <div key={i} className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16">{m.kind}{m.concealed ? " (暗)" : ""}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.tiles.map((t, j) => <Tile key={j} tile={t} small />)}
                  </div>
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

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#c8a96a] hover:underline">
            ← Score your own hand
          </a>
        </div>
      </div>
    </main>
  );
}
