import { useState, type FormEvent, type ReactElement } from "react";
import { ArrowLeft, ArrowRight, CircleDot, Crosshair, Crown } from "lucide-react";
import { Field, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/register/primitives";
import { validateDetails, type Details, type DetailsErrors } from "@/components/register/validation";
import type { GameConfig, GameId } from "@/lib/types";

const GAME_ICONS = { freefire: Crosshair, chess: Crown, efootball: CircleDot } as const;
const GAME_TAGLINE: Record<GameId, string> = {
  freefire: "Drop in. Squad up. Outplay your opponents.",
  chess: "Think ahead. Control the board. Checkmate.",
  efootball: "Build your squad. Control the pitch. Take the win.",
};

// ---------------- Step 1 ----------------

interface GameStepProps {
  games: GameConfig[];
  selected: GameId | null;
  onSelect: (game: GameId) => void;
}

export function GameStep({ games, selected, onSelect }: GameStepProps): ReactElement {
  return (
    <div data-testid="register-game-step">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 1 / Select game</p>
      <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Choose your battle<span className="text-[#F97316]">.</span></h2>
      <p className="mt-3 text-sm text-[#888]">Each game has its own registration fee. You can register for more than one game separately.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {games.map((game, index) => {
          const Icon = GAME_ICONS[game.id];
          const active = selected === game.id;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelect(game.id)}
              data-testid={`select-game-${game.id}`}
              aria-pressed={active}
              className={`group flex min-h-44 flex-col justify-between border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F97316]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${active ? "border-[#F97316] bg-[#F97316]/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]" : "border-white/10 bg-[#111111]"}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] tracking-[0.15em] text-[#F97316]">0{index + 1}</span>
                <span className="flex size-9 items-center justify-center border border-white/10 text-[#A1A1A1] transition-colors group-hover:border-[#F97316]/40 group-hover:text-[#F97316]"><Icon className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
              </div>
              <div>
                <p className="font-heading text-xl font-semibold uppercase">{game.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#777]">{GAME_TAGLINE[game.id]}</p>
                <p className="mt-4 flex items-baseline gap-2 border-t border-white/10 pt-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">Fee</span>
                  <span data-testid={`game-fee-${game.id}`} className="font-heading text-lg font-bold text-[#F5F5F5]">{game.fee_display}</span>
                  {game.fee === null && <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#666]">to be announced</span>}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Step 2 ----------------


interface DetailsStepProps {
  game: GameConfig;
  details: Details;
  onChange: (details: Details) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DetailsStep({ game, details, onChange, onBack, onNext }: DetailsStepProps): ReactElement {
  const [errors, setErrors] = useState<DetailsErrors>({});

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next = validateDetails(details);
    setErrors(next);
    if (Object.keys(next).length === 0) onNext();
  };

  const bind = (key: keyof Details) => ({
    id: key,
    name: key,
    value: details[key],
    "aria-invalid": Boolean(errors[key]),
    onChange: (e: { target: { value: string } }) => {
      onChange({ ...details, [key]: e.target.value });
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    className: inputClass,
  });

  return (
    <form data-testid="register-details-step" onSubmit={submit} noValidate>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 2 / Your details</p>
      <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Registration form<span className="text-[#F97316]">.</span></h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id="full_name" label="Full name" error={errors.full_name}><input {...bind("full_name")} data-testid="input-full-name" autoComplete="name" placeholder="Your full name" /></Field>
        <Field id="email" label="Email address" error={errors.email}><input {...bind("email")} data-testid="input-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" /></Field>
        <Field id="mobile" label="Mobile number" error={errors.mobile}><input {...bind("mobile")} data-testid="input-mobile" type="tel" autoComplete="tel" inputMode="numeric" placeholder="10-digit mobile number" /></Field>
        <Field id="college" label="College / Institution" error={errors.college}><input {...bind("college")} data-testid="input-college" autoComplete="organization" placeholder="Your college" /></Field>
        <Field id="student_id" label="Student ID / College ID" error={errors.student_id}><input {...bind("student_id")} data-testid="input-student-id" placeholder="ID number" /></Field>
        <Field id="game" label="Selected game" hint="Locked from step 1 — go back to change it.">
          <div data-testid="selected-game-readonly" className="flex min-h-12 items-center justify-between border border-[#F97316]/30 bg-[#F97316]/5 px-4 text-sm">
            <span className="font-heading font-semibold uppercase">{game.title}</span>
            <span className="font-mono text-xs text-[#F97316]">{game.fee_display}</span>
          </div>
        </Field>
      </div>
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} data-testid="details-back-button" className={ghostButtonClass}><ArrowLeft className="size-4" aria-hidden="true" /> Change game</button>
        <button type="submit" data-testid="details-continue-button" className={primaryButtonClass}>Continue to payment <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></button>
      </div>
    </form>
  );
}
