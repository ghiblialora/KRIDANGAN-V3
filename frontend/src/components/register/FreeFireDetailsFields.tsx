import type { ReactElement } from "react";
import { Field, inputClass } from "@/components/register/primitives";
import type { DetailsErrors, FreeFireDetails, PlayerDetails, TeamLeaderDetails } from "@/components/register/validation";

interface Props {
  value: FreeFireDetails;
  errors: DetailsErrors;
  onChange: (value: FreeFireDetails) => void;
}

const fields: { key: keyof PlayerDetails; label: string; type?: string }[] = [
  { key: "uid", label: "UID" }, { key: "ign", label: "IGN" },
  { key: "phone", label: "Phone", type: "tel" }, { key: "email", label: "Email", type: "email" },
];

export function FreeFireDetailsFields({ value, errors, onChange }: Props): ReactElement {
  const updateLeader = (key: keyof TeamLeaderDetails, next: string): void => onChange({ ...value, team_leader: { ...value.team_leader, [key]: next } });
  const updatePlayer = (index: number, key: keyof PlayerDetails, next: string): void => {
    const players = value.players.map((player, i) => i === index ? { ...player, [key]: next } : player);
    onChange({ ...value, players });
  };

  return (
    <div data-testid="freefire-team-fields" className="space-y-8">
      <section>
        <p className="font-heading text-sm font-semibold uppercase text-[#F97316]">Team Leader</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field id="team-leader-name" label="Name" error={errors["team_leader.name"]}>
            <input id="team-leader-name" data-testid="input-team-leader-name" value={value.team_leader.name} onChange={(e) => updateLeader("name", e.target.value)} className={inputClass} placeholder="Team leader name" />
          </Field>
          {fields.map(({ key, label, type }) => <Field key={key} id={`team-leader-${key}`} label={label} error={errors[`team_leader.${key}`]}>
            <input id={`team-leader-${key}`} data-testid={`input-team-leader-${key}`} type={type} inputMode={key === "phone" ? "numeric" : undefined} value={value.team_leader[key]} onChange={(e) => updateLeader(key, e.target.value)} className={inputClass} placeholder={`Team leader ${label}`} />
          </Field>)}
        </div>
      </section>
      {value.players.map((player, index) => (
        <section key={index} data-testid={`freefire-player-${index + 1}-fields`} className="border-t border-white/10 pt-6">
          <p className="font-heading text-sm font-semibold uppercase text-[#F5F5F5]">Player {index + 1}{index === 4 ? <span className="ml-2 text-[#F97316]">· Substitute</span> : null}</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {fields.map(({ key, label, type }) => <Field key={key} id={`player-${index + 1}-${key}`} label={label} error={errors[`players.${index}.${key}`]}>
              <input id={`player-${index + 1}-${key}`} data-testid={`input-player-${index + 1}-${key}`} type={type} inputMode={key === "phone" ? "numeric" : undefined} value={player[key]} onChange={(e) => updatePlayer(index, key, e.target.value)} className={inputClass} placeholder={`Player ${index + 1} ${label}`} />
            </Field>)}
          </div>
        </section>
      ))}
    </div>
  );
}