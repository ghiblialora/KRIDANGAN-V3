import { ArrowLeft, ArrowUpRight, Instagram, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import HalloweenAtmosphere from "@/components/HalloweenAtmosphere";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { eventConfig } from "@/config/eventConfig";

interface SocialLink {
  id: string;
  label: string;
  handle: string;
  href: string;
}

const socials: SocialLink[] = [
  { id: "esports", label: "NxtGen Esports", handle: "@esports.vu", href: eventConfig.contact.instagram.esports },
  { id: "jamrang", label: "JamRang", handle: "@jamrang.vu", href: eventConfig.contact.instagram.jamrang },
  { id: "university", label: "Vijaybhoomi University", handle: "@vijaybhoomiuniversity", href: eventConfig.contact.instagram.university },
];

export default function Contact(): ReactElement {
  return (
    <div data-testid="contact-page" className="min-h-screen bg-[#070707] text-[#F5F5F5]">
      <SiteHeader />
      <main className="relative overflow-hidden pt-32"><div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-50" /><div className="pointer-events-none absolute right-0 top-28 -z-10 size-96 rounded-full bg-[#F97316]/10 blur-[110px]" /><HalloweenAtmosphere variant="page" className="-z-10 h-[780px]" />
        <section data-testid="contact-hero-section" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28"><Link to="/" data-testid="contact-back-home-link" className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#888] transition-colors hover:text-[#F97316]"><ArrowLeft className="size-3" aria-hidden="true" /> Back to home</Link><div className="mt-16 max-w-3xl"><img data-testid="contact-kridangan-logo-image" src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="h-14 w-44 object-cover object-left" /><p data-testid="contact-eyebrow" className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">{eventConfig.eventName} / Contact</p><h1 data-testid="contact-title" className="mt-5 font-heading text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">Contact<br /><span className="text-[#666]">us.</span></h1><p data-testid="contact-subtitle" className="mt-8 max-w-md text-base leading-7 text-[#A1A1A1]">Have a question about KRIDANGAN? Reach out to NxtGen Esports Club.</p></div></section>
        <section data-testid="contact-details-section" className="border-y border-white/10 bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_0.95fr]"><div data-testid="contact-main-card" className="relative overflow-hidden border border-white/10 bg-[#111111] p-7 sm:p-10"><div className="absolute right-0 top-0 size-48 rounded-full bg-[#F97316]/10 blur-3xl" /><div className="relative"><p data-testid="contact-card-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">The club</p><h2 data-testid="contact-card-title" className="mt-5 font-heading text-2xl font-semibold uppercase">NxtGen Esports Club</h2><a data-testid="contact-email-address" href={`mailto:${eventConfig.contact.email}`} className="mt-8 block w-fit text-sm text-[#A1A1A1] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#F97316]">{eventConfig.contact.email}</a><a data-testid="contact-email-button" href={`mailto:${eventConfig.contact.email}`} className="mt-9 inline-flex min-h-12 items-center gap-3 bg-[#F97316] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#070707] transition-all hover:bg-[#EA580C] hover:shadow-[0_0_24px_rgba(249,115,22,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Email us <ArrowUpRight className="size-4" aria-hidden="true" /></a></div></div><div data-testid="contact-location-card" className="border border-white/10 bg-[#111111] p-7 sm:p-10"><div className="flex size-11 items-center justify-center border border-[#F97316]/30 bg-[#F97316]/10"><MapPin className="size-4 text-[#F97316]" aria-hidden="true" /></div><p data-testid="contact-location-label" className="mt-9 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Location</p><p data-testid="contact-location-value" className="mt-4 font-heading text-xl font-semibold uppercase leading-snug">Vijaybhoomi University</p><p data-testid="contact-location-detail" className="mt-2 text-sm text-[#A1A1A1]">{eventConfig.venue}</p></div></div></section>
        <section data-testid="contact-socials-section" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p data-testid="contact-socials-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Stay connected</p><h2 data-testid="contact-socials-title" className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight">Find us<br /><span className="text-[#666]">online.</span></h2></div><div className="divide-y divide-white/10 border-y border-white/10">{socials.map((social) => <a key={social.id} data-testid={`contact-${social.id}-instagram-link`} href={social.href} target="_blank" rel="noopener noreferrer" className="group flex min-h-20 items-center justify-between gap-4 transition-colors hover:bg-white/[0.02] sm:px-3"><span className="flex items-center gap-4"><Instagram className="size-4 text-[#F97316]" aria-hidden="true" /><span><span data-testid={`contact-${social.id}-label`} className="block font-heading text-sm font-semibold uppercase">{social.label}</span><span data-testid={`contact-${social.id}-handle`} className="mt-1 block text-xs text-[#666]">{social.handle}</span></span></span><ArrowUpRight className="size-4 text-[#555] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#F97316]" aria-hidden="true" /></a>)}</div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}