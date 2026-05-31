# Homebrew Tap

DroidDeck uses a personal tap for Homebrew distribution:

```bash
brew install drilonrecica/droiddeck/droiddeck
```

## Tap Setup

Create a public tap repository:

```bash
brew tap-new drilonrecica/homebrew-droiddeck
gh repo create drilonrecica/homebrew-droiddeck --public --source "$(brew --repository drilonrecica/homebrew-droiddeck)" --push
```

Add a `HOMEBREW_TAP_TOKEN` secret to `drilonrecica/droiddeck`. The token needs
write access to `drilonrecica/homebrew-droiddeck`.

## Release Flow

1. Commit the release changes.
2. Tag the release, for example `v0.1.2`.
3. Push the commit and tag.
4. The release workflow builds `droiddeck-0.1.2.tgz`, creates `SHA256SUMS`,
   uploads both files to the GitHub release, and updates the tap formula.

## Local Formula Check

After building a package tarball, verify the formula locally where Homebrew is
available:

```bash
brew tap oven-sh/bun
brew install --build-from-source ./Formula/droiddeck.rb
brew test droiddeck
droiddeck --help
```
