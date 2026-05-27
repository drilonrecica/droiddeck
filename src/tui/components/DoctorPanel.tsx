import { Box, Text } from "ink";
import type { DoctorCheck } from "../../types/doctor.js";

export type DoctorPanelProps = {
  checks: readonly DoctorCheck[];
};

export function DoctorPanel({ checks }: DoctorPanelProps): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Doctor</Text>
      {checks.map((check) => (
        <Text key={check.id} color={check.status === "fail" ? "red" : check.status === "warn" ? "yellow" : "green"}>
          {check.status.toUpperCase()} {check.label}: {check.message}
        </Text>
      ))}
    </Box>
  );
}
