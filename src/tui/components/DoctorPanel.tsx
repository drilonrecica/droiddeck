import type { DoctorCheck } from "../../types/doctor.js";
import { Line } from "./Line.js";

export type DoctorPanelProps = {
  checks: readonly DoctorCheck[];
};

export function DoctorPanel({ checks }: DoctorPanelProps) {
  return (
    <box title="Doctor" flexDirection="column" border borderStyle="rounded" paddingX={1} height={checks.length + 2}>
      {checks.map((check) => (
        <Line key={check.id} fg={check.status === "fail" ? "#EF4444" : check.status === "warn" ? "#F59E0B" : "#22C55E"}>
          {`${check.status.toUpperCase()} ${check.label}: ${check.message}`}
        </Line>
      ))}
    </box>
  );
}
