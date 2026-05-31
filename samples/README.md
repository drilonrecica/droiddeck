# DroidDeck Samples

This directory contains small Android projects used to manually test DroidDeck against real Gradle and ADB workflows.

## Projects

- `three-flavor-android`: a minimal Android app with three product flavors and debug/release build types.

## Three Flavor Android

The `three-flavor-android` sample uses one flavor dimension, `environment`, with
three product flavors:

| Flavor | Debug variant | Release variant | Application ID |
| --- | --- | --- | --- |
| `free` | `freeDebug` | `freeRelease` | `dev.recica.threeflavorsample.free` |
| `staging` | `stagingDebug` | `stagingRelease` | `dev.recica.threeflavorsample.staging` |
| `paid` | `paidDebug` | `paidRelease` | `dev.recica.threeflavorsample.paid` |

Each flavor has a distinct app label and application ID suffix so multiple
flavored builds can be installed and targeted independently during manual
DroidDeck testing.

The sample projects are intentionally generic and are meant for local manual testing of DroidDeck behavior. They are not templates for production Android apps.

## Running A Sample

```bash
cd samples/three-flavor-android
bun ../../dist/index.js doctor
bun ../../dist/index.js variants
bun ../../dist/index.js
```

In the TUI, use Tab/Shift+Tab to move between variants, devices, build output,
logs, and actions. Use arrows or j/k to move within the focused panel and Enter
to select or run the highlighted item.

Useful direct checks:

```bash
./gradlew :app:tasks --group build
bun ../../dist/index.js variants
bun ../../dist/index.js run freeDebug
bun ../../dist/index.js run stagingDebug
bun ../../dist/index.js run paidDebug
```

The three-flavor sample includes a complete Gradle wrapper so DroidDeck can validate the same wrapper-only workflow it requires from real projects.

Requirements:

- Bun 1.2 or newer for running DroidDeck.
- Node.js 20 or newer for local package development and tests.
- Android SDK installed with platform-tools.
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` set.
- A JDK compatible with the Android Gradle Plugin. JDK 17 is the safest default.
