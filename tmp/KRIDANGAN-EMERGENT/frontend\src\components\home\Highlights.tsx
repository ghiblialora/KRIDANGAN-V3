import type { ReactElement } from "react";
import { Crosshair, Sparkles, Trophy, Users } from "lucide-react";

const highlights = [
  { icon: Crosshair, label: "Competition", copy: "Put your skills to the test.", number: "01" },
  { icon: Users, label: "Community", copy: "Meet fellow gamers and competitors.", number: "02" },
  { icon: Trophy, label: "Glory", copy: "Compete for the KRIDANGAN title.", number: "03" },
  { icon: Sparkles, label: "JamRang", copy: "Be part of the larger campus celebration.", number: "04" },
];

export default function Highlights(): ReactElement {
  return (
<section data-testid="highlights-section" className="border-y border-white/10 bg-[#0A0A0A] px-5 py-24 sm:px-8 lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p data-testid="highlights-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">04 / The experience</p><h2 data-testid="highlights-title" className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">More than just<br /><span className="text-[#666]">a game.</span></h2></div><div className="mt-12 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{highlights.map(({ icon: Icon, label, copy, number }) => <div key={label} data-testid={`highlight-card-${label.toLowerCase()}`} className="bg-[#111111] p-6 transition-colors duration-300 hover:bg-[#151515] sm:p-7"><div className="flex items-center justify-between"><Icon data-testid={`highlight-${label.toLowerCase()}-icon`} className="size-5 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" /><span data-testid={`highlight-${label.toLowerCase()}-number`} className="font-mono text-[10px] text-[#555]">{number}</span></div><h3 data-testid={`highlight-${label.toLowerCase()}-title`} className="mt-12 font-heading text-lg font-semibold uppercase">{label}</h3><p data-testid={`highlight-${label.toLowerCase()}-copy`} className="mt-2 text-sm leading-6 text-[#666]">{copy}</p></div>)}</div></div></section>
  );
}
