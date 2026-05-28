# DroidDeck

DroidDeck is a terminal dashboard and CLI command center for native Android projects.

It gives Android developers a fast local workflow for variant-heavy apps: discover Gradle variants, select a device, install and launch, stream filtered Logcat, run tests, capture screenshots, and run project health checks.

DroidDeck is intentionally local-only. It does not include telemetry, analytics, AI features, Firebase integration, release automation, external data upload, or Android Studio plugin behavior.

## Status

DroidDeck is currently an MVP. The CLI workflows and Ink-based TUI dashboard are implemented, but public testing is still early.

Recommended before broad use:

- Test it on a complete Android project with flavors.
- Test it with at least one emulator or physical device.
- Keep project-specific package IDs in `droiddeck.config.json` when inference is ambiguous.

## Requirements

- Node.js 20 or newer.
- Android SDK platform-tools with `adb` on `PATH`.
- A native Android project with a project-local `./gradlew`.
- A complete Gradle wrapper, including `gradle/wrapper/gradle-wrapper.jar`.
- `settings.gradle` or `settings.gradle.kts` in the Android project root.

MVP1 is macOS-first. Other platforms may work for some commands, but they are not the supported target yet.

## Install From A Local Package

Build a local npm tarball:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm pack
```

This creates:

```text
droiddeck-0.1.0.tgz
```

Install it globally on another machine:

```bash
npm install -g ./droiddeck-0.1.0.tgz
```

Then run from an Android project:

```bash
cd /path/to/android/project
droiddeck doctor
droiddeck
```

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Useful packaging check:

```bash
npm pack --dry-run
```

## TUI

Run from an Android project root or subdirectory:

```bash
droiddeck
```

Hotkeys:

```text
r run selected variant
R clean run selected variant
v select variant
d select device
c clear app data
l launch app
k kill app
u uninstall app, with confirmation
t run selected variant unit tests
s capture screenshot
g focus/start logs
D open doctor panel
? open help
o open latest test report
C clear visible DroidDeck log panel only
q quit
```

## CLI Commands

```bash
droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck use <variantOrAlias>
droiddeck device <deviceId>
droiddeck run [variantOrAlias] --clean --fresh --watch --device <deviceId>
droiddeck logs [variantOrAlias] --errors --warnings --all --device <deviceId>
droiddeck test [variantOrAlias] --all --connected --open-report --device <deviceId>
droiddeck clear [variantOrAlias] --device <deviceId>
droiddeck launch [variantOrAlias] --device <deviceId>
droiddeck kill [variantOrAlias] --device <deviceId>
droiddeck uninstall [variantOrAlias] --device <deviceId> --yes
droiddeck screenshot [variantOrAlias] --device <deviceId>
```

## Configuration

Optional repo config lives at:

```text
<project-root>/droiddeck.config.json
```

Example:

```json
{
  "projectName": "Example Android",
  "appModule": "app",
  "variantAliases": {
    "dev": "developmentDebug",
    "prod": "productionRelease"
  },
  "applicationIds": {
    "developmentDebug": "com.example.app.dev",
    "productionRelease": "com.example.app"
  },
  "mainActivity": ".MainActivity",
  "logcat": {
    "defaultMode": "warnings",
    "tags": ["Network", "Database"]
  },
  "actions": {
    "launchMode": "monkey"
  }
}
```

Important fields:

- `appModule` defaults to `app`; `app` and `:app` are both accepted.
- `variantAliases` lets commands like `droiddeck run dev` resolve to a variant.
- `applicationIds` is the safest way to support launch, clear, kill, uninstall, and app-filtered logs.
- `actions.launchMode` can be `monkey` or `activity`; `activity` requires `mainActivity`.
- `logcat.defaultMode` can be `errors`, `warnings`, or `all`.

If DroidDeck cannot determine an application ID, add:

```json
{
  "applicationIds": {
    "<variantName>": "your.package.name"
  }
}
```

## Safety

- DroidDeck uses the project `./gradlew`; it does not silently fall back to system Gradle.
- `run --fresh` clears app data only after a successful install and before launch.
- `clear` is explicit and app-specific.
- `uninstall` requires `--yes` or interactive confirmation.
- `test --connected` requires an online selected or requested device.
- `test --all --connected` is not supported in MVP1.
- Logcat is never globally cleared; `C` clears only DroidDeck's visible log panel.
- DroidDeck does not modify Android project source files automatically.

## Files Written By DroidDeck

User preferences:

```text
~/.droiddeck/preferences.json
```

Project-local screenshots:

```text
<project-root>/.droiddeck/screenshots/
```

Android projects should ignore local DroidDeck output:

```gitignore
.droiddeck/
```

## Limitations

- MVP1 is macOS-first.
- Single app module by default.
- Single selected device workflow.
- Variant discovery is based on Gradle task output.
- Application ID inference is conservative; ambiguous cases require config.
- No release automation, upload flow, profiler dashboard, Android Studio plugin, or desktop GUI.

## License

MIT. See [LICENSE](LICENSE).
