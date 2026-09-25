import type { ReactElement, ReactNode } from "react";

// Shared primitives for the public registration flow — kept tiny and on-brand.

const STEPS = [
  { number: "01", label: "Game" },
  { number: "02", label: "Details" },
  { number: "03", label: "Payment" },
  { number: "04", label: "Verification" },
] as const;

export function StepIndicator({ current }: { current: number }): ReactElement {
  return (
    <ol data-testid="registration-step-indicator" className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Registration progress">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const state = stepNumber < current ? "done" : stepNumber === current ? "active" : "todo";
        return (
          <li key={step.number} data-testid={`step-${step.label.toLowerCase()}`} data-state={state} aria-current={state === "active" ? "step" : undefined} className="min-w-0">
            <div className={`h-0.5 w-full transition-colors duration-500 ${state === "todo" ? "bg-white/10" : "bg-[#F97316]"}`} />
            <p className={`mt-3 font-mono text-[9px] uppercase tracking-[0.18em] ${state === "active" ? "text-[#F97316]" : state === "done" ? "text-[#A1A1A1]" : "text-[#555]"}`}>{step.number}</p>
            <p className={`mt-1 truncate font-heading text-xs font-semibold uppercase sm:text-sm ${state === "todo" ? "text-[#555]" : "text-[#F5F5F5]"}`}>{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps): ReactElement {
  return (
    <div data-testid={`field-${id}`}>
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#A1A1A1]">{label}</label>
      {hint && <p className="mt-1 text-xs text-[#666]">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p data-testid={`field-${id}-error`} role="alert" className="mt-2 text-xs text-[#FB923C]">{error}</p>}
    </div>
  );
}

export const inputClass =
  "block min-h-12 w-full border border-white/12 bg-[#0B0B0B] px-4 text-sm text-[#F5F5F5] placeholder:text-[#555] transition-colors focus:border-[#F97316]/70 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 aria-[invalid=true]:border-[#FB923C]/70";

export const primaryButtonClass =
  "group inline-flex min-h-12 items-center justify-center gap-3 bg-[#F97316] px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#070707] transition-all duration-300 hover:bg-[#EA580C] hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#F97316] disabled:hover:shadow-none";

export const ghostButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-3 border border-white/15 px-6 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#F5F5F5] transition-all duration-300 hover:border-[#F97316]/60 hover:text-[#F97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]";

export function SummaryRow({ label, value, testId }: { label: string; value: ReactNode; testId: string }): ReactElement {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#666]">{label}</dt>
      <dd data-testid={testId} className="break-words text-sm text-[#F5F5F5] sm:text-right">{value}</dd>
    </div>
  );
}

export function StatusPill({ status }: { status: "PENDING" | "VERIFIED" | "REJECTED" }): ReactElement {
  const map = {
    PENDING: { dot: "bg-[#FACC15]", text: "text-[#FDE68A]", border: "border-[#FACC15]/30 bg-[#FACC15]/10", label: "Pending verification" },
    VERIFIED: { dot: "bg-[#22C55E]", text: "text-[#86EFAC]", border: "border-[#22C55E]/30 bg-[#22C55E]/10", label: "Verified" },
    REJECTED: { dot: "bg-[#EF4444]", text: "text-[#FCA5A5]", border: "border-[#EF4444]/30 bg-[#EF4444]/10", label: "Rejected" },
  } as const;
  const style = map[status];
  return (
    <span data-testid="status-pill" data-status={status} className={`inline-flex min-h-8 items-center gap-2 border px-3 font-mono text-[10px] uppercase tracking-[0.16em] ${style.border} ${style.text}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
