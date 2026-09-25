import { ArrowUpRight, Instagram, Mail } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { eventConfig } from "@/config/eventConfig";

export default function SiteFooter(): ReactElement {
  return (
    <footer data-testid="site-footer" className="border-t border-white/10 bg-[#070707]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div>
            <div data-testid="footer-kridangan-brand" className="flex items-center gap-3"><img data-testid="footer-kridangan-logo-image" src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="h-12 w-28 object-cover" /><span className="sr-only">{eventConfig.eventName}</span></div>
            <p data-testid="footer-powered-by" className="mt-4 max-w-xs text-sm leading-relaxed text-[#666]">Powered by {eventConfig.organizer}</p>
          </div>
          <div>
            <p data-testid="footer-network-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">The network</p>
            <div data-testid="footer-network-value" className="mt-4 flex items-center gap-3"><img data-testid="footer-jamrang-logo-image" src={eventConfig.logoPaths.jamrang} alt="JamRang logo" className="h-10 w-20 rounded-sm object-contain" /><span className="text-[#555]">×</span><span data-testid="footer-nxtgen-logo-crop" className="flex h-10 w-12 items-center justify-center overflow-hidden rounded-sm bg-black"><img src={eventConfig.logoPaths.nxtgen} alt="NxtGen Esports Club logo" className="h-full w-full scale-[3.5] object-contain object-center" /></span><span className="text-[#555]">×</span><span data-testid="footer-university-logo-image" className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-sm bg-white"><img src={eventConfig.logoPaths.university} alt="Vijaybhoomi University logo" className="h-full w-full object-contain" /></span></div>
          </div>
          <div>
            <p data-testid="footer-connect-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">Connect</p>
            <div className="mt-4 flex items-center gap-3">
              <a data-testid="footer-instagram-link" href={eventConfig.contact.instagram.esports} target="_blank" rel="noopener noreferrer" aria-label="NxtGen Esports Club on Instagram" className="flex size-11 items-center justify-center border border-white/10 text-[#A1A1A1] transition-all hover:border-[#F97316]/60 hover:text-[#F97316]"><Instagram className="size-4" aria-hidden="true" /></a>
              <a data-testid="footer-email-link" href={`mailto:${eventConfig.contact.email}`} aria-label="Email NxtGen Esports Club" className="flex size-11 items-center justify-center border border-white/10 text-[#A1A1A1] transition-all hover:border-[#F97316]/60 hover:text-[#F97316]"><Mail className="size-4" aria-hidden="true" /></a>
              <Link to="/registration-status" data-testid="footer-status-link" className="ml-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#A1A1A1] transition-colors hover:text-[#F97316]">Status</Link>
              <Link to="/contact" data-testid="footer-contact-link" className="ml-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#A1A1A1] transition-colors hover:text-[#F97316]">Contact <ArrowUpRight className="size-3" aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.15em] text-[#555] sm:flex-row sm:items-center sm:justify-between">
          <p data-testid="footer-copyright">© 2026 {eventConfig.eventName}. All rights reserved.</p>
          <p data-testid="footer-location">{eventConfig.venue}</p>
        </div>
      </div>
    </footer>
  );
}