import { Box, Text } from "ink";
import type { DoctorCheck } from "../../types/doctor.js";
import type { AndroidDevice } from "../../types/device.js";
import type { ProjectInfo } from "../../types/project.js";
import type { AndroidVariant } from "../../types/variant.js";

export type HeaderProps = {
  project: ProjectInfo;
  doctorChecks: readonly DoctorCheck[];
  selectedVariant?: AndroidVariant;
  selectedDevice?: AndroidDevice;
  appStatus?: "running" | "not running" | "unknown";
};

export function Header({ project, doctorChecks, selectedVariant, selectedDevice, appStatus = "unknown" }: HeaderProps): JSX.Element {
  const failed = doctorChecks.filter((check) => check.status === "fail").length;
  const warning = doctorChecks.filter((check) => check.status === "warn").length;
  const passed = doctorChecks.filter((check) => check.status === "pass").length;
  const doctorSummary = `${passed}/${doctorChecks.length}${failed ? ` fail:${failed}` : warning ? ` warn:${warning}` : ""}`;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>DroidDeck</Text>
      <Text>
        Project: {project.name} | Module: {project.appModule} | Doctor: {doctorSummary}
      </Text>
      <Text>
        Variant: {selectedVariant?.name ?? "not selected"} | Device: {selectedDevice?.model ?? selectedDevice?.id ?? "not selected"} | App: {appStatus}
      </Text>
    </Box>
  );
}
