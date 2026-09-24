import { useState, type ReactElement } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ghostButtonClass, primaryButtonClass, StatusPill, SummaryRow } from "@/components/register/primitives";
import type { Details } from "@/components/register/validation";
import { copyText } from "@/components/register/validation";
import type { GameConfig, RegistrationSubmitted } from "@/lib/types";

interface ReviewStepProps {
  game: GameConfig;
  details: Details;
  utr: string;
  screenshot: File | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewStep({ game, details, utr, screenshot, submitting, error, onBack, onSubmit }: ReviewStepProps): ReactElement {
  return (
    <div data-testid="register-review-step">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 4 / Verification</p>
      <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Registration summary<span className="text-[#F97316]">.</span></h2>
      <p className="mt-3 text-sm text-[#888]">Check everything once. After submission your payment proof goes to the KRIDANGAN team for manual verification.</p>
      <dl data-testid="registration-summary" className="mt-8 divide-y divide-white/10 border-y border-white/10">
        <SummaryRow label="Name" value={details.full_name} testId="summary-name" />
        <SummaryRow label="Email" value={details.email} testId="summary-email" />
        <SummaryRow label="Mobile" value={details.mobile} testId="summary-mobile" />
        <SummaryRow label="College" value={details.college} testId="summary-college" />
        <SummaryRow label="Student ID" value={details.student_id} testId="summary-student-id" />
        <SummaryRow label="Game" value={game.title} testId="summary-game" />
        <SummaryRow label="Registration fee" value={<span className="text-[#F97316]">{game.fee_display}</span>} testId="summary-fee" />
        <SummaryRow label="UTR" value={<span className="font-mono">{utr.replace(/\s/g, "").toUpperCase()}</span>} testId="summary-utr" />
        <SummaryRow label="Screenshot" value={screenshot?.name ?? "—"} testId="summary-screenshot" />
      </dl>
      {error && <p data-testid="submit-error" role="alert" className="mt-6 border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">{error}</p>}
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} disabled={submitting} data-testid="review-back-button" className={ghostButtonClass}><ArrowLeft className="size-4" aria-hidden="true" /> Back</button>
        <button type="button" onClick={onSubmit} disabled={submitting} data-testid="submit-registration-button" className={primaryButtonClass}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitting ? "Submitting…" : "Submit registration"}
          {!submitting && <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export function SuccessScreen({ result }: { result: RegistrationSubmitted }): ReactElement {
  const [copied, setCopied] = useState(false);
  const copyId = async (): Promise<void> => {
    if (await copyText(result.registration_id)) {
      setCopied(true);
      toast.success("Registration ID copied");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy — please note the ID down manually.");
    }
  };

  return (
    <div data-testid="register-success" className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 5 / Wait for verification</p>
      <h2 data-testid="success-title" className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-5xl">Registration submitted<span className="text-[#F97316]">.</span></h2>
      <p className="mt-3 text-sm text-[#A1A1A1]">Your registration has been successfully submitted.</p>

      <div className="mx-auto mt-10 max-w-md border border-[#F97316]/30 bg-[#F97316]/5 p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#666]">Registration ID</p>
        <p data-testid="success-registration-id" className="mt-2 font-heading text-3xl font-bold tracking-[0.06em] text-[#F5F5F5] sm:text-4xl">{result.registration_id}</p>
        <button type="button" onClick={copyId} data-testid="copy-registration-id-button" className="mt-4 inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316]">
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />} Save your registration ID
        </button>
      </div>

      <dl className="mx-auto mt-8 max-w-md divide-y divide-white/10 border-y border-white/10 text-left">
        <SummaryRow label="Game" value={result.game_title} testId="success-game" />
        <SummaryRow label="Registration fee" value={result.fee_display} testId="success-fee" />
        <SummaryRow label="Payment status" value={<StatusPill status={result.payment_status} />} testId="success-payment-status" />
      </dl>

      <p data-testid="success-message" className="mx-auto mt-8 max-w-md text-sm leading-6 text-[#A1A1A1]">Your payment proof has been submitted successfully. The KRIDANGAN team will manually verify your payment. Your registration is confirmed only after verification.</p>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to={`/registration-status?id=${encodeURIComponent(result.registration_id)}`} data-testid="success-check-status-link" className={ghostButtonClass}>Check status later</Link>
        <Link to="/" data-testid="success-back-home-link" className={primaryButtonClass}>Back to KRIDANGAN <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
