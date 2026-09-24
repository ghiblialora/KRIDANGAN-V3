import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { DetailsStep, GameStep } from "@/components/register/GameAndDetailsSteps";
import { createEmptyDetails, primaryContact, type Details } from "@/components/register/validation";
import { PaymentStep } from "@/components/register/PaymentStep";
import { ReviewStep, SuccessScreen } from "@/components/register/ReviewAndSuccess";
import { StepIndicator } from "@/components/register/primitives";
import { apiGet, apiPostForm, errorMessage } from "@/lib/api";
import type { GameId, RegistrationConfig, RegistrationSubmitted } from "@/lib/types";

const GAME_IDS: GameId[] = ["freefire", "chess", "efootball"];

export default function Register(): ReactElement {
  const [params] = useSearchParams();
  const preselected = params.get("game");
  const initialGame: GameId | null = GAME_IDS.includes(preselected as GameId) ? (preselected as GameId) : null;

  const [step, setStep] = useState<number>(initialGame ? 2 : 1);
  const [game, setGame] = useState<GameId | null>(initialGame);
  const [details, setDetails] = useState<Details>(() => createEmptyDetails(initialGame ?? "freefire"));
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [result, setResult] = useState<RegistrationSubmitted | null>(null);

  const config = useQuery({ queryKey: ["registration", "config"], queryFn: () => apiGet<RegistrationConfig>("/registration/config") });
  const selectedGame = useMemo(() => config.data?.games.find((g) => g.id === game) ?? null, [config.data, game]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, result]);

  const submit = useMutation({
    mutationFn: async (): Promise<RegistrationSubmitted> => {
      if (!game || !screenshot) throw new Error("Missing game or screenshot");
      const contact = primaryContact(details, game);
      const form = new FormData();
      form.append("full_name", contact.full_name.trim());
      form.append("email", contact.email.trim());
      form.append("mobile", contact.mobile.trim());
      form.append("college", details.college.trim());
      form.append("student_id", details.student_id.trim());
      form.append("game", game);
      form.append("game_details_json", JSON.stringify(details.game_details));
      form.append("rulebook_accepted", String(details.rulebook_accepted));
      form.append("utr_number", utr.replace(/\s/g, "").toUpperCase());
      form.append("screenshot", screenshot);
      return apiPostForm<RegistrationSubmitted>("/registration/submit", form);
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div data-testid="register-page" className="min-h-screen bg-[#070707] text-[#F5F5F5]">
      <SiteHeader />
      <main className="relative overflow-hidden pt-28 lg:pt-32">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <HalloweenAtmosphere variant="section" className="-z-10 h-[600px]" />
        <section className="mx-auto max-w-4xl px-5 pb-24 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-testid="register-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">KRIDANGAN / Registration</p>
              <h1 data-testid="register-title" className="mt-3 font-heading text-4xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl">Enter the<br /><span className="text-[#666]">arena.</span></h1>
            </div>
            <p className="max-w-xs text-xs leading-5 text-[#666]">Manual UPI payment. Your spot is confirmed only after the KRIDANGAN team verifies your payment.</p>
          </div>

          {!result && <StepIndicator current={step} />}

          <div className="mt-10 border border-white/10 bg-[#0B0B0B]/80 p-5 backdrop-blur-sm sm:p-8 lg:p-10">
            {config.isLoading && <div data-testid="register-loading" className="flex min-h-40 items-center justify-center text-[#666]"><Loader2 className="size-5 animate-spin" aria-hidden="true" /></div>}
            {config.isError && <p data-testid="register-config-error" role="alert" className="text-sm text-[#FCA5A5]">Could not load registration details. Please refresh the page.</p>}
            {config.data && result && <SuccessScreen result={result} />}
            {config.data && !result && step === 1 && (
              <GameStep games={config.data.games} selected={game} onSelect={(id) => { setGame(id); setDetails(createEmptyDetails(id)); setStep(2); }} />
            )}
            {config.data && !result && step === 2 && selectedGame && (
              <DetailsStep game={selectedGame} details={details} onChange={setDetails} onBack={() => setStep(1)} onNext={() => setStep(3)} />
            )}
            {config.data && !result && step === 3 && selectedGame && (
              <PaymentStep game={selectedGame} payment={config.data.payment} utr={utr} screenshot={screenshot} onUtrChange={setUtr} onScreenshotChange={setScreenshot} onBack={() => setStep(2)} onNext={() => setStep(4)} />
            )}
            {config.data && !result && step === 4 && selectedGame && (
              <ReviewStep game={selectedGame} details={details} utr={utr} screenshot={screenshot} submitting={submit.isPending} error={submit.isError ? errorMessage(submit.error) : null} onBack={() => setStep(3)} onSubmit={() => submit.mutate()} />
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
