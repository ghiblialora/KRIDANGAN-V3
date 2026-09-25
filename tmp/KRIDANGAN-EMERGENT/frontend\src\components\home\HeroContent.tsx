import type { ReactElement } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { eventConfig } from "@/config/eventConfig";

type RegisterProps = { onRegister: () => void };

export default function HeroContent({ onRegister }: RegisterProps): ReactElement {
  return (
  <div className="relative z-10 max-w-2xl">
    <div data-testid="hero-eyebrow" className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]"><span className="h-px w-8 bg-[#F97316]" />{eventConfig.season} <span className="text-[#555]">/</span> {eventConfig.parentEvent} × {eventConfig.organizer}</div>
    <img data-testid="hero-kridangan-logo-image" src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="mb-6 h-14 w-40 object-cover object-left sm:h-20 sm:w-56" />
    <h1 data-testid="hero-title" className="font-heading text-[clamp(4.2rem,10vw,7.5rem)] font-black uppercase leading-[0.78] tracking-[-0.08em] text-[#F5F5F5]">KRIDANGAN<span className="text-[#F97316]">.</span></h1>
    <div className="mt-9 max-w-lg border-l border-[#F97316]/60 pl-5 sm:mt-11 sm:pl-6">
      <p data-testid="hero-headline" className="font-heading text-2xl font-semibold uppercase leading-tight tracking-tight text-[#F5F5F5] sm:text-3xl">Enter the arena<span className="text-[#F97316]">.</span></p>
      <p data-testid="hero-description" className="mt-4 max-w-md text-sm leading-7 text-[#A1A1A1] sm:text-base">An esports showdown featuring Free Fire, Chess and E-Football, brought to you under JamRang at Vijaybhoomi University.</p>
    </div>
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={() => onRegister()} data-testid="hero-register-button" className="group inline-flex min-h-12 items-center justify-center bg-[#F97316] px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#070707] transition-all duration-300 hover:bg-[#EA580C] hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707]">Register now <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></button>
      <a href="#games" data-testid="hero-explore-games-link" className="group inline-flex min-h-12 items-center justify-center border border-white/15 px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#F5F5F5] transition-all duration-300 hover:border-[#F97316]/60 hover:bg-white/[0.03] hover:text-[#F97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">Explore games <ArrowDown className="ml-3 size-4 transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" /></a>
    </div>
    <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#666]">
      <span data-testid="hero-game-count"><strong className="text-[#F5F5F5]">03</strong> games</span><span data-testid="hero-event-label"><strong className="text-[#F5F5F5]">29–30</strong> October</span><span data-testid="hero-location-label"><strong className="text-[#F5F5F5]">VU</strong> Campus</span>
    </div>
  </div>
  );
}
