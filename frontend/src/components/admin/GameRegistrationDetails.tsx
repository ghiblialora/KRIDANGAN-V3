import type { ReactElement } from "react";
import { ExternalLink } from "lucide-react";
import { SummaryRow } from "@/components/register/primitives";
import type { ChessDetails, EFootballDetails, FreeFireDetails } from "@/components/register/validation";
import type { Registration } from "@/lib/types";

export function GameRegistrationDetails({ registration }: { registration: Registration }): ReactElement {
  const details = registration.game_details;
  return (
    <div data-testid="detail-game-registration" className="space-y-5">
      <dl className="divide-y divide-white/10 border-y border-white/10">
        <SummaryRow label="Registration type" value={registration.registration_type} testId="detail-registration-type" />
        <SummaryRow label="Mode" value={registration.mode} testId="detail-mode" />
        <SummaryRow label="Rule Book accepted" value={registration.rulebook_accepted ? "Yes" : "No"} testId="detail-rulebook-accepted" />
      </dl>
      <a href={registration.rulebook_url} target="_blank" rel="noopener noreferrer" data-testid="detail-rulebook-link" className="inline-flex min-h-10 items-center gap-2 border border-white/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F97316] hover:border-[#F97316]/60"><ExternalLink className="size-3.5" aria-hidden="true" /> Open Rule Book</a>
      {registration.game === "freefire" ? <FreeFireAdminDetails details={details as unknown as FreeFireDetails} /> : <IndividualAdminDetails game={registration.game} details={details as unknown as ChessDetails | EFootballDetails} />}
    </div>
  );
}

function FreeFireAdminDetails({ details }: { details: FreeFireDetails }): ReactElement {
  if (!details.team_leader || !Array.isArray(details.players)) return <p data-testid="detail-legacy-roster" className="text-xs text-[#666]">Roster details were not collected for this legacy registration.</p>;
  return (
    <div data-testid="detail-freefire-roster" className="space-y-5">
      <ParticipantBlock title="Team Leader" testId="detail-team-leader" participant={details.team_leader} name={details.team_leader.name} />
      {details.players.map((player, index) => <ParticipantBlock key={index} title={index === 4 ? "Player 5 · Substitute" : `Player ${index + 1}`} testId={`detail-player-${index + 1}`} participant={player} />)}
    </div>
  );
}

function ParticipantBlock({ title, testId, participant, name }: { title: string; testId: string; participant: { uid: string; ign: string; phone: string; email: string }; name?: string }): ReactElement {
  return (
    <section data-testid={testId} className="border border-white/10 bg-[#111111] p-4">
      <p className="font-heading text-sm font-semibold uppercase text-[#F97316]">{title}</p>
      <dl className="mt-3 divide-y divide-white/10">
        {name && <SummaryRow label="Name" value={name} testId={`${testId}-name`} />}
        <SummaryRow label="UID" value={participant.uid} testId={`${testId}-uid`} />
        <SummaryRow label="IGN" value={participant.ign} testId={`${testId}-ign`} />
        <SummaryRow label="Phone" value={participant.phone} testId={`${testId}-phone`} />
        <SummaryRow label="Email" value={participant.email} testId={`${testId}-email`} />
      </dl>
    </section>
  );
}

function IndividualAdminDetails({ game, details }: { game: "chess" | "efootball"; details: ChessDetails | EFootballDetails }): ReactElement {
  if (!details.player_name) return <p data-testid="detail-legacy-player" className="text-xs text-[#666]">Player details were not collected for this legacy registration.</p>;
  const identifier = game === "chess" ? (details as ChessDetails).chess_username : (details as EFootballDetails).efootball_id;
  return (
    <dl data-testid="detail-individual-player" className="divide-y divide-white/10 border-y border-white/10">
      <SummaryRow label="Player name" value={details.player_name} testId="detail-player-name" />
      <SummaryRow label={game === "chess" ? "Chess.com Username / ID" : "E-Football ID / Name"} value={identifier} testId="detail-player-game-id" />
      <SummaryRow label="Phone" value={details.phone} testId="detail-player-phone" />
      <SummaryRow label="Email" value={details.email} testId="detail-player-email" />
    </dl>
  );
}