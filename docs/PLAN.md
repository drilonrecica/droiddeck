# DroidDeck MVP1 — Implementation Plan / Specification

## 0. Project Summary

**DroidDeck** is a terminal dashboard and CLI command center for native Android development.

It is inspired by the concept of a Flutter `flutter run` terminal dashboard, but adapted deeply for native Android workflows: Gradle variants, product flavors, build types, ADB device management, Logcat, app lifecycle actions, screenshots, tests, and local project health checks.

The first version is private/internal-first, macOS-first, and designed to be useful immediately for a real Android project with multiple product flavors. It must still be built as a general Android tool, not hardcoded for a single project.

The MVP should help Android developers:

1. Open a TUI dashboard from the project root.
2. Automatically discover Android variants.
3. Select a variant/flavor/build type.
4. Select a connected device.
5. Build/install/launch the selected variant.
6. View useful filtered logs.
7. Run tests for the selected variant.
8. Perform common ADB actions quickly.
9. Persist selected variant/device per project.
10. Run doctor checks from CLI and inside the TUI.

---

## 1. Product Vision

### 1.1 One-sentence vision

DroidDeck is a Flutter CLI-inspired terminal dashboard for native Android developers that turns flavor/variant-heavy Android development into a fast keyboard-driven workflow.

### 1.2 Core promise

```text
Select variant → select device → run/install/launch → view logs → run tests → perform common ADB actions.
```

### 1.3 MVP positioning

DroidDeck is **not** an Android Studio replacement.

It is a terminal command center that wraps common Gradle and ADB workflows into a faster, more focused developer experience.

### 1.4 Target user for MVP1

- Native Android developers.
- macOS users first.
- Kotlin or Java Android projects.
- Single `app` module first.
- Product flavors supported.
- Debug and release build types supported.
- Senior developers who are comfortable with terminals.
- Private/internal usage first; possible open-source later.

---

## 2. Non-goals for MVP1

Do **not** implement the following in MVP1:

- Android Studio plugin.
- Desktop GUI.
- AI crash/log analysis.
- Firebase Crashlytics API integration.
- Firebase Analytics integration.
- Google Play upload.
- Firebase App Distribution upload.
- Release checklist automation.
- CI/CD integration.
- Remote/cloud device farm.
- Full profiler replacement.
- FPS/jank dashboard.
- Memory/CPU performance dashboard.
- Deep APK/AAB analysis.
- Full multi-device execution as a required feature.
- Windows/Linux support.
- Complex generic Gradle plugin.
- Open-source documentation polish beyond basic README.
- Automatic source-code modifications.
- Any destructive action without explicit user command.

---

## 3. Platform and Technical Stack

### 3.1 Required platform

MVP1 must support:

```text
macOS only
```

The codebase should avoid unnecessary macOS-only assumptions where possible, but there is no requirement to test or support Windows/Linux in MVP1.

### 3.2 Runtime

Use:

```text
Node.js + TypeScript
```

Recommended Node version:

```text
Node.js 20+
```

### 3.3 Package manager

Use one of:

```text
pnpm preferred
npm acceptable
```

Use `pnpm` in documentation and scripts unless implementation constraints require npm.

### 3.4 Recommended libraries

Use the following stack:

```text
commander          CLI command parsing
execa              running Gradle/ADB processes
ink                React-based terminal UI
ink-select-input   selectable lists
ink-text-input     search/filter input if needed
zod                config validation
chalk              CLI colors outside Ink
fs-extra           file utilities
strip-ansi         parsing command output if needed
open               opening reports/files on macOS
```

Optional but useful:

```text
ink-spinner        loading indicators
ink-table          simple tables
figures            terminal symbols
```

### 3.5 Package name and executable

Package name:

```text
droiddeck
```

Primary command:

```bash
droiddeck
```

Do **not** use `dd` as the official executable because it conflicts with the Unix `dd` command.

Users may create their own shell alias:

```bash
alias dd="droiddeck"
```

---

## 4. High-Level UX

### 4.1 Default behavior

Running:

```bash
droiddeck
```

from an Android project root opens the TUI dashboard.

The dashboard is the main product experience.

### 4.2 Direct CLI commands

Direct commands must also exist for fast scripting/power-user workflows:

```bash
droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck use <variantOrAlias>
droiddeck device <deviceId>
droiddeck run [variantOrAlias]
droiddeck logs [variantOrAlias]
droiddeck test [variantOrAlias]
droiddeck clear [variantOrAlias]
droiddeck launch [variantOrAlias]
droiddeck kill [variantOrAlias]
droiddeck uninstall [variantOrAlias]
droiddeck screenshot [variantOrAlias]
```

### 4.3 Core TUI mental model

The TUI should behave like a dashboard/cockpit.

It should show:

- Project name.
- App module.
- Doctor health status.
- Selected variant.
- Selected device.
- App/package status if known.
- Latest build/install/launch action.
- Logs panel.
- Actions/hotkeys.

### 4.4 Keyboard-first workflow

Required hotkeys:

```text
r = run selected variant
R = clean run selected variant
v = select variant
d = select device
c = clear app data
l = launch app
k = kill app
u = uninstall app
t = run tests
s = screenshot selected device
g = toggle/focus logs
D = open doctor panel
q = quit
```

Optional hotkeys:

```text
? = help
o = open latest test report if available
C = clear visible log panel
```

### 4.5 Suggested dashboard layout

The exact visual implementation can vary, but it should preserve this information architecture:

```text
┌ DroidDeck ─────────────────────────────────────────────────────────────┐
│ Project: Wohin Du Willst      Module: app      Doctor: ✓ 9/9          │
│ Variant: stagingDebug         Device: Pixel 8  App: running           │
└───────────────────────────────────────────────────────────────────────┘

┌ Variants ──────────────┐ ┌ Device ────────────────────────────────────┐
│ devDebug               │ │ ● Pixel 8 API 35        emulator-5554      │
│ stagingDebug        ●  │ │ ○ Samsung S23           R5CW...            │
│ productionDebug        │ │ ○ Pixel Tablet API 34    emulator-5556      │
│ productionRelease      │ └────────────────────────────────────────────┘
└────────────────────────┘

┌ Build / Run ──────────────────────────────────────────────────────────┐
│ Last command: :app:installStagingDebug                                │
│ Status: SUCCESS                                                       │
│ Duration: 18.4s                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌ Logs ─────────────────────────────────────────────────────────────────┐
│ W Network: Retry /journeys                                            │
│ E Room: Query failed for station table                                │
│ E Crash: NullPointerException in JourneyDetailsScreen                 │
└───────────────────────────────────────────────────────────────────────┘

┌ Actions ──────────────────────────────────────────────────────────────┐
│ [r] run  [R] clean run  [v] variant  [d] device  [c] clear data       │
│ [l] launch  [k] kill  [u] uninstall  [t] tests  [s] screenshot        │
│ [g] logs  [D] doctor  [o] open report  [q] quit                      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Detection

### 5.1 Project root detection

When `droiddeck` runs, determine the project root.

Search upward from `process.cwd()` until one of the following is found:

```text
settings.gradle
settings.gradle.kts
gradlew
```

A valid Android project root should generally contain:

```text
gradlew
settings.gradle or settings.gradle.kts
```

If no project root is found:

- Show a clear error.
- Suggest running DroidDeck from an Android project directory.
- Exit with non-zero status for direct CLI commands.
- In TUI mode, show an error screen and allow quit.

### 5.2 Gradle wrapper requirement

MVP1 should prefer the project Gradle wrapper:

```bash
./gradlew
```

If `gradlew` is missing:

- Doctor should fail this check.
- CLI commands requiring Gradle should fail with a helpful message.
- Do not silently use a system Gradle installation in MVP1.

### 5.3 Android module detection

Initial strategy:

1. Read `droiddeck.config.json` if present.
2. If `appModule` exists, use it.
3. Otherwise default to `app`.
4. Verify that the module exists via Gradle tasks or directory presence.

Default assumption:

```text
appModule = "app"
```

Accept both:

```text
app
:app
```

Internally normalize to:

```text
app
```

When constructing Gradle tasks, use:

```text
:app:<taskName>
```

---

## 6. Configuration

### 6.1 Repo config file

DroidDeck should support an optional repo-level config file:

```text
droiddeck.config.json
```

Location:

```text
<project-root>/droiddeck.config.json
```

### 6.2 User preferences file

User-specific preferences should be stored outside the project:

```text
~/.droiddeck/preferences.json
```

Preferences must be per project path.

Example:

```json
{
  "projects": {
    "/Users/drilon/projects/wdw-android": {
      "lastVariant": "stagingDebug",
      "lastDeviceId": "emulator-5554",
      "lastLogMode": "warnings"
    }
  }
}
```

### 6.3 Repo config schema

Use Zod for validation.

Supported MVP1 config:

```json
{
  "projectName": "Wohin Du Willst",
  "appModule": "app",
  "variantAliases": {
    "dev": "developmentDebug",
    "staging": "stagingDebug",
    "prod": "productionRelease"
  },
  "applicationIds": {
    "developmentDebug": "de.example.app.dev",
    "stagingDebug": "de.example.app.staging",
    "productionDebug": "de.example.app",
    "productionRelease": "de.example.app"
  },
  "mainActivity": ".MainActivity",
  "logcat": {
    "defaultMode": "warnings",
    "tags": ["WDW", "Network", "Room", "Koin"]
  },
  "actions": {
    "launchMode": "monkey"
  }
}
```

### 6.4 Config fields

#### `projectName`

Type:

```text
string | undefined
```

If missing, use the project root directory name.

#### `appModule`

Type:

```text
string | undefined
```

Default:

```text
app
```

Accept:

```text
app
:app
```

Normalize internally to `app`.

#### `variantAliases`

Type:

```text
Record<string, string>
```

Allows:

```bash
droiddeck run staging
```

to resolve to:

```text
stagingDebug
```

Aliases are optional.

#### `applicationIds`

Type:

```text
Record<string, string>
```

Maps Android variants to application IDs/package names.

This field is optional but strongly recommended when package inference fails.

#### `mainActivity`

Type:

```text
string | undefined
```

Optional. If provided, launch can use:

```bash
adb shell am start -n <packageName>/<activityName>
```

If missing, launch via monkey:

```bash
adb shell monkey -p <packageName> 1
```

#### `logcat.defaultMode`

Allowed values:

```text
errors
warnings
all
```

Default:

```text
warnings
```

#### `logcat.tags`

Optional list of project-specific log tags.

#### `actions.launchMode`

Allowed values:

```text
monkey
activity
```

Default:

```text
monkey
```

If `activity` is selected, `mainActivity` must be provided.

---

## 7. Variant Discovery

### 7.1 Required behavior

DroidDeck must discover available variants from the Android Gradle project.

It should not require users to manually list variants in config.

### 7.2 MVP discovery method

Run:

```bash
./gradlew :app:tasks --all
```

where `app` is the configured/derived module.

Parse Gradle task names.

Relevant tasks:

```text
install<Variant>
assemble<Variant>
test<Variant>UnitTest
connected<Variant>AndroidTest
```

Examples:

```text
installStagingDebug
assembleStagingDebug
testStagingDebugUnitTest
connectedStagingDebugAndroidTest
```

From these, derive variant names:

```text
stagingDebug
```

### 7.3 Variant name conversion

Gradle task format uses PascalCase:

```text
StagingDebug
```

Internal variant format should be lower camel case:

```text
stagingDebug
```

Conversion:

```text
StagingDebug -> stagingDebug
ProductionRelease -> productionRelease
Debug -> debug
Release -> release
```

### 7.4 Task mapping

For each discovered variant, store:

```ts
type AndroidVariant = {
  name: string; // "stagingDebug"
  taskNamePart: string; // "StagingDebug"
  buildType?: string; // "debug" | "release" | unknown
  flavorName?: string; // "staging" | undefined
  installTask?: string; // ":app:installStagingDebug"
  assembleTask?: string; // ":app:assembleStagingDebug"
  unitTestTask?: string; // ":app:testStagingDebugUnitTest"
  connectedTestTask?: string; // ":app:connectedStagingDebugAndroidTest"
  applicationId?: string;
};
```

### 7.5 Build type support

MVP1 must support:

```text
debug
release
```

Other build types may be discovered and displayed, but full support is not guaranteed.

### 7.6 Flavor extraction

If variant ends with known build type:

```text
stagingDebug -> flavorName = staging, buildType = debug
productionRelease -> flavorName = production, buildType = release
```

For projects without flavors:

```text
debug -> flavorName = undefined, buildType = debug
release -> flavorName = undefined, buildType = release
```

### 7.7 Variant aliases

Alias resolution order:

1. If input exactly matches a discovered variant, use it.
2. Else if input matches `variantAliases`, resolve alias.
3. Else if input case-insensitively matches a variant, use that variant.
4. Else fail with helpful list of available variants and aliases.

Example:

```json
{
  "variantAliases": {
    "staging": "stagingDebug",
    "prod": "productionRelease"
  }
}
```

---

## 8. Application ID / Package Name Resolution

### 8.1 Required behavior

To launch, clear, kill, uninstall, and filter logs, DroidDeck needs the application ID/package name for the selected variant.

### 8.2 Resolution order

Resolve application ID in this order:

1. `applicationIds[variantName]` from config.
2. Infer from built/installed APK if possible.
3. Infer from Gradle files if safe/reliable.
4. Ask user or show actionable error.

For MVP1, do **not** attempt risky modifications. If uncertain, fail clearly and explain how to add `applicationIds` to config.

### 8.3 Acceptable MVP fallback

If application ID cannot be determined:

- `run` may still install using Gradle.
- Launch must fail with instructions.
- Clear/kill/uninstall/log filters must fail with instructions.

Show:

```text
Could not determine applicationId for variant "stagingDebug".

Add this to droiddeck.config.json:

{
  "applicationIds": {
    "stagingDebug": "your.package.name"
  }
}
```

### 8.4 Future improvement

A later version may use the Android Gradle Plugin model or a small Gradle init script to export variants/application IDs.

Do not implement that in MVP1 unless straightforward.

---

## 9. Device Management

### 9.1 List devices

Use:

```bash
adb devices -l
```

Parse connected devices.

Only include devices with state:

```text
device
```

Exclude or separately display:

```text
offline
unauthorized
no permissions
```

### 9.2 Device type

Infer basic type from ADB output:

- Emulator if ID starts with `emulator-`.
- Physical if not.

Optional additional info:

```bash
adb -s <deviceId> shell getprop ro.product.model
adb -s <deviceId> shell getprop ro.build.version.release
adb -s <deviceId> shell getprop ro.build.version.sdk
```

### 9.3 Device type model

```ts
type AndroidDevice = {
  id: string;
  state: "device" | "offline" | "unauthorized" | "unknown";
  model?: string;
  androidVersion?: string;
  apiLevel?: string;
  isEmulator: boolean;
  rawLine: string;
};
```

### 9.4 Device selection

If no device is selected:

- If exactly one online device exists, auto-select it.
- If multiple devices exist, prompt/select in TUI.
- If no devices exist, show clear empty state.

Persist selected device per project path:

```json
{
  "projects": {
    "/path/to/project": {
      "lastDeviceId": "emulator-5554"
    }
  }
}
```

If persisted device is disconnected:

- Show it as unavailable if helpful.
- Select first available device or ask user.

### 9.5 Multi-device support

MVP1 may be single-device only.

However, internal state should be designed to support future multi-device mode:

```ts
selectedDeviceIds: string[];
```

Do not hardcode assumptions that only one device can ever exist.

---

## 10. Gradle Integration

### 10.1 Running Gradle

Use project wrapper:

```bash
./gradlew
```

Execute from project root.

Use `execa` with streaming output.

### 10.2 Install selected variant

For selected variant `stagingDebug`, run:

```bash
./gradlew :app:installStagingDebug
```

Use variant task mapping discovered in section 7.

### 10.3 Clean run

Hotkey:

```text
R
```

Direct option:

```bash
droiddeck run --clean
```

Behavior:

```bash
./gradlew clean :app:installStagingDebug
```

or sequentially:

```bash
./gradlew clean
./gradlew :app:installStagingDebug
```

Sequential execution is easier to report in UI and preferred for MVP1.

### 10.4 Assemble fallback

If install task does not exist for a release variant, but assemble task exists:

```bash
./gradlew :app:assembleProductionRelease
```

Then show:

```text
Variant assembled, but no install task was found.
```

Do not try to manually install APK in MVP1 unless robustly implemented.

### 10.5 Build output panel

The TUI must show:

- Current command.
- Current state: idle/running/success/failed.
- Elapsed time.
- Last 10-20 output lines.
- Error lines when failed.

Do not flood the TUI with full Gradle output.

### 10.6 Process cancellation

When user quits the TUI:

- Stop child processes started by DroidDeck.
- Do not kill unrelated Gradle daemons.
- Do not kill unrelated ADB/logcat processes.
- Make best effort to cleanly terminate child processes.

---

## 11. App Launching

### 11.1 Default launch strategy

Use monkey by default:

```bash
adb -s <deviceId> shell monkey -p <applicationId> 1
```

This avoids requiring a known activity.

### 11.2 Activity launch strategy

If configured:

```json
{
  "actions": {
    "launchMode": "activity"
  },
  "mainActivity": ".MainActivity"
}
```

Then use:

```bash
adb -s <deviceId> shell am start -n <applicationId>/<mainActivity>
```

Handle both:

```text
.MainActivity
com.example.MainActivity
```

### 11.3 Launch after run

`run` must launch automatically after successful install.

If install succeeds but launch fails due to missing application ID:

- Show install success.
- Show launch failure with instructions.
- Do not treat whole run as fully successful.

---

## 12. Common ADB Actions

### 12.1 Clear app data

Command:

```bash
adb -s <deviceId> shell pm clear <applicationId>
```

Hotkey:

```text
c
```

Direct command:

```bash
droiddeck clear [variantOrAlias]
```

### 12.2 Kill app

Command:

```bash
adb -s <deviceId> shell am force-stop <applicationId>
```

Hotkey:

```text
k
```

Direct command:

```bash
droiddeck kill [variantOrAlias]
```

### 12.3 Relaunch app

Command sequence:

```bash
adb -s <deviceId> shell am force-stop <applicationId>
adb -s <deviceId> shell monkey -p <applicationId> 1
```

Hotkey:

```text
l
```

Direct command:

```bash
droiddeck launch [variantOrAlias]
```

Note: `launch` should not always force-stop unless explicitly implemented as relaunch. In TUI, `l` can simply launch. Add separate future action if needed.

### 12.4 Uninstall app

Command:

```bash
adb -s <deviceId> uninstall <applicationId>
```

Hotkey:

```text
u
```

Direct command:

```bash
droiddeck uninstall [variantOrAlias]
```

Safety:

- In TUI, ask for confirmation before uninstalling.
- In direct CLI, require `--yes` or prompt interactively.
- Never uninstall without explicit user action.

### 12.5 Screenshot

Command:

```bash
adb -s <deviceId> exec-out screencap -p > <file>
```

Save to:

```text
<project-root>/.droiddeck/screenshots/
```

Filename format:

```text
screenshot-<variant>-<deviceId>-YYYYMMDD-HHmmss.png
```

Direct command:

```bash
droiddeck screenshot [variantOrAlias]
```

After capture:

- Show file path.
- In TUI, optionally show latest screenshot path.
- Do not automatically open the image unless user requests.

### 12.6 Optional MVP1.5 ADB actions

Do not implement unless time remains:

```text
Open app settings
Grant notification permission
Toggle dark mode
Change system language
```

---

## 13. Logs / Logcat

### 13.1 Log modes

MVP1 log modes:

```text
errors
warnings
all
```

Definitions:

```text
errors   = priority E and F
warnings = priority W, E, F
all      = app-filtered logs if package/process can be resolved; otherwise all logs
```

### 13.2 Default mode

Use config:

```json
{
  "logcat": {
    "defaultMode": "warnings"
  }
}
```

Fallback:

```text
warnings
```

### 13.3 Logcat command

Basic command:

```bash
adb -s <deviceId> logcat
```

Filtering can be performed either via logcat args or in-process parsing.

Recommended MVP approach:

- Start `adb logcat`.
- Parse and filter lines in Node.
- Keep last N visible lines in memory.
- N default: 500 in memory, 50 visible in TUI depending on layout.

### 13.4 App-specific filtering

If application ID is known, prefer filtering by process ID:

1. Get PID:

```bash
adb -s <deviceId> shell pidof <applicationId>
```

2. Filter logcat lines matching PID if logcat format includes PID.

Potential command:

```bash
adb -s <deviceId> logcat -v threadtime
```

`threadtime` includes PID/TID.

If PID cannot be found:

- Show warning: app process not running.
- Fall back to priority filtering and/or configured tags.

### 13.5 Session marker

Do not clear the global Logcat buffer automatically by default.

Instead, on run/launch, insert a visible UI session separator:

```text
──── DroidDeck session started: stagingDebug at 14:32:10 ────
```

Optional action:

```text
C = clear visible log panel
```

This clears DroidDeck's visible panel only, not device logcat.

### 13.6 Log line model

```ts
type LogLine = {
  timestamp?: string;
  priority?: "V" | "D" | "I" | "W" | "E" | "F";
  pid?: string;
  tid?: string;
  tag?: string;
  message: string;
  raw: string;
};
```

### 13.7 Crash highlighting

MVP1 should highlight obvious crash lines:

```text
FATAL EXCEPTION
AndroidRuntime
java.lang.
kotlin.
Caused by:
```

Do not implement AI analysis.

---

## 14. Tests

### 14.1 MVP test types

Required MVP1:

```text
unit tests for selected variant
all unit tests if easy
```

Optional:

```text
connected Android tests
```

### 14.2 Unit test command

For selected variant `stagingDebug`:

```bash
./gradlew :app:testStagingDebugUnitTest
```

### 14.3 Test direct command

```bash
droiddeck test [variantOrAlias]
```

Default behavior:

- Use selected/persisted variant if no arg.
- Run unit test task for selected variant.
- Show running output and final pass/fail.

### 14.4 Test report opening

If test completes, detect likely report path:

```text
<project-root>/app/build/reports/tests/test<Variant>UnitTest/index.html
```

Example:

```text
app/build/reports/tests/testStagingDebugUnitTest/index.html
```

TUI hotkey:

```text
o = open latest test report
```

Direct option:

```bash
droiddeck test --open-report
```

Use the `open` package or macOS `open`.

### 14.5 Failed tests

MVP1 does not need to parse failed test details deeply.

But final output should clearly show:

```text
TESTS PASSED
```

or:

```text
TESTS FAILED
```

and point to the report if available.

---

## 15. Doctor

### 15.1 Doctor must exist in CLI and TUI

Direct command:

```bash
droiddeck doctor
```

TUI hotkey:

```text
D
```

Dashboard should show a summary:

```text
Doctor: ✓ 9/9
```

or:

```text
Doctor: ⚠ 7/9
```

### 15.2 Required doctor checks

Implement these checks:

1. macOS detected.
2. Node.js version supported.
3. Project root found.
4. Gradle wrapper exists and executable.
5. Android project settings file exists.
6. App module detected.
7. Gradle tasks can be loaded.
8. Variants discovered.
9. ADB available.
10. Android SDK environment likely available.
11. Connected devices available.
12. Config file valid if present.
13. User preferences readable/writable.
14. Application ID known for selected variant if selected.

### 15.3 Doctor check model

```ts
type DoctorCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
  suggestion?: string;
};
```

### 15.4 Doctor behavior

- `fail` means a core feature cannot work.
- `warn` means DroidDeck can continue but some feature is limited.
- `pass` means OK.

Example:

```text
✓ Gradle wrapper found
✓ ADB found
⚠ No connected devices
✗ Could not discover variants
```

---

## 16. CLI Command Details

### 16.1 `droiddeck`

Opens TUI dashboard.

Behavior:

1. Detect project.
2. Load config.
3. Load preferences.
4. Run lightweight doctor checks.
5. Discover variants.
6. Discover devices.
7. Resolve selected variant/device.
8. Render dashboard.

### 16.2 `droiddeck doctor`

Runs doctor checks and prints report.

Exit code:

```text
0 = no fail checks
1 = one or more fail checks
```

Warnings alone should still return `0`.

### 16.3 `droiddeck variants`

Print discovered variants.

Include:

- variant name.
- build type.
- flavor if known.
- install task availability.
- unit test task availability.
- alias if configured.

### 16.4 `droiddeck devices`

Print connected devices.

Include:

- device ID.
- model.
- Android version.
- API level.
- emulator/physical.
- state.

### 16.5 `droiddeck use <variantOrAlias>`

Resolve variant/alias and persist it for the current project.

### 16.6 `droiddeck device <deviceId>`

Validate connected device and persist it for current project.

### 16.7 `droiddeck run [variantOrAlias]`

Options:

```text
--fresh       clear app data before launch
--clean       run Gradle clean first
--watch       keep logs open after launch
--device <id> select device for this run
```

Behavior:

1. Resolve variant.
2. Resolve device.
3. If `--clean`, run clean.
4. Run install task.
5. If `--fresh`, clear app data after install and before launch.
6. Launch app.
7. If `--watch`, start logs.

### 16.8 `droiddeck logs [variantOrAlias]`

Options:

```text
--errors
--warnings
--all
--device <id>
```

Behavior:

- Resolve variant/package if available.
- Start logcat.
- Filter based on mode.
- Stream logs until user stops with Ctrl+C.

### 16.9 `droiddeck test [variantOrAlias]`

Options:

```text
--all
--connected
--open-report
```

MVP required:

- Unit tests for selected variant.

Optional:

- `--connected`.

### 16.10 `droiddeck clear [variantOrAlias]`

Clears app data for selected variant.

Requires:

- application ID.
- selected device.

### 16.11 `droiddeck launch [variantOrAlias]`

Launches app.

Requires:

- application ID.
- selected device.

### 16.12 `droiddeck kill [variantOrAlias]`

Force-stops app.

Requires:

- application ID.
- selected device.

### 16.13 `droiddeck uninstall [variantOrAlias]`

Uninstalls app.

Requires:

- application ID.
- selected device.

Safety:

- Prompt unless `--yes` is supplied.

### 16.14 `droiddeck screenshot [variantOrAlias]`

Captures screenshot from selected device.

Does not strictly need variant except for filename context.

---

## 17. State Management

### 17.1 TUI state

Suggested state:

```ts
type AppState = {
  project: ProjectInfo | null;
  config: DroidDeckConfig;
  preferences: ProjectPreferences;
  doctorChecks: DoctorCheck[];
  variants: AndroidVariant[];
  devices: AndroidDevice[];
  selectedVariant?: AndroidVariant;
  selectedDevice?: AndroidDevice;
  buildState: CommandState;
  testState: CommandState;
  logState: LogState;
  activePanel: "main" | "variant-picker" | "device-picker" | "doctor" | "logs" | "help";
};
```

### 17.2 Command state

```ts
type CommandState = {
  status: "idle" | "running" | "success" | "failed";
  command?: string;
  startedAt?: number;
  endedAt?: number;
  exitCode?: number;
  outputLines: string[];
  error?: string;
};
```

### 17.3 Log state

```ts
type LogState = {
  mode: "errors" | "warnings" | "all";
  isRunning: boolean;
  lines: LogLine[];
  visibleLines: LogLine[];
  processPid?: number;
};
```

---

## 18. File and Directory Structure

Recommended repo structure:

```text
droiddeck/
  package.json
  pnpm-lock.yaml
  tsconfig.json
  README.md
  PLAN.md
  src/
    index.ts
    cli/
      program.ts
      commands/
        dashboard.ts
        doctor.ts
        variants.ts
        devices.ts
        use.ts
        device.ts
        run.ts
        logs.ts
        test.ts
        clear.ts
        launch.ts
        kill.ts
        uninstall.ts
        screenshot.ts
    core/
      projectDetector.ts
      config.ts
      preferences.ts
      gradle.ts
      variantDiscovery.ts
      variantResolver.ts
      adb.ts
      devices.ts
      appIdResolver.ts
      logcat.ts
      testRunner.ts
      doctor.ts
      screenshots.ts
      processRunner.ts
      paths.ts
    tui/
      App.tsx
      hooks/
        useKeyboardActions.ts
        useLogcat.ts
      components/
        Header.tsx
        VariantPanel.tsx
        DevicePanel.tsx
        BuildPanel.tsx
        LogPanel.tsx
        ActionsPanel.tsx
        DoctorPanel.tsx
        HelpPanel.tsx
        Picker.tsx
    types/
      config.ts
      project.ts
      variant.ts
      device.ts
      doctor.ts
      command.ts
      log.ts
    utils/
      casing.ts
      time.ts
      shell.ts
      errors.ts
  tests/
    unit/
      casing.test.ts
      variantDiscovery.test.ts
      config.test.ts
      preferences.test.ts
```

---

## 19. Implementation Order

An AI agent should implement MVP1 in this order.

### Phase 1 — Project skeleton

1. Create Node + TypeScript project.
2. Configure package scripts.
3. Add Commander CLI entry.
4. Add build/dev scripts.
5. Ensure `droiddeck --help` works.

Suggested scripts:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

Use `tsx` for local development if desired.

### Phase 2 — Core detection/config

1. Implement project root detection.
2. Implement config loading.
3. Implement Zod config validation.
4. Implement preferences loading/saving.
5. Implement path helpers.

### Phase 3 — Gradle/variant discovery

1. Implement Gradle wrapper detection.
2. Implement command runner.
3. Run `./gradlew :app:tasks --all`.
4. Parse variant tasks.
5. Build `AndroidVariant[]`.
6. Implement alias resolution.

### Phase 4 — ADB/device discovery

1. Check `adb` availability.
2. Parse `adb devices -l`.
3. Fetch model/API/version where possible.
4. Implement device selection and persistence.

### Phase 5 — Application ID resolution

1. Implement config-based resolution.
2. Implement clear actionable errors.
3. Optional: implement simple Gradle file inference if safe.
4. Do not block install if app ID is missing; block launch/log actions.

### Phase 6 — Direct CLI commands

Implement:

```text
doctor
variants
devices
use
device
run
clear
launch
kill
uninstall
screenshot
test
logs
```

Keep output clean and predictable.

### Phase 7 — TUI dashboard

1. Create Ink App.
2. Render header.
3. Render variant list.
4. Render device list.
5. Render build/action state.
6. Render log panel.
7. Render action hotkeys.
8. Implement variant picker.
9. Implement device picker.
10. Wire hotkeys to actions.

### Phase 8 — Logs

1. Start/stop logcat process.
2. Parse basic log lines.
3. Filter by priority.
4. Try PID filtering when app is running.
5. Add crash highlighting.
6. Add visible panel clear action.

### Phase 9 — Tests and reports

1. Run unit tests for selected variant.
2. Track output/status.
3. Locate HTML report.
4. Implement open report.

### Phase 10 — Polish and safety

1. Add helpful error messages.
2. Confirm before uninstall.
3. Ensure child processes stop on quit.
4. Add doctor panel inside TUI.
5. Add README quickstart.
6. Add tests for parsing and config.

---

## 20. Error Handling Principles

### 20.1 Clear, actionable errors

Every error should say:

1. What failed.
2. Why it likely failed.
3. What the user can do.

Bad:

```text
Error: command failed
```

Good:

```text
Could not determine applicationId for variant "stagingDebug".

Add it to droiddeck.config.json:

{
  "applicationIds": {
    "stagingDebug": "your.package.name"
  }
}
```

### 20.2 Do not hide command failures

If Gradle/ADB fails:

- Show command.
- Show exit code.
- Show relevant output.
- Preserve enough context for debugging.

### 20.3 Avoid destructive defaults

Never automatically:

- clear data,
- uninstall,
- delete files,
- kill unrelated processes,
- modify project files,

unless explicitly requested.

---

## 21. Safety Rules

1. `run` must not clear data unless `--fresh` or user pressed `c`.
2. `run` must not uninstall.
3. `clean run` must only run Gradle `clean`; do not delete arbitrary directories.
4. `uninstall` must ask confirmation in TUI or require explicit CLI confirmation.
5. Only kill processes started by DroidDeck.
6. User preferences may be written automatically.
7. Repo config should not be modified automatically in MVP1 unless user explicitly requests a setup command in future.
8. Do not send logs or code anywhere externally.
9. No analytics in MVP1.
10. No AI/log upload in MVP1.

---

## 22. Testing Strategy

### 22.1 Unit tests required

Implement unit tests for:

- casing conversion:
  - `StagingDebug -> stagingDebug`
  - `ProductionRelease -> productionRelease`
- Gradle task parsing:
  - install tasks
  - assemble tasks
  - unit test tasks
  - connected test tasks
- variant alias resolution.
- config validation.
- preference path handling.
- ADB device line parsing.
- log priority filtering.

### 22.2 Manual test scenarios

Test manually on a real Android project:

1. Start dashboard from project root.
2. Start dashboard from subdirectory.
3. Run doctor.
4. Discover variants.
5. Select variant.
6. Select device.
7. Run debug variant.
8. Launch app.
9. Clear app data.
10. Kill app.
11. Uninstall app after confirmation.
12. Capture screenshot.
13. Run unit tests.
14. Open test report.
15. Start logs.
16. Quit while logcat is running.
17. Quit while Gradle command is running.
18. Run with no devices connected.
19. Run with application ID missing.
20. Run with invalid config.

---

## 23. Acceptance Criteria

MVP1 is complete when all of the following are true:

1. `droiddeck` opens a TUI dashboard by default.
2. `droiddeck doctor` works from CLI.
3. Doctor panel exists inside TUI.
4. DroidDeck detects Android project root from current directory or parent.
5. DroidDeck uses project Gradle wrapper.
6. DroidDeck loads optional `droiddeck.config.json`.
7. DroidDeck validates config and shows clear errors.
8. DroidDeck stores user preferences in `~/.droiddeck/preferences.json`.
9. Preferences are stored per project path.
10. DroidDeck discovers variants from Gradle tasks.
11. DroidDeck supports debug and release variants.
12. DroidDeck supports variant aliases from config.
13. DroidDeck lists connected ADB devices.
14. DroidDeck persists last selected variant.
15. DroidDeck persists last selected device.
16. TUI can select variant.
17. TUI can select device.
18. `run` installs selected variant.
19. `run` launches app after install when application ID is known.
20. `run --fresh` clears app data before launch.
21. `run --clean` runs clean before install.
22. TUI shows command status and recent output.
23. TUI shows filtered logs.
24. CLI `logs` streams filtered logs.
25. TUI can clear app data.
26. TUI can kill app.
27. TUI can launch app.
28. TUI can uninstall app with confirmation.
29. TUI can take screenshot.
30. CLI `screenshot` saves screenshot.
31. TUI can run unit tests for selected variant.
32. CLI `test` runs unit tests for selected variant.
33. Test report can be opened when available.
34. All child Gradle/ADB/logcat processes started by DroidDeck are stopped on quit.
35. The app has no AI, analytics, network calls, or external data upload in MVP1.
36. A basic README explains install, config, and usage.

---

## 24. Suggested README Content

The README should include:

```text
# DroidDeck

DroidDeck is a terminal dashboard for native Android development.

## Install

pnpm install
pnpm build

## Usage

droiddeck

## Commands

droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck run staging
droiddeck test staging
droiddeck logs staging

## Config

Create droiddeck.config.json in your Android project root.

## Example config

...

## Requirements

macOS
Node.js 20+
Android SDK / adb
Android project with Gradle wrapper

## MVP limitations

macOS-first
single-device focused
no release automation
no Android Studio plugin
```

---

## 25. Future Roadmap After MVP1

Potential post-MVP features:

### MVP1.5

- Multi-device install/launch.
- Screenshot all devices.
- Connected Android tests.
- Open app settings.
- Grant permissions.
- Notification permission helper.
- Toggle dark mode.
- Deep link launcher.
- Better package/applicationId discovery.
- Better Logcat filters.

### MVP2

- Multi-device dashboard inspired more strongly by Flutter CLI TUI.
- Per-device panels.
- Bug report ZIP:
  - logs,
  - screenshot,
  - device info,
  - app info,
  - git info.
- App startup timing.
- Basic memory info.
- Config wizard.
- Support Linux.
- Support Windows.

### MVP3

- Android Studio integration.
- Optional GUI.
- Gradle plugin for accurate variant/applicationId export.
- Public open-source release.
- Plugin architecture.
- Optional AI crash/log explanation with strict privacy controls.

---

## 26. Implementation Notes for AI Agent

When implementing, prefer correctness and reliability over visual polish.

Do not hardcode WDW-specific names, package names, flavors, or assumptions.

The first real project may be WDW, but DroidDeck must remain generic.

Use strict TypeScript types.

Keep modules small.

All command execution should go through one process runner abstraction so output, cancellation, errors, and logging are consistent.

All ADB commands should require an explicit selected device ID when more than one device is connected.

All app-specific ADB commands should require a resolved application ID.

All destructive commands should require explicit user action.

Do not add telemetry, analytics, external API calls, or AI features.

---

## 27. Example First Run Flow

User runs:

```bash
droiddeck
```

DroidDeck:

1. Finds Android project root.
2. Loads config if present.
3. Detects module `app`.
4. Runs Gradle task discovery.
5. Finds variants:
   - `developmentDebug`
   - `stagingDebug`
   - `productionDebug`
   - `productionRelease`
6. Lists devices:
   - `emulator-5554`
   - `R5CW...`
7. Uses last selected variant/device if available.
8. Otherwise asks user to select.
9. Shows dashboard.

User presses:

```text
r
```

DroidDeck:

1. Runs `./gradlew :app:installStagingDebug`.
2. Shows build status.
3. Resolves application ID.
4. Runs `adb -s emulator-5554 shell monkey -p de.example.app.staging 1`.
5. Shows app launch status.
6. Starts/updates log panel.

User presses:

```text
t
```

DroidDeck:

1. Runs `./gradlew :app:testStagingDebugUnitTest`.
2. Shows test status.
3. Stores latest report path.
4. Allows `o` to open report.

---

## 28. Final MVP Definition

DroidDeck MVP1 is a macOS-first, Node.js/TypeScript-based terminal dashboard for native Android projects.

It opens with:

```bash
droiddeck
```

It discovers Android variants from Gradle, supports variant aliases, lets the developer select a variant and device, then provides fast keyboard actions for run, clean run, logs, tests, clear data, kill, launch, uninstall, screenshot, and doctor checks.

It should feel like a polished internal productivity tool inspired by the Flutter CLI TUI concept, while solving the Android-specific pain of flavor/variant-heavy development.

The implementation is complete only when the tool can be used daily on a real multi-flavor Android project without requiring developers to remember Gradle and ADB commands.
