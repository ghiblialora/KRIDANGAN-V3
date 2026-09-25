import type { ReactElement } from "react";
import { CircleDot, Crosshair, Crown, type LucideIcon } from "lucide-react";
import { eventConfig } from "@/config/eventConfig";

interface ArenaRow {
  id: string;
  number: string;
  name: string;
  type: string;
  icon: LucideIcon;
}

const arenaRows: ArenaRow[] = [
  { id: "freefire", number: "01", name: "Free Fire", type: "Battle Royale", icon: Crosshair },
  { id: "chess", number: "02", name: "Chess", type: "Tactical Strategy", icon: Crown },
  { id: "efootball", number: "03", name: "E-Football", type: "Sports Simulation", icon: CircleDot },
];

export default function HeroCommandPanel(): ReactElement {
  return (
  <div data-testid="hero-abstract-visual" className="relative mx-auto w-full max-w-[520px] py-4 lg:ml-auto">
    <div className="pointer-events-none absolute -inset-10 bg-[radial-gradient(circle_at_65%_45%,rgba(249,115,22,0.14),transparent_58%)] blur-2xl" />
    <div data-testid="hero-arena-command-panel" className="relative overflow-hidden border border-white/10 bg-[#0B0B0B]/90 shadow-[0_32px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p data-testid="hero-arena-panel-label" className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F97316]">Tournament command</p>
          <p data-testid="hero-arena-panel-status" className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">Arena selection online</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#A1A1A1]"><span className="size-1.5 animate-kridangan-pulse rounded-full bg-[#F97316] shadow-[0_0_10px_#F97316]" /> Live</div>
      </div>

      <div className="relative grid grid-cols-[0.78fr_1.22fr] border-b border-white/10">
        <div className="flex min-h-36 flex-col justify-between border-r border-white/10 p-5 sm:p-6">
          <p data-testid="hero-arena-count-label" className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Active disciplines</p>
          <div><p data-testid="hero-arena-count" className="font-heading text-6xl font-bold leading-none tracking-[-0.08em] text-[#F5F5F5]">03<span className="text-[#F97316]">.</span></p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#888]">One campus arena</p></div>
        </div>
        <div className="relative flex items-center justify-center overflow-hidden p-5 sm:p-6">
          <div className="absolute size-28 rounded-full border border-[#F97316]/25" />
          <div className="absolute size-20 rounded-full border border-dashed border-white/15" />
          <img data-testid="hero-arena-panel-logo" src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN tournament mark" className="relative z-10 h-20 w-32 object-cover" />
          <span className="absolute bottom-3 right-4 font-mono text-[8px] uppercase tracking-[0.16em] text-[#555]">{eventConfig.season} / 2026</span>
        </div>
      </div>

      <div data-testid="hero-arena-game-list" className="relative divide-y divide-white/10">
        {arenaRows.map(({ id, number, name, type, icon: Icon }) => (
          <div key={name} data-testid={`hero-arena-${id}-row`} className="group flex min-h-16 items-center gap-4 px-5 transition-colors duration-300 hover:bg-white/[0.025] sm:px-6">
            <span className="font-mono text-[9px] text-[#F97316]">{number}</span>
            <span className="flex size-8 items-center justify-center border border-white/10 bg-white/[0.02] text-[#A1A1A1] transition-colors duration-300 group-hover:border-[#F97316]/40 group-hover:text-[#F97316]"><Icon className="size-3.5" strokeWidth={1.5} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span data-testid={`hero-arena-${id}-name`} className="block font-heading text-sm font-semibold uppercase text-[#F5F5F5]">{name}</span><span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.14em] text-[#555]">{type}</span></span>
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#86EFAC]">Registration open</span>
          </div>
        ))}
      </div>

      <div className="relative flex flex-col gap-3 border-t border-white/10 bg-[#F97316]/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p data-testid="hero-arena-organizer" className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#777]">JamRang × NxtGen Esports</p>
        <p data-testid="hero-arena-campus" className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#A1A1A1]">Vijaybhoomi University</p>
      </div>
    </div>
    <div className="pointer-events-none absolute -bottom-3 -right-3 -z-10 h-full w-full border border-[#F97316]/15" />
  </div>
  );
}
