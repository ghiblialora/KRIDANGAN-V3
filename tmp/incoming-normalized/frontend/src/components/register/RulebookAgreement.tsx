import type { ReactElement } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import type { GameConfig } from "@/lib/types";

interface Props { game: GameConfig; accepted: boolean; error?: string; onChange: (accepted: boolean) => void }

export function RulebookAgreement({ game, accepted, error, onChange }: Props): ReactElement {
  return (
    <section data-testid="rulebook-agreement" className="border border-white/10 bg-[#111111] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F97316]">Mandatory Rule Book</p><p className="mt-2 text-sm text-[#A1A1A1]">Read the official {game.title} formats, rules and regulations before continuing.</p></div>
        <a href={game.rulebook_url} target="_blank" rel="noopener noreferrer" data-testid="read-rulebook-link" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-[#F97316]/60 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F97316] transition-colors hover:bg-[#F97316] hover:text-[#070707]"><BookOpen className="size-4" aria-hidden="true" /> Read Rule Book <ExternalLink className="size-3" aria-hidden="true" /></a>
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-white/10 pt-5 text-sm leading-6 text-[#F5F5F5]">
        <input type="checkbox" checked={accepted} onChange={(e) => onChange(e.target.checked)} data-testid="rulebook-accept-checkbox" className="mt-1 size-4 shrink-0 accent-[#F97316]" />
        <span>I have read and understood the Rule Book, including formats, rules and regulations.</span>
      </label>
      {error && <p data-testid="field-rulebook-accepted-error" role="alert" className="mt-3 text-xs text-[#FB923C]">{error}</p>}
    </section>
  );
}