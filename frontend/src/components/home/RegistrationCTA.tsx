import type { ReactElement } from "react";
import { ArrowRight } from "lucide-react";

type RegisterProps = { onRegister: () => void };

const BAT_PATH = "M32 14c-2-5-6-8-11-9 2 3 2 6 1 8-4-3-9-4-14-2 3 2 6 4 7 7-4 0-8 1-11 4 5-1 10 0 14 3l4-3 3 6 3-6 4 3c4-3 9-4 14-3-3-3-7-4-11-4 1-3 4-5 7-7-5-2-10-1-14 2-1-2-1-5 1-8-5 1-9 4-11 9Z";

export default function RegistrationCTA({ onRegister }: RegisterProps): ReactElement {
  return (
<section data-testid="registration-cta-section" className="relative overflow-hidden border-t border-white/10 bg-[#F97316] px-5 py-20 text-[#070707] sm:px-8 lg:px-10 lg:py-28"><div className="pointer-events-none absolute right-0 top-0 size-64 translate-x-1/4 -translate-y-1/3 rounded-full border border-[#070707]/10" /><svg viewBox="0 0 64 32" aria-hidden="true" className="pointer-events-none absolute right-[28%] top-[22%] w-10 fill-[#070707]/25 sm:w-12"><path d={BAT_PATH} /></svg><svg viewBox="0 0 64 32" aria-hidden="true" className="pointer-events-none absolute right-[18%] top-[38%] w-6 fill-[#070707]/20 sm:w-8"><path d={BAT_PATH} /></svg><div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><p data-testid="registration-cta-eyebrow" className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#070707]/60">06 / Your move · 29–30 October</p><h2 data-testid="registration-cta-title" className="mt-4 max-w-3xl font-heading text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">Ready to enter<br />the arena?</h2><p data-testid="registration-cta-copy" className="mt-5 max-w-md text-sm leading-6 text-[#070707]/65">Choose your game and secure your spot in KRIDANGAN.</p></div><button type="button" onClick={() => onRegister()} data-testid="bottom-register-button" className="group inline-flex min-h-14 shrink-0 items-center justify-center border border-[#070707]/30 px-7 font-mono text-xs font-bold uppercase tracking-[0.14em] transition-all duration-300 hover:bg-[#070707] hover:text-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F97316]">Register now <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></button></div></section>
  );
}
