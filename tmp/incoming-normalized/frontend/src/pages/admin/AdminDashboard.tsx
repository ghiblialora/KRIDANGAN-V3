import { useEffect, useState, type ReactElement } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Eye, Loader2, LogOut, Search } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import RegistrationDetailDialog from "@/components/admin/RegistrationDetailDialog";
import { StatusPill, inputClass } from "@/components/register/primitives";
import { eventConfig } from "@/config/eventConfig";
import { apiGet, ApiError } from "@/lib/api";
import { endSession } from "@/lib/session";
import type { GameId, RegStatus, RegistrationPage, Stats } from "@/lib/types";
import { useAdminSession } from "@/lib/adminSession";

type StatusFilter = "ALL" | RegStatus;
type GameFilter = "ALL" | GameId;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "VERIFIED", label: "Verified" }, { value: "REJECTED", label: "Rejected" },
];
const GAME_FILTERS: { value: GameFilter; label: string }[] = [
  { value: "ALL", label: "All games" }, { value: "freefire", label: "Free Fire" }, { value: "chess", label: "Chess" }, { value: "efootball", label: "E-Football" },
];
const PAGE_SIZE = 25;

function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(t); }, [value, delay]);
  return debounced;
}

function StatCard({ label, value, tone, testId }: { label: string; value: number; tone?: string; testId: string }): ReactElement {
  return (
    <div data-testid={testId} className="border border-white/10 bg-[#111111] p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#666]">{label}</p>
      <p className={`mt-3 font-heading text-4xl font-bold leading-none tracking-[-0.04em] ${tone ?? "text-[#F5F5F5]"}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard(): ReactElement {
  const session = useAdminSession();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [gameFilter, setGameFilter] = useState<GameFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [statusFilter, gameFilter, q]);

  const params = new URLSearchParams({ status: statusFilter, game: gameFilter, page: String(page), page_size: String(PAGE_SIZE) });
  if (q.trim()) params.set("q", q.trim());

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<Stats>("/admin/stats"), enabled: Boolean(session.data) });
  const list = useQuery({
    queryKey: ["admin", "registrations", statusFilter, gameFilter, q, page],
    queryFn: () => apiGet<RegistrationPage>(`/admin/registrations?${params.toString()}`),
    enabled: Boolean(session.data),
    placeholderData: keepPreviousData,
  });

  if (session.isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#666]"><Loader2 className="size-6 animate-spin" aria-hidden="true" /></div>;
  if (session.isError || !session.data) {
    if (session.error instanceof ApiError && session.error.status !== 401) return <div className="flex min-h-screen items-center justify-center bg-[#070707] p-6 text-sm text-[#FCA5A5]">Could not reach the server. Please refresh.</div>;
    return <Navigate to="/admin/login" replace />;
  }

  const exportParams = new URLSearchParams({ status: statusFilter, game: gameFilter });
  if (q.trim()) exportParams.set("q", q.trim());
  const totalPages = Math.max(1, Math.ceil((list.data?.total ?? 0) / PAGE_SIZE));

  return (
    <div data-testid="admin-dashboard-page" className="min-h-screen bg-[#070707] text-[#F5F5F5]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="admin-home-link" aria-label="KRIDANGAN home"><img src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="h-9 w-20 object-cover" /></Link>
            <h1 data-testid="admin-title" className="font-heading text-sm font-bold uppercase tracking-[0.12em] sm:text-base">KRIDANGAN Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span data-testid="admin-username" className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[#A1A1A1] sm:inline">{session.data.username}</span>
            <button type="button" onClick={() => void endSession("/admin/login")} data-testid="admin-logout-button" className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#A1A1A1] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316]"><LogOut className="size-3.5" aria-hidden="true" /> Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section data-testid="admin-stats" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total registrations" value={stats.data?.total ?? 0} testId="stat-total" />
          <StatCard label="Pending verification" value={stats.data?.pending ?? 0} tone="text-[#FDE68A]" testId="stat-pending" />
          <StatCard label="Verified" value={stats.data?.verified ?? 0} tone="text-[#86EFAC]" testId="stat-verified" />
          <StatCard label="Rejected" value={stats.data?.rejected ?? 0} tone="text-[#FCA5A5]" testId="stat-rejected" />
        </section>
        <section data-testid="admin-game-stats" className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
          {(stats.data?.games ?? []).map((g) => (
            <div key={g.game} data-testid={`game-stat-${g.game}`} className="flex items-center justify-between bg-[#0A0A0A] px-5 py-4">
              <div><p className="font-heading text-sm font-semibold uppercase">{g.title}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">{g.pending} pending · {g.verified} verified</p></div>
              <p className="font-heading text-2xl font-bold text-[#F97316]">{g.total}</p>
            </div>
          ))}
        </section>

        <section data-testid="admin-registrations" className="border border-white/10 bg-[#0B0B0B]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} type="button" onClick={() => setStatusFilter(f.value)} data-testid={`filter-status-${f.value.toLowerCase()}`} aria-pressed={statusFilter === f.value} className={`min-h-10 border px-4 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${statusFilter === f.value ? "border-[#F97316] bg-[#F97316]/10 text-[#F97316]" : "border-white/10 text-[#A1A1A1] hover:border-white/30"}`}>{f.label}</button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select data-testid="filter-game-select" value={gameFilter} onChange={(e) => setGameFilter(e.target.value as GameFilter)} className={`${inputClass} min-h-10 sm:w-40`} aria-label="Filter by game">
                {GAME_FILTERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#666]" aria-hidden="true" />
                <input data-testid="search-input" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} min-h-10 pl-9 sm:w-64`} placeholder="Search ID, name, email, mobile, UTR, college" aria-label="Search registrations" />
              </div>
              <a href={`/api/admin/registrations/export.csv?${exportParams.toString()}`} data-testid="export-csv-button" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#F97316] px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#070707] transition-colors hover:bg-[#EA580C]"><Download className="size-3.5" aria-hidden="true" /> Export CSV</a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table data-testid="registrations-table" className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-[#0A0A0A] font-mono text-[9px] uppercase tracking-[0.16em] text-[#666]">
                <tr>{["Registration ID", "Name", "Game", "College", "Amount", "UTR", "Status", "Date", "Action"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.isLoading && <tr><td colSpan={9} className="px-4 py-12 text-center text-[#666]"><Loader2 className="mx-auto size-5 animate-spin" aria-hidden="true" /></td></tr>}
                {list.data && list.data.items.length === 0 && <tr><td colSpan={9} data-testid="registrations-empty" className="px-4 py-12 text-center text-[#666]">No registrations match these filters.</td></tr>}
                {list.data?.items.map((r) => (
                  <tr key={r.registration_id} data-testid={`registration-row-${r.registration_id}`} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-3 font-mono text-xs text-[#F5F5F5]">{r.registration_id}</td>
                    <td className="px-4 py-3"><p className="font-medium">{r.full_name}</p><p className="text-xs text-[#666]">{r.email}</p></td>
                    <td className="px-4 py-3 text-[#A1A1A1]">{r.game_title}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-[#A1A1A1]">{r.college}</td>
                    <td className="px-4 py-3 text-[#F97316]">{r.fee_display}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#A1A1A1]">{r.utr_number}</td>
                    <td className="px-4 py-3"><StatusPill status={r.registration_status} /></td>
                    <td className="px-4 py-3 text-xs text-[#A1A1A1]">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelected(r.registration_id)} data-testid={`view-registration-${r.registration_id}`} className="inline-flex min-h-10 items-center gap-2 border border-white/15 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5] transition-colors hover:border-[#F97316]/60 hover:text-[#F97316]"><Eye className="size-3.5" aria-hidden="true" /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 p-4 text-xs text-[#666] sm:flex-row sm:items-center sm:justify-between">
            <p data-testid="registrations-count">{list.data?.total ?? 0} registration{(list.data?.total ?? 0) === 1 ? "" : "s"}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} data-testid="pagination-prev" className="flex size-10 items-center justify-center border border-white/10 text-[#A1A1A1] disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="size-4" aria-hidden="true" /></button>
              <span data-testid="pagination-info" className="font-mono">Page {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} data-testid="pagination-next" className="flex size-10 items-center justify-center border border-white/10 text-[#A1A1A1] disabled:opacity-30" aria-label="Next page"><ChevronRight className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
        </section>
      </main>

      <RegistrationDetailDialog registrationId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
