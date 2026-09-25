import { useState, type FormEvent, type ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Field, inputClass, primaryButtonClass, StatusPill, SummaryRow } from "@/components/register/primitives";
import { apiPost, errorMessage } from "@/lib/api";
import type { PublicStatus, StatusLookup } from "@/lib/types";

const STATUS_COPY = {
  PENDING: "Your payment proof is with the KRIDANGAN team for manual verification. You will be confirmed once it is reviewed.",
  VERIFIED: "Your payment has been verified and your registration is confirmed. See you in the arena.",
  REJECTED: "We could not verify this payment. Please contact NxtGen Esports Club with your payment details.",
} as const;

export default function RegistrationStatus(): ReactElement {
  const [params] = useSearchParams();
  const [registrationId, setRegistrationId] = useState(params.get("id") ?? "");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: (body: StatusLookup) => apiPost<PublicStatus>("/registration/status", body),
  });

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const id = registrationId.trim().toUpperCase();
    if (id.length < 6) { setFormError("Enter your registration ID (e.g. KRD26-A7X92B)."); return; }
    setFormError(null);
    lookup.mutate({ registration_id: id, email: email.trim() ? email.trim() : undefined });
  };

  const result = lookup.data;

  return (
    <div data-testid="registration-status-page" className="min-h-screen bg-[#070707] text-[#F5F5F5]">
      <SiteHeader />
      <main className="relative overflow-hidden pt-28 lg:pt-32">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <HalloweenAtmosphere variant="section" className="-z-10 h-[520px]" />
        <section className="mx-auto max-w-3xl px-5 pb-24 sm:px-8 lg:px-10">
          <p data-testid="status-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">KRIDANGAN / Registration status</p>
          <h1 data-testid="status-title" className="mt-3 font-heading text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl">Check your<br /><span className="text-[#666]">status.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#A1A1A1]">Enter the registration ID you received after submitting. Add your email for an extra check.</p>

          <form data-testid="status-form" onSubmit={submit} noValidate className="mt-10 grid gap-6 border border-white/10 bg-[#0B0B0B]/80 p-5 backdrop-blur-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-8">
            <Field id="registration_id" label="Registration ID" error={formError ?? undefined}>
              <input id="registration_id" data-testid="status-input-id" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} className={`${inputClass} font-mono uppercase`} placeholder="KRD26-XXXXXX" autoComplete="off" aria-invalid={Boolean(formError)} />
            </Field>
            <Field id="status_email" label="Email (optional)">
              <input id="status_email" data-testid="status-input-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" autoComplete="email" />
            </Field>
            <button type="submit" disabled={lookup.isPending} data-testid="status-submit-button" className={primaryButtonClass}>
              {lookup.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />} Check
            </button>
          </form>

          {lookup.isError && <p data-testid="status-error" role="alert" className="mt-6 border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">{errorMessage(lookup.error, "No registration found for these details.")}</p>}

          {result && (
            <div data-testid="status-result" className="mt-8 border border-white/10 bg-[#111111] p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#666]">Registration</p><p data-testid="status-result-id" className="mt-2 font-heading text-2xl font-bold tracking-[0.05em]">{result.registration_id}</p></div>
                <StatusPill status={result.registration_status} />
              </div>
              <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                <SummaryRow label="Game" value={result.game_title} testId="status-result-game" />
                <SummaryRow label="Submitted" value={new Date(result.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} testId="status-result-submitted" />
                {result.verified_at && <SummaryRow label="Verified" value={new Date(result.verified_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} testId="status-result-verified" />}
              </dl>
              <p data-testid="status-result-copy" className="mt-6 text-sm leading-6 text-[#A1A1A1]">{STATUS_COPY[result.registration_status]}</p>
              {result.registration_status === "REJECTED" && <Link to="/contact" data-testid="status-contact-link" className="mt-5 inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F97316] hover:text-[#FDBA74]">Contact the team <ArrowRight className="size-3" aria-hidden="true" /></Link>}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
