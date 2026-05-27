# DroidDeck MVP1 Task Roadmap

## Project Summary

DroidDeck is a macOS-first Node.js + TypeScript CLI/TUI command center for native Android development. It wraps common Gradle and ADB workflows into a fast keyboard-driven terminal experience: discover Android variants, select a device, install and launch a variant, view filtered logs, run tests, perform safe ADB actions, capture screenshots, persist per-project preferences, and run doctor checks.

This roadmap describes the full MVP from zero. It intentionally ignores any partial implementation that may exist in the repository. `docs/PLAN.md` remains the source of truth for product behavior and boundaries.

## MVP Goals

- Provide a `droiddeck` executable that opens a TUI dashboard by default.
- Provide direct CLI commands for doctor, variants, devices, selection, run, logs, tests, app actions, uninstall, and screenshots.
- Detect Android project roots from the current directory or parent directories.
- Use the project Gradle wrapper only.
- Support single app module first, with `app` as default and `droiddeck.config.json` override.
- Discover Android variants from Gradle tasks without requiring manual variant lists.
- Persist selected variant, device, and log mode per project path.
- Resolve application IDs through config and safe inference, failing clearly when uncertain.
- Support single-device MVP workflows while keeping internal state future-compatible with multi-device mode.
- Keep all Android, Gradle, ADB, process, config, and parsing behavior reusable between CLI and TUI.
- Ship enough tests and manual verification guidance to use DroidDeck daily on a real multi-flavor Android project.

## Explicit Non-Goals

- No Android Studio plugin.
- No desktop GUI.
- No AI crash/log analysis.
- No analytics, telemetry, or external data upload.
- No Firebase Crashlytics, Firebase Analytics, Firebase App Distribution, or Google Play upload integration.
- No release checklist automation.
- No CI/CD integration.
- No cloud device farm.
- No profiler replacement, FPS/jank dashboard, memory dashboard, or CPU dashboard.
- No deep APK/AAB analysis.
- No required multi-device execution in MVP1.
- No Windows/Linux support requirement in MVP1.
- No complex Gradle plugin.
- No automatic source-code modifications.
- No destructive action without explicit user command.
- No project-specific hardcoding, including package names, flavor names, paths, aliases, or branding.

## Assumptions And Decisions

- This roadmap is full MVP-from-zero and includes the skeleton phase.
- macOS-first is sufficient for MVP1; avoid needless platform coupling where practical.
- Node.js 20+ and TypeScript are required.
- Use ESM if practical.
- Use `pnpm` in docs and scripts; npm is acceptable only when local tooling requires it.
- Use Commander for CLI parsing.
- Use Ink for the full TUI dashboard.
- Use Execa for Gradle and ADB child processes.
- Use Zod for `droiddeck.config.json` validation.
- Use Vitest for unit tests.
- Use `./gradlew`; never silently fall back to system Gradle.
- Default app module is `app`; accept both `app` and `:app` in config, normalize internally to `app`.
- Application ID resolution must support config lookup and safe inference. Unsafe or uncertain inference must fail with an actionable config snippet.
- Screenshot output stays at `<project-root>/.droiddeck/screenshots/` because `docs/PLAN.md` defines that path. Documentation must recommend ignoring `.droiddeck/` in Android projects.
- Optional MVP items in `docs/PLAN.md` are implementation phases when they remain inside MVP boundaries.
- MVP1.5-only actions are not implemented unless a later prompt explicitly changes scope.

## Global Safety Constraints

- Do not clear app data unless the user explicitly passes `--fresh` or invokes the clear-data action.
- Do not uninstall without explicit confirmation. CLI uninstall requires `--yes` or an interactive confirmation; TUI uninstall requires confirmation.
- Do not perform destructive actions by default.
- Do not clear the global Logcat buffer by default; only clear DroidDeck's visible log panel.
- Do not modify Android project source files.
- Do not modify repo config automatically in MVP1 unless a future setup command is explicitly requested.
- User preferences may be written automatically to `~/.droiddeck/preferences.json`.
- Only kill child processes started by DroidDeck.
- Do not kill unrelated Gradle daemons, ADB processes, Logcat processes, or app processes outside explicit user commands.
- Do not send logs, code, project metadata, device data, or crash data anywhere externally.
- Do not add AI, analytics, telemetry, Firebase integrations, release automation, Android Studio plugin behavior, GUI behavior, or external network calls.
- All app-specific ADB commands require a resolved application ID.
- All ADB commands must target an explicit selected device when more than one online device exists.
- All command failures should show the command, exit code when available, relevant output, and an actionable suggestion.

## Implementation Phases

### Phase 1 - Project Skeleton And CLI Stubs

- **Priority:** Critical
- **Recommended mode:** Normal mode
- **Reasoning level:** Medium
- **Dependencies:** None
- **Goal:** Create the Node.js + TypeScript ESM foundation with the `droiddeck` executable and all planned CLI routes stubbed.
- **Scope:**
  - Initialize package metadata for `droiddeck`.
  - Configure strict TypeScript.
  - Add Commander CLI entrypoint.
  - Add Vitest smoke test.
  - Add basic README status and command examples.
  - Register all MVP CLI commands with clear "not implemented yet" output.
- **Tasks:**
  1. Create `package.json` with `type: "module"`, Node 20+ engine, `bin.droiddeck`, and scripts `dev`, `build`, `start`, `test`, `typecheck`.
  2. Add dependencies needed for this phase: `commander`.
  3. Add dev dependencies: `typescript`, `tsx`, `vitest`, `@types/node`.
  4. Create strict `tsconfig.json` using NodeNext module resolution.
  5. Add `src/index.ts` as the executable entrypoint.
  6. Add `src/cli/program.ts` with Commander setup.
  7. Add `src/cli/commands/` with stub handlers for every MVP command.
  8. Add placeholder directories for `src/core/`, `src/tui/`, `src/types/`, and `src/utils/`.
  9. Add one minimal Vitest test proving the test runner works.
  10. Update README with current skeleton status and `docs/PLAN.md` source-of-truth note.
- **Files likely added or modified:**
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `README.md`
  - `src/index.ts`
  - `src/cli/program.ts`
  - `src/cli/commands/*`
  - `tests/unit/smoke.test.ts`
- **Expected tests:**
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`
- **Manual verification:**
  - Run `pnpm dev -- --help`.
  - Run built CLI with `node dist/index.js --help`.
  - Confirm `node dist/index.js` prints the dashboard placeholder.
  - Confirm each command prints a clear placeholder.
- **Acceptance criteria:**
  - `droiddeck --help` lists all MVP commands.
  - TypeScript build succeeds.
  - Vitest succeeds.
  - No Android, Gradle, ADB, Logcat, or TUI behavior is implemented in this phase.
- **Out of scope:**
  - Project detection.
  - Config loading.
  - Gradle or ADB integration.
  - Ink TUI.
  - Real command behavior.
- **Suggested commit subject:** `chore: scaffold droiddeck cli project`
- **Suggested commit message body:**
  ```text
  Add the initial Node.js and TypeScript project skeleton.

  Register the DroidDeck CLI command surface with placeholder handlers,
  configure strict TypeScript and Vitest, and document the current skeleton
  status. No Android, Gradle, ADB, Logcat, or TUI behavior is implemented yet.
  ```

### Phase 2 - Core Project Detection, Config, And Preferences

- **Priority:** Critical
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phase 1
- **Goal:** Add reusable core services for finding Android project roots, loading validated repo config, and managing user preferences.
- **Scope:**
  - Project root search from `process.cwd()` upward.
  - Optional `droiddeck.config.json`.
  - Zod schema and config defaults.
  - Per-project preferences in `~/.droiddeck/preferences.json`.
  - Shared path and module normalization helpers.
- **Tasks:**
  1. Add `zod` and filesystem helper dependency if useful.
  2. Define config, project, and preference types.
  3. Implement upward project root detection using `settings.gradle`, `settings.gradle.kts`, or `gradlew` markers.
  4. Validate that a usable Android root generally has `gradlew` plus a settings file.
  5. Implement `droiddeck.config.json` loading from project root.
  6. Implement Zod validation for `projectName`, `appModule`, `variantAliases`, `applicationIds`, `mainActivity`, `logcat`, and `actions`.
  7. Normalize `appModule` values such as `app` and `:app` to `app`.
  8. Enforce `mainActivity` when `actions.launchMode` is `activity`.
  9. Implement preferences file read/write at `~/.droiddeck/preferences.json`.
  10. Store preferences per absolute project path.
  11. Add helpful errors for invalid config and missing project roots.
  12. Wire CLI stubs only enough to call these helpers where appropriate if useful, without implementing later command behavior.
- **Files likely added or modified:**
  - `src/core/projectDetector.ts`
  - `src/core/config.ts`
  - `src/core/preferences.ts`
  - `src/core/paths.ts`
  - `src/types/config.ts`
  - `src/types/project.ts`
  - `src/utils/errors.ts`
  - `tests/unit/config.test.ts`
  - `tests/unit/preferences.test.ts`
  - `tests/unit/projectDetector.test.ts`
- **Expected tests:**
  - Project root found from root and nested directories.
  - Missing project root returns a clear failure.
  - `appModule` normalization works.
  - Config defaults are applied.
  - Invalid config fails with useful errors.
  - Preferences are created, read, updated, and scoped per project path.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Create a temporary fake Android project with `settings.gradle` and `gradlew`; verify detection through a small test or temporary command hook.
  - Verify invalid JSON/config produces an actionable message.
- **Acceptance criteria:**
  - Core project/config/preference behavior is tested and reusable.
  - No Gradle task execution is implemented yet.
  - No ADB behavior is implemented yet.
- **Out of scope:**
  - Variant discovery.
  - Doctor checks.
  - CLI command completion.
  - TUI.
- **Suggested commit subject:** `feat: add project config and preference core`
- **Suggested commit message body:**
  ```text
  Add reusable project root detection, repo config validation, and user
  preference storage.

  Config loading uses safe defaults and Zod validation. Preferences are stored
  outside the Android project and keyed by absolute project path.
  ```

### Phase 3 - Process Runner, Gradle Wrapper, And Variant Discovery

- **Priority:** Critical
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 1 and 2
- **Goal:** Discover Android variants through the project Gradle wrapper using a central process runner.
- **Scope:**
  - Process execution abstraction.
  - Gradle wrapper validation.
  - `./gradlew :<module>:tasks --all`.
  - Gradle task parsing.
  - Variant model and alias resolution.
- **Tasks:**
  1. Add `execa`.
  2. Implement `processRunner` for command execution, output capture, streaming hooks, exit codes, and errors.
  3. Implement Gradle wrapper detection and executable checks.
  4. Ensure Gradle commands always run from project root and call `./gradlew`.
  5. Implement `loadGradleTasks(projectRoot, appModule)`.
  6. Parse task names for `install<Variant>`, `assemble<Variant>`, `test<Variant>UnitTest`, and `connected<Variant>AndroidTest`.
  7. Convert PascalCase task variant parts to lower camel case variant names.
  8. Extract `buildType` and `flavorName` for `debug` and `release`.
  9. Preserve unknown build types as discovered but mark full support as not guaranteed.
  10. Implement alias resolution order: exact variant, alias, case-insensitive variant, helpful failure.
  11. Add command failure formatting with relevant output snippets.
- **Files likely added or modified:**
  - `src/core/processRunner.ts`
  - `src/core/gradle.ts`
  - `src/core/variantDiscovery.ts`
  - `src/core/variantResolver.ts`
  - `src/types/variant.ts`
  - `src/types/command.ts`
  - `src/utils/casing.ts`
  - `tests/unit/variantDiscovery.test.ts`
  - `tests/unit/variantResolver.test.ts`
  - `tests/unit/processRunner.test.ts`
- **Expected tests:**
  - Casing conversion for `StagingDebug`, `ProductionRelease`, `Debug`, and `Release`.
  - Gradle task parsing for install, assemble, unit test, and connected test tasks.
  - Build type and flavor extraction.
  - Alias resolution success and failure.
  - Missing Gradle wrapper failure.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - On a real Android project, run a temporary discovery command or debug script to confirm variants are discovered.
- **Acceptance criteria:**
  - Variants can be discovered from Gradle task output without manual config.
  - Alias resolution produces deterministic results and useful errors.
  - No system Gradle fallback exists.
- **Out of scope:**
  - CLI `variants` command output.
  - Device discovery.
  - App installation.
  - TUI.
- **Suggested commit subject:** `feat: discover android variants from gradle tasks`
- **Suggested commit message body:**
  ```text
  Add command execution, Gradle wrapper integration, and variant discovery.

  Variants are derived from Gradle tasks and normalized into a reusable model
  with task mappings, build type, flavor, and alias resolution.
  ```

### Phase 4 - Doctor Checks

- **Priority:** High
- **Recommended mode:** Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 1, 2, and 3
- **Goal:** Implement `droiddeck doctor` and a reusable doctor check model for CLI and TUI.
- **Scope:**
  - Doctor check model.
  - Environment and project checks.
  - CLI report rendering.
  - Exit code rules.
- **Tasks:**
  1. Define `DoctorCheck` with `id`, `label`, `status`, `message`, and optional `suggestion`.
  2. Implement checks for macOS and Node.js 20+.
  3. Implement project root, Gradle wrapper, settings file, app module, Gradle tasks, and variants checks.
  4. Add ADB availability and Android SDK environment checks as independent checks.
  5. Add connected devices check using a lightweight ADB path if ADB helpers already exist, or a narrowly scoped ADB availability call if Phase 5 is not yet complete.
  6. Add config validity and preferences readability/writability checks.
  7. Add selected variant application ID check when a variant is selected or inferable.
  8. Render CLI output with pass/warn/fail markers.
  9. Return exit code `1` only when one or more checks fail; warnings alone return `0`.
  10. Avoid expensive repeated Gradle calls where one call can feed multiple checks.
- **Files likely added or modified:**
  - `src/core/doctor.ts`
  - `src/types/doctor.ts`
  - `src/cli/commands/doctor.ts`
  - `src/cli/program.ts`
  - `tests/unit/doctor.test.ts`
- **Expected tests:**
  - Pass/warn/fail status mapping.
  - Exit code behavior.
  - Missing project root handling.
  - Invalid config check.
  - Doctor output includes suggestions.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck doctor` outside an Android project and confirm clear failures.
  - Run `droiddeck doctor` in an Android project and confirm Gradle wrapper/variant checks.
- **Acceptance criteria:**
  - `droiddeck doctor` works from CLI.
  - Doctor checks are reusable by the future TUI.
  - Warnings alone do not fail the process.
- **Out of scope:**
  - Full ADB device metadata.
  - TUI doctor panel.
  - App actions.
- **Suggested commit subject:** `feat: add doctor checks`
- **Suggested commit message body:**
  ```text
  Add a reusable doctor check pipeline and CLI report.

  The doctor command validates the environment, project structure, Gradle
  discovery, config, preferences, ADB availability, and selected application ID
  readiness with clear pass, warn, and fail statuses.
  ```

### Phase 5 - ADB Device Discovery And Selection

- **Priority:** High
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 1, 2, and preferably Phase 4
- **Goal:** Discover Android devices through ADB and persist selected device state.
- **Scope:**
  - ADB availability.
  - `adb devices -l` parsing.
  - Online/offline/unauthorized states.
  - Optional model/API/version metadata.
  - Device selection and persistence.
- **Tasks:**
  1. Implement `adb` wrapper functions through the central process runner.
  2. Implement `adb devices -l` execution.
  3. Parse device ID, state, model, raw line, and emulator/physical status.
  4. Separately represent online, offline, unauthorized, and unknown devices.
  5. Fetch `ro.product.model`, `ro.build.version.release`, and `ro.build.version.sdk` for online devices when practical.
  6. Implement device selection rules: persisted online device, exactly one online device, multiple-device error/prompt requirement, no-device empty state.
  7. Persist selected device ID per project path.
  8. Use an internal shape that can later support `selectedDeviceIds` without forcing multi-device MVP behavior.
  9. Update doctor device check to use this service if Phase 4 used a temporary path.
- **Files likely added or modified:**
  - `src/core/adb.ts`
  - `src/core/devices.ts`
  - `src/types/device.ts`
  - `src/core/preferences.ts`
  - `src/cli/commands/devices.ts`
  - `src/cli/commands/device.ts`
  - `tests/unit/devices.test.ts`
- **Expected tests:**
  - Parse online emulator line.
  - Parse online physical line.
  - Parse offline and unauthorized lines.
  - Select exactly one online device.
  - Fail clearly with multiple devices and no selected device.
  - Fail clearly when persisted device is disconnected.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck devices` with no devices.
  - Run `droiddeck devices` with an emulator.
  - Run `droiddeck device <deviceId>` and confirm preferences update.
- **Acceptance criteria:**
  - Device discovery and selection are reusable by CLI and TUI.
  - Offline and unauthorized devices are not treated as usable.
  - Multiple online devices require an explicit selected device.
- **Out of scope:**
  - App launch.
  - Screenshot capture.
  - Logcat streaming.
  - Multi-device execution.
- **Suggested commit subject:** `feat: add adb device discovery`
- **Suggested commit message body:**
  ```text
  Add ADB device discovery, device parsing, metadata collection, and selected
  device persistence.

  The MVP remains single-device focused while preserving a model that can grow
  into future multi-device workflows.
  ```

### Phase 6 - Application ID Resolution

- **Priority:** High
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 2, 3, and 5
- **Goal:** Resolve Android application IDs safely for launch, clear, kill, uninstall, and log filtering.
- **Scope:**
  - Config-based resolution.
  - Safe APK or Gradle-file inference where reliable.
  - Actionable failure when unknown.
  - No Android project source modifications.
- **Tasks:**
  1. Implement `applicationIds[variantName]` config lookup as the first and preferred source.
  2. Attach resolved application IDs to variant state where useful.
  3. Implement safe inference from already-built APK metadata only if the required tooling and path can be determined reliably.
  4. Implement conservative Gradle-file inference only for simple, unambiguous cases such as manifest namespace/application ID plus flavor/build suffixes when clearly parseable.
  5. If inference is ambiguous, fail instead of guessing.
  6. Add standard missing application ID error with a valid `droiddeck.config.json` snippet.
  7. Ensure `run` can still install without application ID, but launch/log/app actions fail clearly.
  8. Do not write config files or Android project files automatically.
- **Files likely added or modified:**
  - `src/core/appIdResolver.ts`
  - `src/types/variant.ts`
  - `src/core/config.ts`
  - `tests/unit/appIdResolver.test.ts`
- **Expected tests:**
  - Config lookup succeeds.
  - Variant-specific application ID wins.
  - Safe inference succeeds for supported simple fixtures.
  - Ambiguous inference fails with config snippet.
  - Missing application ID does not block install-only flow.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - In a real Android project, verify config-based app ID resolution.
  - Verify missing app ID message is actionable and project-generic.
- **Acceptance criteria:**
  - App-specific commands can require a resolved application ID.
  - Unknown app IDs never result in guessed package names.
  - No project-specific package names are hardcoded.
- **Out of scope:**
  - Gradle plugin model export.
  - Writing config automatically.
  - Release automation.
- **Suggested commit subject:** `feat: resolve android application ids`
- **Suggested commit message body:**
  ```text
  Add safe application ID resolution for variant-specific app actions.

  Resolution prefers explicit config and supports only conservative inference.
  Ambiguous cases fail with instructions for adding applicationIds to
  droiddeck.config.json.
  ```

### Phase 7 - Direct CLI Workflows

- **Priority:** Critical
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 2, 3, 5, and 6
- **Goal:** Implement direct CLI workflows before wiring the TUI.
- **Scope:**
  - `variants`, `devices`, `use`, `device`, `run`, `clear`, `launch`, `kill`, `uninstall`, `screenshot`, `test`, and initial `logs`.
  - Shared command context loading.
  - Clean, predictable terminal output.
  - Safety constraints for destructive actions.
- **Tasks:**
  1. Add a shared command context that loads project, config, preferences, variants, selected variant, and selected device.
  2. Implement `droiddeck variants` with variant name, build type, flavor, install task availability, unit test task availability, and aliases.
  3. Implement `droiddeck devices` with device ID, model, Android version, API level, emulator/physical, and state.
  4. Implement `droiddeck use <variantOrAlias>` to resolve and persist selected variant.
  5. Implement `droiddeck device <deviceId>` to validate and persist selected device.
  6. Implement `droiddeck run [variantOrAlias]` with `--clean`, `--fresh`, `--watch`, and `--device <id>`.
  7. Run clean sequentially before install when `--clean` is used.
  8. Use install task when available; use assemble fallback only when install task is missing, and do not manually install APK in MVP1.
  9. Launch after successful install when application ID is known.
  10. Implement `clear`, `launch`, `kill`, and `uninstall` with required device and application ID.
  11. Require `--yes` or interactive confirmation for CLI uninstall.
  12. Implement `screenshot` writing to `<project-root>/.droiddeck/screenshots/`.
  13. Implement `test` for selected variant unit test task and report path output.
  14. Implement initial `logs` command entrypoint, delegating full filtering to Phase 8 if not completed.
  15. Keep all command execution through the central process runner.
- **Files likely added or modified:**
  - `src/cli/context.ts`
  - `src/cli/program.ts`
  - `src/cli/commands/*`
  - `src/core/gradle.ts`
  - `src/core/screenshots.ts`
  - `src/core/testRunner.ts`
  - `tests/unit/cli*.test.ts`
  - `tests/unit/screenshots.test.ts`
  - `tests/unit/testRunner.test.ts`
- **Expected tests:**
  - Variant and device command formatting.
  - Selection persistence.
  - Gradle args for run, clean run, assemble fallback, and unit tests.
  - ADB args for clear, launch, kill, uninstall, and screenshot.
  - Uninstall confirmation behavior.
  - Missing device and missing application ID failures.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run CLI commands in a fake project where possible.
  - Run CLI commands in a real Android project with one emulator.
  - Verify `run --fresh` clears only after install and before launch.
  - Verify `run` without `--fresh` does not clear data.
  - Verify uninstall cannot proceed accidentally.
- **Acceptance criteria:**
  - Core direct CLI commands are useful without the TUI.
  - Destructive actions require explicit user intent.
  - CLI and future TUI can share the same core behavior.
- **Out of scope:**
  - Full Ink dashboard.
  - Polished live log panel.
  - Multi-device execution.
- **Suggested commit subject:** `feat: implement core cli workflows`
- **Suggested commit message body:**
  ```text
  Implement the direct DroidDeck CLI workflows for variant/device selection,
  build/install/run, app actions, screenshots, tests, and log entrypoints.

  The command layer uses shared core services and preserves explicit safety
  checks for clear data and uninstall operations.
  ```

### Phase 8 - Logcat Streaming And Filtering

- **Priority:** High
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 5, 6, and 7
- **Goal:** Stream and filter Logcat safely for CLI and TUI.
- **Scope:**
  - `adb logcat -v threadtime`.
  - Log line parsing.
  - Priority filters.
  - PID-based app filtering.
  - Configured tag fallback.
  - Crash highlighting.
  - Graceful stop behavior.
- **Tasks:**
  1. Define `LogLine` and `LogState` types.
  2. Start Logcat through the central process runner.
  3. Use `-v threadtime` so PID and priority can be parsed.
  4. Parse timestamp, PID, TID, priority, tag, message, and raw line.
  5. Implement `errors`, `warnings`, and `all` modes.
  6. If application ID is known, call `adb shell pidof <applicationId>` and filter matching PID.
  7. If PID is missing, show warning and fall back to priority and configured tags.
  8. Keep bounded in-memory logs, defaulting to 500 retained lines.
  9. Add crash highlighting markers for obvious crash patterns.
  10. Ensure Ctrl+C and process shutdown stop only DroidDeck's Logcat child process.
  11. Update `droiddeck logs` to stream until stopped.
  12. Provide APIs for the future TUI log panel.
- **Files likely added or modified:**
  - `src/core/logcat.ts`
  - `src/types/log.ts`
  - `src/cli/commands/logs.ts`
  - `src/core/processRunner.ts`
  - `tests/unit/logcat.test.ts`
- **Expected tests:**
  - Threadtime parsing.
  - Priority filtering.
  - PID filtering.
  - Tag fallback behavior.
  - Crash line detection.
  - Bounded line buffer.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck logs --errors`.
  - Run `droiddeck logs --warnings`.
  - Run `droiddeck logs --all`.
  - Stop logs with Ctrl+C and confirm no unrelated processes are killed.
- **Acceptance criteria:**
  - CLI logs stream filtered output.
  - Missing app process is handled as a warning.
  - Global device Logcat buffer is not cleared.
- **Out of scope:**
  - AI log analysis.
  - Uploading logs.
  - Profiler metrics.
- **Suggested commit subject:** `feat: add logcat streaming and filtering`
- **Suggested commit message body:**
  ```text
  Add Logcat streaming, parsing, priority filtering, app PID filtering, and
  crash-line highlighting.

  Logcat remains local-only and does not clear the device's global log buffer.
  ```

### Phase 9 - Tests And Reports Workflow

- **Priority:** Medium
- **Recommended mode:** Normal mode
- **Reasoning level:** Medium
- **Dependencies:** Phases 3 and 7
- **Goal:** Run selected variant unit tests and expose report paths.
- **Scope:**
  - Selected variant unit test task.
  - Test pass/fail status.
  - HTML report path detection.
  - `--open-report`.
  - TUI state hooks for latest report path.
- **Tasks:**
  1. Implement unit test runner for `test<Variant>UnitTest`.
  2. Use selected/persisted variant if no variant argument is passed.
  3. Print `TESTS PASSED` or `TESTS FAILED`.
  4. Locate likely report path under `<project-root>/<appModule>/build/reports/tests/test<Variant>UnitTest/index.html`.
  5. Add `open` dependency or macOS `open` wrapper for report opening.
  6. Implement `droiddeck test --open-report`.
  7. Preserve nonzero exit code when tests fail.
  8. Store latest report path in command/TUI state where appropriate.
  9. Keep connected Android tests behind an explicit option for Phase 13.
- **Files likely added or modified:**
  - `src/core/testRunner.ts`
  - `src/cli/commands/test.ts`
  - `src/types/command.ts`
  - `tests/unit/testRunner.test.ts`
- **Expected tests:**
  - Unit test task mapping.
  - Report path generation.
  - Pass/fail output behavior.
  - Missing test task failure.
  - `--open-report` behavior when report exists or is missing.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck test <variant>` in a real Android project.
  - Run `droiddeck test <variant> --open-report`.
- **Acceptance criteria:**
  - Unit tests run for selected variants.
  - Report paths are clear.
  - Failed tests are visible and return failure.
- **Out of scope:**
  - Deep failed-test parsing.
  - Connected Android tests unless Phase 13 is being implemented.
- **Suggested commit subject:** `feat: add android test runner workflow`
- **Suggested commit message body:**
  ```text
  Add selected-variant unit test execution and report path handling.

  The test workflow reports clear pass/fail status and can open the generated
  HTML report when available.
  ```

### Phase 10 - Full Ink TUI Dashboard

- **Priority:** Critical
- **Recommended mode:** Plan mode, then Goal mode
- **Reasoning level:** High
- **Dependencies:** Phases 2 through 9
- **Goal:** Implement the full MVP Ink dashboard and hotkey workflow.
- **Scope:**
  - Default `droiddeck` command renders the dashboard.
  - Header with project, module, doctor summary, selected variant, selected device, and app status when known.
  - Variant and device panels.
  - Build/run panel.
  - Log panel.
  - Actions panel.
  - Doctor/help panels.
  - Variant and device pickers.
  - All required hotkeys.
- **Tasks:**
  1. Add Ink, React, and supporting TUI dependencies from `docs/PLAN.md`.
  2. Create `src/tui/App.tsx`.
  3. Create component structure for header, variants, devices, build, logs, actions, doctor, help, and picker panels.
  4. Implement initial app state using shared core services.
  5. Load project, config, preferences, doctor checks, variants, devices, and selected state on startup.
  6. Show an error screen with quit option when no project root is found.
  7. Implement variant picker with `v`.
  8. Implement device picker with `d`.
  9. Implement run with `r`, clean run with `R`, clear with `c`, launch with `l`, kill with `k`, uninstall with `u`, tests with `t`, screenshot with `s`, logs focus with `g`, doctor with `D`, help with `?`, open report with `o`, clear visible log panel with `C`, and quit with `q`.
  10. Require confirmation before TUI uninstall.
  11. Show command status, elapsed time, last output lines, and error output.
  12. Show filtered logs using Phase 8 log service.
  13. Insert UI session separators on run/launch without clearing global Logcat.
  14. Persist selected variant and selected device.
  15. Stop DroidDeck child processes on quit.
  16. Keep layout usable on typical terminal sizes without over-optimizing visual polish.
- **Files likely added or modified:**
  - `src/cli/commands/dashboard.tsx`
  - `src/cli/program.ts`
  - `src/tui/App.tsx`
  - `src/tui/components/*`
  - `src/tui/hooks/*`
  - `src/types/command.ts`
  - `src/types/log.ts`
  - `tests/unit/tui*.test.ts`
- **Expected tests:**
  - Pure state reducers/helpers where applicable.
  - Keyboard action mapping.
  - Component rendering smoke tests where practical.
  - Uninstall confirmation state behavior.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck` from an Android project root.
  - Run `droiddeck` from a subdirectory.
  - Use variant and device pickers.
  - Press every required hotkey.
  - Quit while Gradle is running and while Logcat is running.
- **Acceptance criteria:**
  - `droiddeck` opens the TUI dashboard by default.
  - Required panels and hotkeys exist.
  - TUI calls shared core services instead of duplicating command logic.
  - Destructive actions remain explicitly confirmed.
- **Out of scope:**
  - Desktop GUI.
  - Android Studio integration.
  - Advanced profiler dashboards.
- **Suggested commit subject:** `feat: add ink dashboard`
- **Suggested commit message body:**
  ```text
  Add the full Ink dashboard for DroidDeck MVP1.

  The dashboard loads project state, variants, devices, doctor checks, build
  state, logs, and actions, and wires required keyboard shortcuts to shared
  core workflows with safety confirmations.
  ```

### Phase 11 - Process Lifecycle, Cancellation, And Safety Polish

- **Priority:** High
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** High
- **Dependencies:** Phases 3, 7, 8, and 10
- **Goal:** Harden child process lifecycle, cancellation, output buffering, and safety behavior.
- **Scope:**
  - Child process tracking.
  - Signal handling.
  - TUI quit cleanup.
  - Bounded output buffers.
  - Command state consistency.
  - Safety audit for destructive operations.
- **Tasks:**
  1. Track child processes started by DroidDeck in the process runner.
  2. Add cleanup hooks for TUI quit and process signals.
  3. Ensure cleanup terminates only tracked DroidDeck children.
  4. Avoid killing unrelated Gradle daemons, ADB server, or user-started Logcat.
  5. Bound Gradle/ADB output retained in memory.
  6. Preserve enough failed command output for debugging.
  7. Normalize command state transitions: idle, running, success, failed.
  8. Ensure `run --watch` and TUI logs can stop cleanly.
  9. Re-audit `clear`, `uninstall`, `kill`, and `clean` behavior against safety constraints.
  10. Add tests around process runner cancellation hooks where feasible.
- **Files likely added or modified:**
  - `src/core/processRunner.ts`
  - `src/types/command.ts`
  - `src/tui/App.tsx`
  - `src/cli/commands/*`
  - `tests/unit/processRunner.test.ts`
- **Expected tests:**
  - Output line truncation.
  - Command state helpers.
  - Cancellation invokes expected child process termination path.
  - Safety guards remain enforced.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Quit TUI while Gradle command is running.
  - Quit TUI while Logcat is running.
  - Confirm unrelated `adb` and Gradle daemon processes are not killed.
- **Acceptance criteria:**
  - All DroidDeck-started child processes are cleaned up on quit.
  - No unrelated process is intentionally killed.
  - TUI and CLI failures leave useful diagnostics.
- **Out of scope:**
  - Replacing Gradle daemon behavior.
  - Killing external user processes.
  - Release automation.
- **Suggested commit subject:** `fix: harden process lifecycle handling`
- **Suggested commit message body:**
  ```text
  Harden DroidDeck child process tracking, cancellation, and output handling.

  Cleanup is limited to processes started by DroidDeck, and command state is
  kept consistent across CLI and TUI workflows.
  ```

### Phase 12 - Documentation And MVP Usability

- **Priority:** Medium
- **Recommended mode:** Normal mode
- **Reasoning level:** Medium
- **Dependencies:** Phases 1 through 11
- **Goal:** Make the MVP usable and understandable for another Android developer.
- **Scope:**
  - README install and usage.
  - Config documentation.
  - Command examples.
  - Requirements.
  - MVP limitations.
  - Screenshot path note.
  - Safety notes.
- **Tasks:**
  1. Update README to describe DroidDeck as a terminal dashboard for native Android development.
  2. Document requirements: macOS, Node.js 20+, Android SDK/ADB, Android project with Gradle wrapper.
  3. Document install, build, dev, test, typecheck, and start commands.
  4. Document direct CLI commands.
  5. Document default TUI behavior.
  6. Add `droiddeck.config.json` schema overview and generic example.
  7. Document application ID configuration and missing app ID error path.
  8. Document preferences file location.
  9. Document screenshot output under `.droiddeck/screenshots/` and recommend ignoring `.droiddeck/` in Android projects.
  10. Document MVP limitations and explicit non-goals.
  11. Ensure examples do not hardcode project-specific values.
  12. Verify README command examples match CLI help.
- **Files likely added or modified:**
  - `README.md`
  - `.gitignore`
  - Possibly `docs/PLAN.md` only if user explicitly requests updates; otherwise do not modify it.
- **Expected tests:**
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`
  - Optional docs example check by comparing `droiddeck --help`.
- **Manual verification:**
  - Read README as a new user.
  - Run every documented command with `--help` or safe no-op context where possible.
  - Confirm no WDW-specific values are present.
- **Acceptance criteria:**
  - README explains install, config, usage, requirements, and limitations.
  - Docs match implemented CLI behavior.
  - Screenshot path tracking risk is documented.
- **Out of scope:**
  - Open-source polish beyond basic README.
  - Website docs.
  - Release docs.
- **Suggested commit subject:** `docs: document droiddeck mvp usage`
- **Suggested commit message body:**
  ```text
  Document DroidDeck MVP usage, setup, configuration, requirements, safety
  boundaries, and limitations.

  The README keeps examples generic and points developers to docs/PLAN.md for
  product behavior.
  ```

### Phase 13 - Optional MVP Completion Items

- **Priority:** Medium
- **Recommended mode:** Plan mode, then Normal mode
- **Reasoning level:** Medium
- **Dependencies:** Phases 7, 8, 9, and 10
- **Goal:** Complete optional MVP items from `docs/PLAN.md` that remain inside MVP boundaries.
- **Scope:**
  - Connected Android test option.
  - All-unit-tests mode if straightforward.
  - Optional hotkeys `?`, `o`, and `C`.
  - Safe application ID inference refinements.
  - Any other optional MVP item explicitly present in `docs/PLAN.md`.
- **Tasks:**
  1. Implement `droiddeck test --connected` when a `connected<Variant>AndroidTest` task exists.
  2. Implement `droiddeck test --all` only if Gradle task discovery can support it without guessing.
  3. Ensure `?` opens help in TUI.
  4. Ensure `o` opens latest test report when available.
  5. Ensure `C` clears only DroidDeck's visible log panel, not the device Logcat buffer.
  6. Refine safe application ID inference with additional tested simple cases.
  7. Keep MVP1.5-only ADB actions out unless the user explicitly promotes them.
  8. Update README only for optional items that are implemented.
- **Files likely added or modified:**
  - `src/core/testRunner.ts`
  - `src/core/appIdResolver.ts`
  - `src/tui/*`
  - `src/cli/commands/test.ts`
  - `tests/unit/*`
  - `README.md`
- **Expected tests:**
  - Connected test task selection.
  - All-unit-tests option behavior or clear unsupported message.
  - Optional hotkey behavior.
  - Visible log panel clear behavior.
  - Additional app ID inference fixtures.
- **Manual verification:**
  - Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
  - Run `droiddeck test --connected` on a project with connected test task.
  - Verify `?`, `o`, and `C` in the TUI.
- **Acceptance criteria:**
  - Optional MVP items work or are explicitly documented as not supported.
  - No MVP1.5-only feature is implemented accidentally.
- **Out of scope:**
  - Open app settings.
  - Grant notification permission.
  - Toggle dark mode.
  - Change system language.
  - Deep links unless explicitly requested later.
- **Suggested commit subject:** `feat: complete optional mvp workflows`
- **Suggested commit message body:**
  ```text
  Complete optional MVP workflows that are explicitly listed in docs/PLAN.md.

  This includes supported test options, optional dashboard hotkeys, visible log
  clearing, and safe application ID inference refinements while keeping MVP1.5
  device actions out of scope.
  ```

### Phase 14 - Final MVP Acceptance And Audit

- **Priority:** Critical
- **Recommended mode:** Goal mode
- **Reasoning level:** High
- **Dependencies:** Phases 1 through 13
- **Goal:** Verify DroidDeck MVP1 against `docs/PLAN.md` acceptance criteria and safety boundaries.
- **Scope:**
  - Automated checks.
  - CLI smoke tests.
  - TUI smoke tests.
  - Manual Android project scenarios.
  - Safety audit.
  - Non-goal audit.
  - Documentation audit.
- **Tasks:**
  1. Run `pnpm test`.
  2. Run `pnpm typecheck`.
  3. Run `pnpm build`.
  4. Run CLI help and command smoke tests.
  5. Verify `droiddeck` opens TUI by default.
  6. Verify project root detection from root and subdirectory.
  7. Verify config loading, invalid config behavior, and preferences persistence.
  8. Verify variants are discovered in a real Android project.
  9. Verify device discovery with no devices, one device, and multiple devices where possible.
  10. Verify run, clean run, fresh run, launch, clear, kill, uninstall confirmation, screenshot, tests, report open, and logs.
  11. Verify quitting while Gradle and Logcat children are running.
  12. Check that no external network calls, analytics, AI, Firebase, release automation, Android Studio plugin, or GUI behavior exists.
  13. Check that no WDW-specific values or assumptions exist in source, tests, or docs except as quoted examples from the plan if unavoidable.
  14. Produce an MVP audit checklist mapping implementation to `docs/PLAN.md` acceptance criteria.
  15. Document any deferred item with reason and risk.
- **Files likely added or modified:**
  - `docs/MVP_AUDIT.md` or equivalent if requested.
  - `README.md` if audit finds doc gaps.
  - Tests for any bug found during audit.
- **Expected tests:**
  - Full test suite.
  - Typecheck.
  - Build.
  - CLI smoke tests.
  - Manual scenario checklist.
- **Manual verification:**
  - Use a real multi-flavor Android project.
  - Use at least one emulator or physical device.
  - Exercise the full daily workflow: select variant, select device, run, logs, tests, screenshot, app actions, doctor.
- **Acceptance criteria:**
  - All `docs/PLAN.md` MVP acceptance criteria are passed or explicitly documented as deferred with user-approved reason.
  - Safety constraints are verified.
  - The MVP can be used daily on a real Android project without memorizing Gradle and ADB commands.
- **Out of scope:**
  - New features beyond closing acceptance gaps.
  - Visual redesign beyond usability fixes.
  - Release automation.
- **Suggested commit subject:** `test: audit droiddeck mvp acceptance`
- **Suggested commit message body:**
  ```text
  Audit DroidDeck MVP1 against the product plan and acceptance criteria.

  Run automated checks, CLI and TUI smoke tests, real Android workflow
  verification, safety checks, and non-goal checks. Document any approved
  deferrals with remaining risk.
  ```

## Cross-Phase Dependencies

- Phase 1 enables all later phases.
- Phase 2 is required before any project-aware command.
- Phase 3 depends on Phase 2 and enables variants, run, tests, and doctor checks.
- Phase 4 can be implemented before full ADB device metadata, but should be revisited after Phase 5.
- Phase 5 enables device-aware commands, logs, screenshots, and app actions.
- Phase 6 enables launch, clear, kill, uninstall, and app-filtered logs.
- Phase 7 depends on Phases 2, 3, 5, and 6 for real direct CLI behavior.
- Phase 8 depends on device and app ID services, and completes `logs`.
- Phase 9 depends on variant discovery and command execution.
- Phase 10 should use the core services from Phases 2 through 9 instead of duplicating CLI logic.
- Phase 11 hardens process behavior after real CLI/TUI workflows exist.
- Phase 12 should happen after major behavior is stable, though README can be updated earlier when needed.
- Phase 13 completes optional MVP items after the main workflows are working.
- Phase 14 is the final audit and should not start until all implementation phases are complete or explicitly deferred.

## Final MVP Acceptance Checklist

- `droiddeck` opens a TUI dashboard by default.
- `droiddeck doctor` works from CLI.
- Doctor panel exists inside TUI.
- Project root detection works from current directory and parent directories.
- Project Gradle wrapper is required and used.
- Optional `droiddeck.config.json` loads and validates.
- User preferences are stored per project path under `~/.droiddeck/preferences.json`.
- Variants are discovered from Gradle tasks.
- Debug and release variants are supported.
- Variant aliases work.
- Connected ADB devices are listed.
- Selected variant and device persist.
- TUI can select variant and device.
- `run` installs selected variant.
- `run` launches after install when application ID is known.
- `run --fresh` clears app data only after install and before launch.
- `run --clean` runs Gradle clean before install.
- TUI shows command status and recent output.
- TUI shows filtered logs.
- CLI `logs` streams filtered logs.
- TUI and CLI can clear app data, kill app, launch app, uninstall with confirmation, and capture screenshots.
- TUI and CLI can run selected variant unit tests.
- Test report can be opened when available.
- Child Gradle, ADB, and Logcat processes started by DroidDeck are stopped on quit.
- No AI, analytics, external network calls, Firebase integration, release automation, Android Studio plugin, or external data upload exists.
- README explains install, config, usage, requirements, and limitations.

## Future Prompt Template - Implement One Phase

```text
You are in Normal implementation mode.

Read docs/PLAN.md and docs/TASKS.md.
Implement Phase <N> only: <phase title>.

Keep scope limited to that phase.
Do not implement later phases.
Preserve DroidDeck as a general Android tool.
Do not hardcode project-specific names, package names, variants, flavors, or paths.
Do not add AI, analytics, Firebase, release automation, Android Studio plugin, GUI, or external network calls.
Preserve all safety constraints from docs/TASKS.md.

After implementation run:
pnpm test
pnpm typecheck
pnpm build

Report changed files, commands run, and any remaining gaps.
```

## Future Prompt Template - Stabilize After One Phase

```text
You are in Goal mode.

Read docs/PLAN.md and docs/TASKS.md.
Stabilize the just-implemented Phase <N>: <phase title>.

Focus on bugs, edge cases, tests, type safety, safety constraints, and acceptance criteria.
Do not add new product scope.
Do not implement later phases.
Preserve DroidDeck as a general Android tool.

Run relevant automated checks and report residual risk.
```
