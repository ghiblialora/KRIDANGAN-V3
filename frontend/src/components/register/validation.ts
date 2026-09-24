import type { GameId } from "@/lib/types";

export interface PlayerDetails { uid: string; ign: string; phone: string; email: string }
export interface TeamLeaderDetails extends PlayerDetails { name: string }
export interface FreeFireDetails { team_leader: TeamLeaderDetails; players: PlayerDetails[] }
export interface ChessDetails { player_name: string; chess_username: string; phone: string; email: string }
export interface EFootballDetails { player_name: string; efootball_id: string; phone: string; email: string }
export type GameDetails = FreeFireDetails | ChessDetails | EFootballDetails;

export interface Details {
  college: string;
  student_id: string;
  rulebook_accepted: boolean;
  game_details: GameDetails;
}

const emptyPlayer = (): PlayerDetails => ({ uid: "", ign: "", phone: "", email: "" });

export function createEmptyDetails(game: GameId): Details {
  const gameDetails: Record<GameId, GameDetails> = {
    freefire: { team_leader: { name: "", ...emptyPlayer() }, players: Array.from({ length: 5 }, emptyPlayer) },
    chess: { player_name: "", chess_username: "", phone: "", email: "" },
    efootball: { player_name: "", efootball_id: "", phone: "", email: "" },
  };
  return { college: "", student_id: "", rulebook_accepted: false, game_details: gameDetails[game] };
}

export type DetailsErrors = Record<string, string>;
const validEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
const validMobile = (value: string): boolean => /^[6-9]\d{9}$/.test(value.replace(/[\s-]/g, "").replace(/^\+91/, "").replace(/^0(?=\d{10}$)/, ""));

function validateContact(contact: PlayerDetails, prefix: string, errors: DetailsErrors): void {
  if (contact.uid.trim().length < 2) errors[`${prefix}.uid`] = "Enter the player UID.";
  if (contact.ign.trim().length < 2) errors[`${prefix}.ign`] = "Enter the in-game name.";
  if (!validMobile(contact.phone)) errors[`${prefix}.phone`] = "Enter a valid 10-digit Indian mobile number.";
  if (!validEmail(contact.email)) errors[`${prefix}.email`] = "Enter a valid email address.";
}

export function validateDetails(d: Details, game: GameId): DetailsErrors {
  const errors: DetailsErrors = {};
  if (d.college.trim().length < 2) errors.college = "Enter your college or institution.";
  if (d.student_id.trim().length < 2) errors.student_id = "Enter your student / college ID.";
  if (!d.rulebook_accepted) errors.rulebook_accepted = "Read and accept the Rule Book to continue.";
  if (game === "freefire") {
    const details = d.game_details as FreeFireDetails;
    if (details.team_leader.name.trim().length < 2) errors["team_leader.name"] = "Enter the team leader's name.";
    validateContact(details.team_leader, "team_leader", errors);
    details.players.forEach((player, index) => validateContact(player, `players.${index}`, errors));
  } else {
    const details = d.game_details as ChessDetails | EFootballDetails;
    if (details.player_name.trim().length < 2) errors.player_name = "Enter the player's name.";
    if (game === "chess" && (details as ChessDetails).chess_username.trim().length < 2) errors.chess_username = "Enter the Chess.com username / ID.";
    if (game === "efootball" && (details as EFootballDetails).efootball_id.trim().length < 2) errors.efootball_id = "Enter the E-Football ID / name.";
    if (!validMobile(details.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!validEmail(details.email)) errors.email = "Enter a valid email address.";
  }
  return errors;
}

export function primaryContact(details: Details, game: GameId): { full_name: string; email: string; mobile: string } {
  if (game === "freefire") {
    const leader = (details.game_details as FreeFireDetails).team_leader;
    return { full_name: leader.name, email: leader.email, mobile: leader.phone };
  }
  const player = details.game_details as ChessDetails | EFootballDetails;
  return { full_name: player.player_name, email: player.email, mobile: player.phone };
}

export function detailSummary(details: Details, game: GameId): { label: string; value: string; testId: string }[] {
  if (game === "freefire") {
    const data = details.game_details as FreeFireDetails;
    return [
      { label: "Team leader", value: `${data.team_leader.name} · ${data.team_leader.ign} · ${data.team_leader.uid}`, testId: "summary-team-leader" },
      ...data.players.map((player, index) => ({ label: index === 4 ? "Player 5 · Substitute" : `Player ${index + 1}`, value: `${player.ign} · ${player.uid} · ${player.phone} · ${player.email}`, testId: `summary-player-${index + 1}` })),
    ];
  }
  const data = details.game_details as ChessDetails | EFootballDetails;
  const identifier = game === "chess" ? (data as ChessDetails).chess_username : (data as EFootballDetails).efootball_id;
  return [
    { label: "Player", value: data.player_name, testId: "summary-player-name" },
    { label: game === "chess" ? "Chess.com ID" : "E-Football ID", value: identifier, testId: "summary-player-id" },
    { label: "Phone", value: data.phone, testId: "summary-player-phone" },
    { label: "Email", value: data.email, testId: "summary-player-email" },
  ];
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateScreenshot(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Only JPG, JPEG, PNG or WEBP images are accepted.";
  if (file.size > MAX_BYTES) return "Screenshot must be 5 MB or smaller.";
  return null;
}


// Clipboard with a legacy fallback (navigator.clipboard is unavailable on http or in some webviews).
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
