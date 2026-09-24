import { useState, type FormEvent, type ReactElement } from "react";
import { ArrowLeft, ArrowRight, CircleDot, Crosshair, Crown } from "lucide-react";
import { FreeFireDetailsFields } from "@/components/register/FreeFireDetailsFields";
import { IndividualDetailsFields } from "@/components/register/IndividualDetailsFields";
import { Field, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/register/primitives";
import { RulebookAgreement } from "@/components/register/RulebookAgreement";
import { validateDetails, type ChessDetails, type Details, type DetailsErrors, type EFootballDetails, type FreeFireDetails } from "@/components/register/validation";
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
                <p data-testid={`game-mode-${game.id}`} className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#A1A1A1]">{game.mode}</p>
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
    const next = validateDetails(details, game.id);
    setErrors(next);
    if (Object.keys(next).length === 0) onNext();
  };

  const updateCommon = (key: "college" | "student_id", value: string): void => {
    onChange({ ...details, [key]: value });
    if (errors[key]) setErrors((previous) => { const next = { ...previous }; delete next[key]; return next; });
  };

  return (
    <form data-testid="register-details-step" onSubmit={submit} noValidate>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 2 / Your details</p>
      <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Registration form<span className="text-[#F97316]">.</span></h2>
      <div data-testid="selected-game-readonly" className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
        <div className="bg-[#0A0A0A] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">Game</p><p className="mt-2 font-heading text-sm font-semibold uppercase">{game.title}</p></div>
        <div className="bg-[#0A0A0A] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">Format</p><p data-testid="selected-registration-type" className="mt-2 text-sm text-[#F5F5F5]">{game.registration_type}</p></div>
        <div className="bg-[#0A0A0A] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">Mode · Fee</p><p data-testid="selected-game-mode" className="mt-2 text-sm text-[#F5F5F5]">{game.mode} · <span className="text-[#F97316]">{game.fee_display}</span></p></div>
      </div>
      <div className="mt-8">
        {game.id === "freefire" ? (
          <FreeFireDetailsFields value={details.game_details as FreeFireDetails} errors={errors} onChange={(gameDetails) => onChange({ ...details, game_details: gameDetails })} />
        ) : (
          <IndividualDetailsFields game={game.id} value={details.game_details as ChessDetails | EFootballDetails} errors={errors} onChange={(gameDetails) => onChange({ ...details, game_details: gameDetails })} />
        )}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id="college" label="College / Institution" error={errors.college}><input id="college" data-testid="input-college" value={details.college} onChange={(e) => updateCommon("college", e.target.value)} className={inputClass} autoComplete="organization" placeholder="Your college" /></Field>
        <Field id="student_id" label="Student ID / College ID" error={errors.student_id}><input id="student_id" data-testid="input-student-id" value={details.student_id} onChange={(e) => updateCommon("student_id", e.target.value)} className={inputClass} placeholder="ID number" /></Field>
      </div>
      <div className="mt-8"><RulebookAgreement game={game} accepted={details.rulebook_accepted} error={errors.rulebook_accepted} onChange={(accepted) => onChange({ ...details, rulebook_accepted: accepted })} /></div>
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} data-testid="details-back-button" className={ghostButtonClass}><ArrowLeft className="size-4" aria-hidden="true" /> Change game</button>
        <button type="submit" data-testid="details-continue-button" className={primaryButtonClass}>Continue to payment <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></button>
      </div>
    </form>
  );
}
