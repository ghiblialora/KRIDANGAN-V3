import type { ReactElement } from "react";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import HeroCommandPanel from "@/components/home/HeroCommandPanel";
import HeroContent from "@/components/home/HeroContent";

type RegisterProps = { onRegister: () => void };

export default function Hero({ onRegister }: RegisterProps): ReactElement {
  return (
    <section data-testid="hero-section" className="relative isolate min-h-[720px] overflow-hidden border-b border-white/10 pt-28 sm:min-h-[780px] lg:pt-32">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="grain-overlay pointer-events-none absolute inset-0 -z-10 opacity-30" />
      <div className="pointer-events-none absolute -right-36 top-12 -z-10 size-[520px] rounded-full bg-[#F97316]/10 blur-[100px] sm:size-[700px]" />
      <HalloweenAtmosphere variant="hero" className="-z-10" />
      <div className="mx-auto grid max-w-7xl gap-16 px-5 pb-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-10 lg:pb-28">
        <HeroContent onRegister={onRegister} />
        <HeroCommandPanel />
      </div>
    </section>
  );
}
