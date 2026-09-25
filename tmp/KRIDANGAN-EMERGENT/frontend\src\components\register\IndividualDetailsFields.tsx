import type { ReactElement } from "react";
import { Field, inputClass } from "@/components/register/primitives";
import type { ChessDetails, DetailsErrors, EFootballDetails } from "@/components/register/validation";
import type { GameId } from "@/lib/types";

interface Props {
  game: Exclude<GameId, "freefire">;
  value: ChessDetails | EFootballDetails;
  errors: DetailsErrors;
  onChange: (value: ChessDetails | EFootballDetails) => void;
}

export function IndividualDetailsFields({ game, value, errors, onChange }: Props): ReactElement {
  const update = (key: string, next: string): void => onChange({ ...value, [key]: next } as ChessDetails | EFootballDetails);
  const idKey = game === "chess" ? "chess_username" : "efootball_id";
  const idLabel = game === "chess" ? "Chess.com Username / ID" : "E-Football ID / Name";
  const idValue = game === "chess" ? (value as ChessDetails).chess_username : (value as EFootballDetails).efootball_id;
  return (
    <div data-testid={`${game}-individual-fields`} className="grid gap-6 sm:grid-cols-2">
      <Field id="player-name" label="Player Name" error={errors.player_name}><input id="player-name" data-testid="input-player-name" value={value.player_name} onChange={(e) => update("player_name", e.target.value)} className={inputClass} placeholder="Player name" /></Field>
      <Field id="player-game-id" label={idLabel} error={errors[idKey]}><input id="player-game-id" data-testid={`input-${idKey.replace("_", "-")}`} value={idValue} onChange={(e) => update(idKey, e.target.value)} className={inputClass} placeholder={idLabel} /></Field>
      <Field id="player-phone" label="Phone" error={errors.phone}><input id="player-phone" data-testid="input-player-phone" type="tel" inputMode="numeric" value={value.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="10-digit mobile number" /></Field>
      <Field id="player-email" label="Email" error={errors.email}><input id="player-email" data-testid="input-player-email" type="email" inputMode="email" value={value.email} onChange={(e) => update("email", e.target.value)} className={inputClass} placeholder="player@example.com" /></Field>
    </div>
  );
}