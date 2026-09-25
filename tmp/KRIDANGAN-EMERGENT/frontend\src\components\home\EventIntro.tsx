import type { ReactElement } from "react";
import { CalendarDays, Clock3, FileText, Ticket } from "lucide-react";
import { eventConfig } from "@/config/eventConfig";

export default function EventIntro(): ReactElement {
  return (
<section data-testid="event-introduction-section" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
  <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
    <div><p data-testid="event-intro-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">01 / The event</p><h2 data-testid="event-intro-title" className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">The battle<br /><span className="text-[#666]">begins.</span></h2></div>
    <div><p data-testid="event-intro-copy" className="max-w-2xl text-lg leading-8 text-[#A1A1A1] sm:text-xl">KRIDANGAN is the esports and gaming wing of {eventConfig.parentEventFull}, bringing competitive gaming, strategy and virtual football to Vijaybhoomi University for its first season.</p><div className="mt-12 grid gap-0 border-y border-white/10 sm:grid-cols-3">
      <div data-testid="event-intro-season-info" className="border-b border-white/10 py-6 sm:border-b-0 sm:border-r sm:pr-5"><p className="font-mono text-[10px] tracking-[0.2em] text-[#F97316]">01</p><p data-testid="event-intro-season-label" className="mt-5 font-heading text-lg font-semibold uppercase">{eventConfig.season}</p><p data-testid="event-intro-season-value" className="mt-2 text-sm leading-6 text-[#666]">Esports and gaming<br />under {eventConfig.parentEventFull}</p></div>
      <div data-testid="event-intro-date-info" className="border-b border-white/10 py-6 sm:border-b-0 sm:border-r sm:px-5"><p className="font-mono text-[10px] tracking-[0.2em] text-[#F97316]">02</p><p data-testid="event-intro-date-label" className="mt-5 font-heading text-lg font-semibold uppercase">Event dates</p><p data-testid="event-intro-date-value" className="mt-2 text-sm leading-6 text-[#666]"><time dateTime={eventConfig.eventDate.start}>29 October</time><br /><time dateTime={eventConfig.eventDate.end}>30 October 2026</time></p></div>
      <div data-testid="event-intro-campus-info" className="py-6 sm:pl-5"><p className="font-mono text-[10px] tracking-[0.2em] text-[#F97316]">03</p><p data-testid="event-intro-campus-label" className="mt-5 font-heading text-lg font-semibold uppercase">Campus</p><p data-testid="event-intro-campus-value" className="mt-2 text-sm leading-6 text-[#666]">{eventConfig.university}<br />Jamrung, Karjat</p></div>
    </div></div>
  </div>
  <div data-testid="event-briefing-status-grid" className="mt-16 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
    <div data-testid="event-briefing-date-card" className="bg-[#0A0A0A] p-5 sm:p-6"><CalendarDays className="size-4 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" /><p data-testid="event-briefing-date-label" className="mt-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Event dates</p><p data-testid="event-briefing-date-value" className="mt-2 font-heading text-sm font-semibold uppercase text-[#F5F5F5]">{eventConfig.eventDate.display}</p></div>
    <div data-testid="event-briefing-schedule-card" className="bg-[#0A0A0A] p-5 sm:p-6"><Clock3 className="size-4 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" /><p data-testid="event-briefing-schedule-label" className="mt-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Detailed schedule</p><p data-testid="event-briefing-schedule-value" className="mt-2 font-heading text-sm font-semibold uppercase text-[#A1A1A1]">{eventConfig.eventDetails.schedule}</p></div>
    <div data-testid="event-briefing-rules-card" className="bg-[#0A0A0A] p-5 sm:p-6"><FileText className="size-4 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" /><p data-testid="event-briefing-rules-label" className="mt-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Rules & formats</p><a href="#games" data-testid="event-briefing-rules-value" className="mt-2 inline-block font-heading text-sm font-semibold uppercase text-[#A1A1A1] transition-colors hover:text-[#F97316]">{eventConfig.eventDetails.rules}</a></div>
    <div data-testid="event-briefing-fee-card" className="bg-[#0A0A0A] p-5 sm:p-6"><Ticket className="size-4 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" /><p data-testid="event-briefing-fee-label" className="mt-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">Registration fee</p><p data-testid="event-briefing-fee-value" className="mt-2 font-heading text-sm font-semibold uppercase text-[#A1A1A1]">{eventConfig.eventDetails.registrationFee}</p></div>
  </div>
</section>
  );
}
