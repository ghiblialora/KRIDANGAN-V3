import type { ReactElement } from "react";
import { ArrowRight } from "lucide-react";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import { games } from "@/config/eventConfig";

type RegisterProps = { onRegister: (game: string) => void };

export default function GamesSection({ onRegister }: RegisterProps): ReactElement {
  return (
<section id="games" data-testid="games-section" className="relative overflow-hidden border-y border-white/10 bg-[#0A0A0A] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
  <HalloweenAtmosphere variant="section" />
  <div className="relative mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p data-testid="games-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">02 / Pick your arena</p><h2 data-testid="games-title" className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Choose your battle<span className="text-[#F97316]">.</span></h2></div><p data-testid="games-subtitle" className="max-w-xs text-sm leading-6 text-[#666]">Three games. Three different ways to compete.</p></div>
    <div className="mt-12 grid gap-4 lg:grid-cols-3">
      {games.map((game) => <article key={game.id} data-testid={`game-card-${game.id}`} className="group relative min-h-[470px] overflow-hidden border border-white/10 bg-[#111111] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#F97316]/50 hover:shadow-[0_0_35px_rgba(249,115,22,0.12)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-[#F97316]/15 transition-transform duration-700 group-hover:scale-125" style={{ background: `radial-gradient(circle, ${game.accent}18, transparent 70%)` }} />
        <div className="relative flex h-full flex-col"><div className="flex items-start justify-between"><span data-testid={`game-card-${game.id}-number`} className="font-mono text-xs tracking-[0.15em] text-[#F97316]">{game.number}</span><span data-testid={`game-card-${game.id}-genre`} className="border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#666]">{game.genre}</span></div><div data-testid={`game-card-${game.id}-visual`} className="relative -mx-6 mt-6 h-44 overflow-hidden border-y border-white/10 bg-[#080808] sm:-mx-8"><img data-testid={`game-card-${game.id}-image`} src={game.imageUrl} alt={game.imageAlt} className={`h-full w-full transition-transform duration-700 group-hover:scale-[1.02] ${game.id === "efootball" ? "object-cover invert" : "object-cover"}`} /><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/10" /><div className="pointer-events-none absolute inset-0 bg-[#F97316]/[0.04] mix-blend-color" /></div><div className="mt-auto pt-7"><h3 data-testid={`game-card-${game.id}-title`} className="font-heading text-2xl font-semibold uppercase tracking-tight">{game.title}</h3><p data-testid={`game-card-${game.id}-description`} className="mt-3 max-w-xs text-sm leading-6 text-[#888]">{game.description}</p><button type="button" onClick={() => onRegister(game.id)} data-testid={`game-card-${game.id}-register-button`} className="group/cta mt-6 inline-flex min-h-11 items-center font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#F97316] transition-colors hover:text-[#FDBA74] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-4 focus-visible:ring-offset-[#111111]">Register for {game.title} <ArrowRight className="ml-3 size-3 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" /></button></div></div>
      </article>)}
    </div>
  </div>
</section>
  );
}
