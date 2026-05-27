import React from "react";
import { Box, Text } from "ink";
import type { DoctorCheck } from "../../types/doctor.js";

export function DoctorPanel({ checks }: { checks: DoctorCheck[] }): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>Doctor</Text>
      {checks.map((check) => (
        <Text key={check.id} color={check.status === "pass" ? "green" : check.status === "warn" ? "yellow" : "red"}>
          {check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"} {check.label}: {check.message}
        </Text>
      ))}
    </Box>
  );
}
