import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { eventConfig } from "@/config/eventConfig";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Games", href: "/#games" },
  { label: "Prize pool", href: "/#prize-pool" },
  { label: "About", href: "/#about" },
  { label: "Status", href: "/registration-status" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader(): ReactElement {
  const navigate = useNavigate();
  const onRegister = (): void => { void navigate("/register"); };
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  const handleScroll = useCallback((): void => setScrolled(window.scrollY > 20), []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);

  return (
    <header data-testid="site-header" className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${scrolled || mobileOpen ? "border-b border-white/10 bg-[#070707]/85 shadow-2xl shadow-black/20 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" data-testid="navbar-kridangan-logo-link" className="group flex items-center gap-3" aria-label="KRIDANGAN home">
          <img data-testid="navbar-kridangan-logo-image" src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="h-10 w-[88px] object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          <span data-testid="navbar-kridangan-wordmark" className="sr-only">{eventConfig.eventName}</span>
        </Link>

        <nav data-testid="desktop-navigation" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            (item.href.startsWith("/contact") || item.href.startsWith("/registration-status")) ? <a key={item.label} href={item.href} data-testid={`navbar-${item.label.toLowerCase().replace(" ", "-")}-link`} className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#888] transition-colors hover:text-[#F5F5F5]">{item.label}</a> : <a key={item.label} href={item.href} data-testid={`navbar-${item.label.toLowerCase().replace(" ", "-")}-link`} className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#888] transition-colors hover:text-[#F5F5F5]">{item.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onRegister} data-testid="navbar-register-button" className="hidden min-h-11 items-center justify-center bg-[#F97316] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#070707] transition-all duration-300 hover:bg-[#EA580C] hover:shadow-[0_0_24px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707] sm:flex">Register now <span className="ml-2 text-sm" aria-hidden="true">→</span></button>
          <button type="button" onClick={() => setMobileOpen((value) => !value)} data-testid="mobile-menu-toggle-button" aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="flex size-11 items-center justify-center border border-white/10 text-[#F5F5F5] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] lg:hidden">
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only">{mobileOpen ? "Close navigation" : "Open navigation"}</span>
          </button>
        </div>
      </div>

      <nav id="mobile-navigation" data-testid="mobile-navigation" className={`border-t border-white/10 px-5 py-4 lg:hidden ${mobileOpen ? "block" : "hidden"}`}>
        <div className="space-y-1">
          {navItems.map((item) => <a key={item.label} href={item.href} data-testid={`mobile-${item.label.toLowerCase().replace(" ", "-")}-link`} className="block min-h-11 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[#A1A1A1] transition-colors hover:text-[#F97316]">{item.label}</a>)}
          <button type="button" onClick={onRegister} data-testid="mobile-register-button" className="mt-2 flex min-h-12 w-full items-center justify-center bg-[#F97316] font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#070707] transition-colors hover:bg-[#EA580C]">Register now <span className="ml-2 text-sm" aria-hidden="true">→</span></button>
        </div>
      </nav>
    </header>
  );
}