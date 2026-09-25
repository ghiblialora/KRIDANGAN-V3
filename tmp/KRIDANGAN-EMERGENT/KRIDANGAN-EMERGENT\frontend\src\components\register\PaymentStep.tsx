import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ImagePlus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, ghostButtonClass, inputClass, primaryButtonClass } from "@/components/register/primitives";
import { copyText, validateScreenshot } from "@/components/register/validation";
import type { GameConfig, PaymentConfig } from "@/lib/types";


const INSTRUCTIONS = [
  "Scan the QR code using your UPI app.",
  "Pay the exact registration amount.",
  "Complete the payment.",
  "Copy your UPI UTR / Transaction ID.",
  "Upload the payment screenshot.",
  "Submit your registration.",
];

interface PaymentStepProps {
  game: GameConfig;
  payment: PaymentConfig;
  utr: string;
  screenshot: File | null;
  onUtrChange: (utr: string) => void;
  onScreenshotChange: (file: File | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentStep({ game, payment, utr, screenshot, onUtrChange, onScreenshotChange, onBack, onNext }: PaymentStepProps): ReactElement {
  const [errors, setErrors] = useState<{ utr?: string; screenshot?: string }>({});
  const [copied, setCopied] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!screenshot) { setPreview(null); return; }
    const url = URL.createObjectURL(screenshot);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const copyUpi = async (): Promise<void> => {
    if (await copyText(payment.upi_id)) {
      setCopied(true);
      toast.success("UPI ID copied");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy. Long-press the UPI ID to copy it manually.");
    }
  };

  const pickFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    const problem = validateScreenshot(file);
    if (problem) {
      setErrors((e) => ({ ...e, screenshot: problem }));
      onScreenshotChange(null);
      event.target.value = "";
      return;
    }
    setErrors((e) => ({ ...e, screenshot: undefined }));
    onScreenshotChange(file);
  };

  const removeFile = (): void => {
    onScreenshotChange(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next: { utr?: string; screenshot?: string } = {};
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr.replace(/\s/g, ""))) next.utr = "Enter the UTR / Transaction ID (8–30 letters or digits).";
    if (!screenshot) next.screenshot = "Upload your payment screenshot.";
    setErrors(next);
    if (!next.utr && !next.screenshot) onNext();
  };

  return (
    <form data-testid="register-payment-step" onSubmit={submit} noValidate>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Step 3 / Make payment</p>
      <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">Payment<span className="text-[#F97316]">.</span></h2>

      <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
        <div className="bg-[#0A0A0A] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Selected game</p><p data-testid="payment-selected-game" className="mt-2 font-heading text-xl font-semibold uppercase">{game.title}</p></div>
        <div className="bg-[#0A0A0A] p-5"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Registration fee</p><p data-testid="payment-fee" className="mt-2 font-heading text-xl font-semibold text-[#F97316]">{game.fee_display}</p></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div data-testid="payment-qr-panel" className="border border-white/10 bg-[#111111] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Payment method · UPI</p>
          <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden bg-white p-3">
            {qrMissing ? (
              <div data-testid="payment-qr-missing" className="flex h-full w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-[#111]/20 text-center text-[#111]">
                <QrCode className="size-10" strokeWidth={1.25} aria-hidden="true" />
                <p className="px-4 font-mono text-[10px] uppercase tracking-[0.16em]">QR code coming soon<br /><span className="normal-case tracking-normal text-[#555]">Pay using the UPI ID below</span></p>
              </div>
            ) : (
              <img data-testid="payment-qr-image" src={payment.qr_code} alt="KRIDANGAN UPI payment QR code" className="h-full w-full object-contain" onError={() => setQrMissing(true)} />
            )}
          </div>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">UPI ID</p>
          <div className="mt-2 flex items-stretch gap-2">
            <code data-testid="payment-upi-id" className="flex min-h-11 flex-1 items-center break-all border border-white/10 bg-[#0B0B0B] px-3 text-sm text-[#F5F5F5]">{payment.upi_id}</code>
            <button type="button" onClick={copyUpi} data-testid="copy-upi-button" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-[#F97316]/50 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F97316] transition-colors hover:bg-[#F97316] hover:text-[#070707] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]" aria-label="Copy UPI ID">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}<span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <ol data-testid="payment-instructions" className="space-y-2 border border-white/10 bg-[#0A0A0A] p-5">
            {INSTRUCTIONS.map((line, i) => (
              <li key={line} className="flex gap-3 text-sm text-[#A1A1A1]"><span className="font-mono text-[10px] text-[#F97316]">0{i + 1}</span>{line}</li>
            ))}
            <li data-testid="payment-pending-notice" className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-[#FDBA74]">Your registration will remain PENDING until the payment is manually verified by the KRIDANGAN team.</li>
          </ol>

          <Field id="utr" label="UTR / Transaction ID" hint="Enter the UTR / Transaction ID shown in your payment app." error={errors.utr}>
            <input id="utr" name="utr" data-testid="input-utr" value={utr} onChange={(e) => onUtrChange(e.target.value)} aria-invalid={Boolean(errors.utr)} className={`${inputClass} font-mono uppercase`} placeholder="e.g. 3129XXXXXXXX" autoComplete="off" />
          </Field>

          <Field id="screenshot" label="Payment screenshot" hint="JPG, JPEG, PNG or WEBP · max 5 MB" error={errors.screenshot}>
            <input ref={fileInput} id="screenshot" name="screenshot" data-testid="input-screenshot" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="sr-only" />
            {screenshot && preview ? (
              <div data-testid="screenshot-preview" className="flex flex-col gap-3 border border-white/10 bg-[#0B0B0B] p-3 sm:flex-row sm:items-center">
                <img src={preview} alt="Payment screenshot preview" className="h-40 w-full object-contain bg-[#070707] sm:h-28 sm:w-28" />
                <div className="min-w-0 flex-1 text-xs text-[#A1A1A1]"><p className="truncate text-[#F5F5F5]">{screenshot.name}</p><p className="mt-1">{(screenshot.size / 1024).toFixed(0)} KB</p></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInput.current?.click()} data-testid="screenshot-replace-button" className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F5F5F5] hover:border-[#F97316]/60 hover:text-[#F97316]"><ImagePlus className="size-3.5" aria-hidden="true" /> Replace</button>
                  <button type="button" onClick={removeFile} data-testid="screenshot-remove-button" className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F5F5F5] hover:border-[#EF4444]/60 hover:text-[#FCA5A5]"><Trash2 className="size-3.5" aria-hidden="true" /> Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()} data-testid="screenshot-upload-button" className="flex min-h-28 w-full flex-col items-center justify-center gap-2 border border-dashed border-white/20 bg-[#0B0B0B] text-[#A1A1A1] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]">
                <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">Tap to upload screenshot</span>
              </button>
            )}
          </Field>
        </div>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} data-testid="payment-back-button" className={ghostButtonClass}><ArrowLeft className="size-4" aria-hidden="true" /> Back</button>
        <button type="submit" data-testid="payment-continue-button" className={primaryButtonClass}>Review & submit <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></button>
      </div>
    </form>
  );
}
