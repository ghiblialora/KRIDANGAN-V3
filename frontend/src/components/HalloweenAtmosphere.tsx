import type { ReactElement } from "react";

type Variant = "hero" | "section" | "page";

type HalloweenAtmosphereProps = {
  variant?: Variant;
  className?: string;
};

interface Ember {
  id: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  drift: string;
  opacity: number;
}

interface BatProps {
  className: string;
  delay: string;
  duration: string;
  scale?: number;
}

const EMBER_COUNT: Record<Variant, number> = { hero: 18, page: 12, section: 8 };

// Deterministic ember layout (no Math.random so SSR/hydration & tests stay stable).
const embers: Ember[] = Array.from({ length: 18 }, (_, i): Ember => ({
  id: `ember-${i}`,
  left: `${(i * 53) % 100}%`,
  size: 2 + ((i * 7) % 3),
  delay: `${(i * 1.37) % 12}s`,
  duration: `${11 + ((i * 3) % 9)}s`,
  drift: `${((i % 2 === 0 ? 1 : -1) * (14 + ((i * 5) % 26)))}px`,
  opacity: 0.35 + ((i * 13) % 5) / 10,
}));

function Bat({ className, delay, duration, scale = 1 }: BatProps): ReactElement {
  return (
    <svg
      viewBox="0 0 64 32"
      aria-hidden="true"
      className={`animate-bat-glide absolute fill-[#1c1c1c] ${className}`}
      style={{ animationDelay: delay, animationDuration: duration, width: 44 * scale, height: 22 * scale }}
    >
      <path d="M32 14c-2-5-6-8-11-9 2 3 2 6 1 8-4-3-9-4-14-2 3 2 6 4 7 7-4 0-8 1-11 4 5-1 10 0 14 3l4-3 3 6 3-6 4 3c4-3 9-4 14-3-3-3-7-4-11-4 1-3 4-5 7-7-5-2-10-1-14 2-1-2-1-5 1-8-5 1-9 4-11 9Z" />
    </svg>
  );
}

function Cobweb({ className }: { className: string }): ReactElement {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={`pointer-events-none absolute ${className}`} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1">
      {[0, 15, 30, 45, 60, 75, 90].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg} x1="0" y1="0" x2={200 * Math.cos(rad)} y2={200 * Math.sin(rad)} />;
      })}
      {[40, 75, 110, 145, 180].map((r) => (
        <path key={r} d={[0, 15, 30, 45, 60, 75, 90].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const sag = r * 0.94;
          const x = (i % 2 === 0 ? r : sag) * Math.cos(rad);
          const y = (i % 2 === 0 ? r : sag) * Math.sin(rad);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(" ")} />
      ))}
    </svg>
  );
}

export default function HalloweenAtmosphere({ variant = "section", className = "" }: HalloweenAtmosphereProps): ReactElement {
  const emberCount: number = EMBER_COUNT[variant];
  return (
    <div data-testid={`halloween-atmosphere-${variant}`} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {variant === "hero" && (
        <>
          <Bat className="left-[8%] top-[18%]" delay="0s" duration="26s" scale={0.9} />
          <Bat className="left-[24%] top-[12%]" delay="-9s" duration="32s" scale={0.6} />
          <Bat className="left-[55%] top-[30%]" delay="-17s" duration="29s" scale={0.75} />
          <Cobweb className="left-0 top-0 size-40 sm:size-56" />
          <Cobweb className="bottom-0 right-0 size-36 rotate-180 sm:size-48" />
          <div className="mist-layer animate-mist-drift absolute -bottom-10 left-0 h-56 w-[160%]" />
          <div className="mist-layer animate-mist-drift-slow absolute -bottom-16 left-[-30%] h-64 w-[160%] opacity-70" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" />
        </>
      )}
      {variant === "section" && (
        <>
          <Cobweb className="right-0 top-0 size-32 -scale-x-100 sm:size-44" />
          <div className="mist-layer animate-mist-drift-slow absolute -bottom-12 left-[-20%] h-44 w-[150%] opacity-60" />
        </>
      )}
      {variant === "page" && (
        <>
          <Bat className="left-[10%] top-[20%]" delay="-4s" duration="30s" scale={0.8} />
          <Bat className="left-[40%] top-[10%]" delay="-14s" duration="34s" scale={0.55} />
          <Cobweb className="left-0 top-0 size-40 sm:size-52" />
          <div className="mist-layer animate-mist-drift absolute -bottom-10 left-0 h-52 w-[160%]" />
        </>
      )}
      <div className="absolute inset-0">
        {embers.slice(0, emberCount).map((ember) => (
          <span
            key={ember.id}
            className="ember absolute bottom-0 rounded-full bg-[#F97316]"
            style={{
              left: ember.left,
              width: ember.size,
              height: ember.size,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
              opacity: ember.opacity,
              ["--ember-drift" as string]: ember.drift,
            }}
          />
        ))}
      </div>
    </div>
  );
}
