# DroidDeck MVP1 Audit

Date: 2026-05-27

## Scope

This is a repo-local MVP audit against `docs/PLAN.md` and `docs/TASKS.md`.

The audit environment is not a macOS Android project checkout, and no real Android project path or target device was provided. Real Gradle/ADB workflow checks that require an Android project or connected device are documented as not executed here.

## Automated Checks

Passed:

```bash
npx -y pnpm@9.15.0 test
npx -y pnpm@9.15.0 typecheck
npx -y pnpm@9.15.0 build
```

Result:

- 18 Vitest files passed.
- 74 unit tests passed.
- TypeScript strict build passed.
- Production build passed.

## Safe Smoke Checks

Passed:

```bash
node dist/index.js --help
node dist/index.js test --all --connected
node dist/index.js
```

Observed behavior:

- CLI help lists the MVP commands.
- `test --all --connected` fails clearly because the combined mode is unsupported in MVP1.
- Non-interactive `droiddeck` exits clearly with `DroidDeck TUI requires an interactive terminal.`
- Interactive TTY `droiddeck` shows the no-project TUI error screen and exits with `q`.

Expected local failures:

```bash
node dist/index.js doctor
node dist/index.js variants
```

Observed behavior:

- `doctor` reports Linux/macOS and missing Android project failures clearly.
- `variants` reports that no Android project root was found.

## Acceptance Checklist

Repo-local pass:

- `droiddeck` renders the TUI in an interactive terminal.
- No-project TUI error screen exists and allows quit.
- CLI `doctor` exists and reports pass/warn/fail checks.
- Project root detection, config validation, preferences, Gradle task parsing, variant aliases, ADB device parsing, application ID resolution, log parsing, screenshot paths, process handling, and test runner behavior are covered by unit tests.
- CLI commands for variants, devices, selection, run, logs, tests, app actions, uninstall, and screenshot are wired.
- TUI panels and required hotkeys are implemented.
- TUI uninstall uses confirmation.
- CLI uninstall requires confirmation or `--yes`.
- `run --fresh` is explicit and ordered after install.
- Logcat is streamed without clearing the global device buffer.
- Visible TUI logs can be cleared independently.
- Child process tracking is limited to DroidDeck-started children.
- README documents install, config, usage, requirements, safety, screenshots, and limitations.

Not executed in this environment:

- macOS runtime verification.
- Real Android project root/subdirectory detection.
- Real Gradle wrapper task discovery.
- Real install, clean run, fresh run, assemble fallback, and launch.
- Real ADB no-device/one-device/multiple-device workflows.
- Real Logcat streaming from an Android device.
- Real unit test and connected test Gradle execution.
- Real screenshot capture.
- Quitting TUI while a real Gradle or Logcat child is active.

## Safety And Non-Goal Audit

Checked with source search across `src`, `tests`, `README.md`, and package metadata:

- No project-specific source/test defaults were found.
- No Firebase integration was added.
- No analytics or telemetry behavior was added.
- No AI behavior was added.
- No runtime HTTP/fetch/axios network behavior was added.
- No Android Studio plugin or desktop GUI behavior was added.
- No release automation or upload flow was added.

Notes:

- README mentions excluded non-goals by name; this is documentation, not implementation.
- The `open` dependency is used only for local HTML report opening.

## Deferred Verification

Before using DroidDeck as a daily Android workflow tool, run this audit again in a real macOS Android project with at least one emulator or physical device:

```bash
droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck use <variant>
droiddeck device <deviceId>
droiddeck run <variant>
droiddeck run <variant> --clean
droiddeck run <variant> --fresh
droiddeck logs <variant> --warnings
droiddeck test <variant> --open-report
droiddeck test <variant> --connected --device <deviceId>
droiddeck screenshot <variant> --device <deviceId>
```

Also verify TUI hotkeys in that project: `v`, `d`, `r`, `R`, `c`, `l`, `k`, `u`, `t`, `s`, `g`, `D`, `?`, `o`, `C`, and `q`.
