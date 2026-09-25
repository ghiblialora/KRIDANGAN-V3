import type { ReactElement } from "react";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import { eventConfig } from "@/config/eventConfig";

export default function PrizePool(): ReactElement {
  return (
<section id="prize-pool" data-testid="prize-pool-section" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
  <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316]/[0.06] blur-[100px]" />
  <HalloweenAtmosphere variant="section" />
  <div className="relative mx-auto max-w-4xl text-center"><p data-testid="prize-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">03 / The reward</p><h2 data-testid="prize-title" className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">The stakes are high<span className="text-[#F97316]">.</span></h2><p data-testid="prize-label" className="mt-12 font-mono text-xs uppercase tracking-[0.22em] text-[#666]">Total prize pool</p><p data-testid="prize-amount" className="mt-3 font-heading text-[clamp(4rem,14vw,9rem)] font-bold leading-none tracking-[-0.07em] text-[#F5F5F5] drop-shadow-[0_0_40px_rgba(249,115,22,0.35)]">{eventConfig.prizePool}</p><div data-testid="prize-breakdown" className="mx-auto mt-8 grid max-w-2xl gap-px border border-white/10 bg-white/10 sm:grid-cols-3"><p data-testid="prize-freefire" className="bg-[#0A0A0A] px-4 py-4 text-sm text-[#A1A1A1]">Free Fire <strong className="ml-2 text-[#F5F5F5]">{eventConfig.prizeBreakdown.freefire}</strong></p><p data-testid="prize-chess" className="bg-[#0A0A0A] px-4 py-4 text-sm text-[#A1A1A1]">Chess <strong className="ml-2 text-[#F5F5F5]">{eventConfig.prizeBreakdown.chess}</strong></p><p data-testid="prize-efootball" className="bg-[#0A0A0A] px-4 py-4 text-sm text-[#A1A1A1]">E-Football <strong className="ml-2 text-[#F5F5F5]">{eventConfig.prizeBreakdown.efootball}</strong></p></div><p data-testid="prize-note" className="mt-5 text-xs text-[#666]">Game-wise awards shown above. Additional prize allocation will be announced by the organizer.</p></div>
</section>
  );
}
