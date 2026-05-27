# DroidDeck

DroidDeck is a macOS-first terminal dashboard and CLI command center for native Android development.

It wraps common Android workflows around the project Gradle wrapper and ADB: discover variants, select a device, install and launch, stream filtered Logcat, run tests, capture screenshots, and run doctor checks.

`docs/PLAN.md` is the product and implementation source of truth. `docs/TASKS.md` is the phased implementation roadmap.

## MVP Status

DroidDeck currently implements the MVP CLI workflows and an Ink-based TUI dashboard. It remains a local developer tool: no analytics, telemetry, AI, Firebase integration, release automation, external data upload, Android Studio plugin, or external network behavior is included.

## Requirements

- macOS for MVP1 usage.
- Node.js 20 or newer.
- `pnpm`.
- Android SDK platform-tools with `adb` on `PATH`.
- A native Android project with a project-local `./gradlew`.
- `settings.gradle` or `settings.gradle.kts` in the Android project root.

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm typecheck
```

The built executable is `dist/index.js`, and the package bin is `droiddeck`.

## TUI

Run from an Android project root or subdirectory:

```bash
droiddeck
```

Core hotkeys:

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

Safety rules:

- `run --fresh` clears app data only after a successful install and before launch.
- `clear` is explicit and app-specific.
- `uninstall` requires `--yes` or interactive confirmation.
- `test --connected` requires an online selected or requested device.
- `test --all --connected` is not supported in MVP1.
- Logcat is never globally cleared; `C` clears only DroidDeck's visible log panel.
- DroidDeck uses `./gradlew` and does not fall back to system Gradle.

## Configuration

Optional repo config lives at:

```text
<project-root>/droiddeck.config.json
```

Generic example:

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

If an application ID cannot be resolved, add:

```json
{
  "applicationIds": {
    "<variantName>": "your.package.name"
  }
}
```

## Files Written By DroidDeck

User preferences are stored outside the Android project:

```text
~/.droiddeck/preferences.json
```

Screenshots are stored in the Android project:

```text
<project-root>/.droiddeck/screenshots/
```

Android projects should ignore project-local DroidDeck output:

```gitignore
.droiddeck/
```

## MVP Limitations

- macOS-first for MVP1.
- Single app module by default.
- Single selected device workflow.
- Variant discovery is based on Gradle task output.
- Application ID inference is conservative; ambiguous cases require config.
- No Android project source files are modified automatically.
