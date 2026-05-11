import { Scorer } from "@/components/Scorer";

export default function Home() {
  return (
    <main className="min-h-screen px-4 sm:px-8">
      <header className="mx-auto max-w-3xl pt-8 pb-4 text-center">
        <h1 className="font-tc text-4xl font-bold tracking-tight sm:text-5xl">
          計番 · 廣東牌
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Snap your winning hand → instant 番 breakdown. Hong Kong old-style rules · 13番 cap.
        </p>
      </header>
      <Scorer />
      <footer className="mx-auto max-w-3xl py-8 text-center text-xs text-zinc-500">
        <a href="https://github.com/carlfung1003/mahjong-scorer" className="hover:text-zinc-300">
          github · open source
        </a>
      </footer>
    </main>
  );
}
