# Contributing

Issues and pull requests are welcome. Please keep changes focused and include tests for behavior changes.

## Development

Use Node.js 20.12.0 or later, then install dependencies with your preferred package manager.

```bash
npm ci
npm run check
```

`npm run check` verifies formatting, linting, types, test coverage, and the production build. Run `npm pack --dry-run` before a release to inspect the published files.

## Releases

Update `CHANGELOG.md` and the package version together. Releases are published from a clean, tagged commit after all checks pass. Before the first automated release, configure npm Trusted Publishing for this repository so the publish workflow can create provenance without a long-lived npm token.
