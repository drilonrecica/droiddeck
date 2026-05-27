# DroidDeck

DroidDeck is a terminal dashboard and CLI command center for native Android development.

The implementation source of truth is [docs/PLAN.md](docs/PLAN.md).

## Current Status

DroidDeck is currently at the initial Node.js + TypeScript project skeleton stage. CLI commands are registered with clear placeholders; Android, Gradle, ADB, Logcat, and TUI behavior are intentionally not implemented yet.

## Install And Dev

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm typecheck
```

## Usage

```bash
droiddeck
droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck use stagingDebug
droiddeck device emulator-5554
droiddeck run stagingDebug
droiddeck logs stagingDebug
droiddeck test stagingDebug
droiddeck clear stagingDebug
droiddeck launch stagingDebug
droiddeck kill stagingDebug
droiddeck uninstall stagingDebug
droiddeck screenshot stagingDebug
```

The default command currently prints:

```text
DroidDeck TUI dashboard is not implemented yet.
```

Command stubs currently print `Not implemented yet: <command>`.

## MVP Boundaries

DroidDeck must remain a general Android tool. Do not hardcode project-specific names, package names, flavors, or paths. MVP1 excludes AI, analytics, release automation, Firebase integration, Android Studio plugins, and external network calls.
