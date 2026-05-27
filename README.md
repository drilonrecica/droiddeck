# DroidDeck

DroidDeck is a terminal dashboard and CLI command center for native Android development.

It is macOS-first for MVP1 and wraps common Gradle and ADB workflows: discover variants, select a device, run/install/launch, view filtered logs, run tests, capture screenshots, and run doctor checks.

## Requirements

- macOS
- Node.js 20+
- Android SDK / `adb`
- Android project with a Gradle wrapper

## Install

```bash
pnpm install
pnpm build
```

If `pnpm` is unavailable, `npm install` also works for local development.

## Usage

```bash
droiddeck
droiddeck doctor
droiddeck variants
droiddeck devices
droiddeck run staging
droiddeck test staging
droiddeck logs staging
```

## Config

Create `droiddeck.config.json` in an Android project root when defaults are not enough.

```json
{
  "projectName": "Example Android App",
  "appModule": "app",
  "variantAliases": {
    "staging": "stagingDebug"
  },
  "applicationIds": {
    "stagingDebug": "com.example.app.staging"
  },
  "logcat": {
    "defaultMode": "warnings",
    "tags": ["Network", "Database"]
  },
  "actions": {
    "launchMode": "monkey"
  }
}
```

DroidDeck is a general Android tool. Do not rely on project-specific names unless they are supplied by your project config.

## Notes

Screenshots are written to `.droiddeck/screenshots/` inside the Android project. Add `.droiddeck/` to that project's `.gitignore` if screenshots should not be tracked.

MVP1 intentionally excludes AI, analytics, Firebase integration, release automation, Android Studio plugins, and external network calls.
