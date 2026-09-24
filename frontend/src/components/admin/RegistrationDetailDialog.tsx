import { useState, type ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ExternalLink, Loader2, Maximize2, X } from "lucide-react";
import { toast } from "sonner";
import { GameRegistrationDetails } from "@/components/admin/GameRegistrationDetails";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusPill, SummaryRow, ghostButtonClass, inputClass } from "@/components/register/primitives";
import { apiGet, apiPatch, apiPost, errorMessage } from "@/lib/api";
import type { NoteInput, Registration, RegistrationDetail, RejectInput } from "@/lib/types";

const REJECT_REASONS = ["Invalid UTR", "Payment amount mismatch", "Screenshot unclear", "Payment not found", "Duplicate transaction", "Other"];

interface Props {
  registrationId: string | null;
  onClose: () => void;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default function RegistrationDetailDialog({ registrationId, onClose }: Props): ReactElement {
  const queryClient = useQueryClient();
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["admin", "registration", registrationId],
    queryFn: () => apiGet<RegistrationDetail>(`/admin/registrations/${registrationId}`),
    enabled: Boolean(registrationId),
  });

  const refresh = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "registration", registrationId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
    ]);
  };

  const approve = useMutation({
    mutationFn: () => apiPost<Registration>(`/admin/registrations/${registrationId}/approve`),
    onSuccess: async () => { setConfirmApprove(false); toast.success("Payment verified — registration confirmed"); await refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const reject = useMutation({
    mutationFn: (body: RejectInput) => apiPost<Registration>(`/admin/registrations/${registrationId}/reject`, body),
    onSuccess: async () => { setRejecting(false); toast.success("Payment rejected"); await refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const saveNote = useMutation({
    mutationFn: (body: NoteInput) => apiPatch<Registration>(`/admin/registrations/${registrationId}/note`, body),
    onSuccess: async () => { toast.success("Note saved"); setNote(null); await refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const reg = detail.data?.registration;
  const warnings = detail.data?.warnings ?? [];
  const finalReason = reason === "Other" ? otherReason.trim() : reason;

  return (
    <Dialog open={Boolean(registrationId)} onOpenChange={(open) => { if (!open) { setFullscreen(false); setConfirmApprove(false); setRejecting(false); setNote(null); onClose(); } }}>
      <DialogContent showCloseButton={false} data-testid="registration-detail-dialog" className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto sm:max-w-[900px] border-white/10 bg-[#0B0B0B] p-0 text-[#F5F5F5] sm:rounded-lg">
        <DialogHeader className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0B0B]/95 p-5 text-left backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Registration details</p>
              <DialogTitle data-testid="detail-registration-id" className="mt-1 font-heading text-2xl font-bold tracking-[0.04em]">{registrationId}</DialogTitle>
              <DialogDescription className="sr-only">Participant details, payment proof and verification actions.</DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              {reg && <StatusPill status={reg.registration_status} />}
              <DialogClose data-testid="detail-close-button" className="flex size-10 items-center justify-center border border-white/10 text-[#A1A1A1] hover:border-[#F97316]/50 hover:text-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"><X className="size-4" aria-hidden="true" /><span className="sr-only">Close</span></DialogClose>
            </div>
          </div>
        </DialogHeader>

        {detail.isLoading && <div className="flex min-h-40 items-center justify-center text-[#666]"><Loader2 className="size-5 animate-spin" aria-hidden="true" /></div>}
        {detail.isError && <p className="p-6 text-sm text-[#FCA5A5]">{errorMessage(detail.error)}</p>}

        {reg && (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_minmax(0,380px)]">
            <div className="space-y-6">
              {warnings.length > 0 && (
                <div data-testid="detail-warnings" className="space-y-2">
                  {warnings.map((w) => (
                    <p key={w.kind} data-testid={`detail-warning-${w.kind}`} className="flex items-start gap-3 border border-[#FACC15]/40 bg-[#FACC15]/10 px-4 py-3 text-sm text-[#FDE68A]"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{w.message} <span className="font-mono text-xs text-[#FACC15]">({w.registration_ids.join(", ")})</span></span></p>
                  ))}
                </div>
              )}
              <dl className="divide-y divide-white/10 border-y border-white/10">
                <SummaryRow label="Participant" value={reg.full_name} testId="detail-name" />
                <SummaryRow label="Email" value={reg.email} testId="detail-email" />
                <SummaryRow label="Mobile" value={reg.mobile} testId="detail-mobile" />
                <SummaryRow label="College" value={reg.college} testId="detail-college" />
                <SummaryRow label="Student ID" value={reg.student_id} testId="detail-student-id" />
                <SummaryRow label="Game" value={reg.game_title} testId="detail-game" />
                <SummaryRow label="Registration fee" value={<span className="text-[#F97316]">{reg.fee_display}</span>} testId="detail-fee" />
                <SummaryRow label="UTR / Transaction ID" value={<span className="font-mono">{reg.utr_number}</span>} testId="detail-utr" />
                <SummaryRow label="Submitted" value={formatDate(reg.created_at)} testId="detail-submitted" />
                {reg.verified_at && <SummaryRow label="Verified" value={`${formatDate(reg.verified_at)} · ${reg.verified_by ?? ""}`} testId="detail-verified" />}
              </dl>

              <GameRegistrationDetails registration={reg} />

              <div data-testid="detail-admin-note">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A1A1A1]">Internal admin note</p>
                <textarea data-testid="detail-note-input" value={note ?? reg.admin_note ?? ""} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputClass} mt-2 min-h-24 py-3`} placeholder="e.g. Payment verified from bank statement." />
                <button type="button" disabled={note === null || saveNote.isPending} onClick={() => saveNote.mutate({ admin_note: note ?? "" })} data-testid="detail-save-note-button" className="mt-2 inline-flex min-h-10 items-center gap-2 border border-white/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316] disabled:cursor-not-allowed disabled:opacity-40">Save note</button>
              </div>

              <div data-testid="detail-verification" className="border border-white/10 bg-[#111111] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Payment verification</p>
                {reg.payment_status === "VERIFIED" && <p data-testid="detail-verified-banner" className="mt-4 flex items-center gap-3 border border-[#22C55E]/40 bg-[#22C55E]/10 px-4 py-3 font-heading text-sm font-semibold uppercase text-[#86EFAC]"><Check className="size-4" aria-hidden="true" /> Payment verified · Registration confirmed</p>}
                {reg.payment_status === "REJECTED" && <p data-testid="detail-rejected-banner" className="mt-4 border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 font-heading text-sm font-semibold uppercase text-[#FCA5A5]">Payment rejected{reg.admin_note ? <span className="mt-1 block font-sans text-xs font-normal normal-case text-[#FCA5A5]/80">{reg.admin_note}</span> : null}</p>}

                {!confirmApprove && !rejecting && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {reg.payment_status !== "VERIFIED" && <button type="button" onClick={() => setConfirmApprove(true)} data-testid="detail-approve-button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#22C55E] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#052e16] transition-colors hover:bg-[#16A34A]"><Check className="size-4" aria-hidden="true" /> Approve payment</button>}
                    {reg.payment_status !== "REJECTED" && <button type="button" onClick={() => setRejecting(true)} data-testid="detail-reject-button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-[#EF4444]/60 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#FCA5A5] transition-colors hover:bg-[#EF4444] hover:text-white"><X className="size-4" aria-hidden="true" /> Reject payment</button>}
                  </div>
                )}

                {confirmApprove && (
                  <div data-testid="detail-approve-confirm" className="mt-4 border border-[#22C55E]/40 bg-[#22C55E]/5 p-4">
                    <p className="text-sm text-[#F5F5F5]">Are you sure you want to verify this payment?</p>
                    {warnings.some((w) => w.kind === "utr") && <p className="mt-2 text-xs text-[#FDE68A]">This UTR appears on another registration. Confirm against your bank/UPI records first.</p>}
                    <div className="mt-4 flex gap-3">
                      <button type="button" onClick={() => approve.mutate()} disabled={approve.isPending} data-testid="detail-approve-confirm-button" className="inline-flex min-h-11 items-center gap-2 bg-[#22C55E] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#052e16] hover:bg-[#16A34A] disabled:opacity-60">{approve.isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />} Yes, verify</button>
                      <button type="button" onClick={() => setConfirmApprove(false)} data-testid="detail-approve-cancel-button" className={`${ghostButtonClass} min-h-11 px-5 text-[10px]`}>Cancel</button>
                    </div>
                  </div>
                )}

                {rejecting && (
                  <div data-testid="detail-reject-form" className="mt-4 border border-[#EF4444]/40 bg-[#EF4444]/5 p-4">
                    <label htmlFor="reject-reason" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A1A1A1]">Rejection reason</label>
                    <select id="reject-reason" data-testid="detail-reject-reason-select" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} mt-2`}>
                      {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {reason === "Other" && <input data-testid="detail-reject-other-input" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} className={`${inputClass} mt-3`} placeholder="Describe the reason" />}
                    <div className="mt-4 flex gap-3">
                      <button type="button" onClick={() => reject.mutate({ reason: finalReason })} disabled={reject.isPending || finalReason.length < 2} data-testid="detail-reject-confirm-button" className="inline-flex min-h-11 items-center gap-2 bg-[#EF4444] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60">{reject.isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />} Confirm rejection</button>
                      <button type="button" onClick={() => setRejecting(false)} data-testid="detail-reject-cancel-button" className={`${ghostButtonClass} min-h-11 px-5 text-[10px]`}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div data-testid="detail-screenshot-panel">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A1A1A1]">Payment screenshot</p>
              <div className="mt-2 border border-white/10 bg-[#070707] p-2">
                <img data-testid="detail-screenshot-image" src={reg.payment_screenshot_url} alt={`Payment screenshot for ${reg.registration_id}`} className="max-h-[420px] w-full cursor-zoom-in object-contain" onClick={() => setFullscreen(true)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setFullscreen(true)} data-testid="detail-screenshot-fullscreen-button" className={`${ghostButtonClass} min-h-11 flex-1 px-4 text-[10px]`}><Maximize2 className="size-3.5" aria-hidden="true" /> View full screen</button>
                <a href={reg.payment_screenshot_url} target="_blank" rel="noopener noreferrer" data-testid="detail-screenshot-open-link" className={`${ghostButtonClass} min-h-11 flex-1 px-4 text-[10px]`}><ExternalLink className="size-3.5" aria-hidden="true" /> Open image</a>
              </div>
            </div>
          </div>
        )}

        {fullscreen && reg && (
          <button type="button" onClick={() => setFullscreen(false)} data-testid="detail-screenshot-fullscreen-overlay" aria-label="Close full screen screenshot" className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/95 p-4">
            <img src={reg.payment_screenshot_url} alt={`Payment screenshot for ${reg.registration_id} (full screen)`} className="max-h-full max-w-full object-contain" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
