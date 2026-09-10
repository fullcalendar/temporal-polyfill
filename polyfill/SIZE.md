# Minified + gzip size checks

Run package scripts from `polyfill`. All reported sizes below mean bytes after
both minification and gzip compression. Individual function rows are independent
imports and must not be summed into an application bundle size.

## Check the accepted baseline

```sh
pnpm run size:check
```

This builds `export-size`, rebuilds the package, minifies both global IIFEs, and
measures every runtime function export from the published export map. It writes
`dist/size-snapshot.json` and compares it against
[scripts/size-baseline.json](scripts/size-baseline.json). Any size increase, missing
export, or new export fails the command. The two globals are checked independently
of the function API.

The baseline is the accepted duplicate-slot cleanup checkpoint, documented in
[the cleanup report](size-analysis/2026-09-10/slot-cleanup/REPORT.md). Review a new complete
snapshot before replacing it; do not update the baseline merely to make a failed
check pass. Pin the toolchain when comparing results. `.npmrc` pins the Node
version for package scripts, and the snapshot records Node and zlib versions.

## Capture a checkpoint

Build the `misc/export-size` submodule first if needed, then from `polyfill`:

```sh
pnpm run build
pnpm run size:snapshot --output dist/experiment-size.json \
  --baseline scripts/size-baseline.json
```

This produces a complete JSON manifest and a Markdown comparison table. Each
checkpoint occupies one column, and current cells show `size (percentage delta)`
relative to the baseline column. Nothing is filtered out of the check.

Compare already captured checkpoints without building or measuring again:

```sh
node scripts/size-snapshot.js --input dist/experiment-size.json \
  --baseline scripts/size-baseline.json --check
```

`--tolerance N` explicitly permits at most N bytes of growth **per row**. The
default is zero. It never permits added or removed exports. For a deliberately
accepted global tradeoff, review and update those individual baseline rows rather
than quietly granting every function a larger budget.

Global IIFEs retain the existing `gzip-size` convention (level 9). Individual
exports retain `export-size`'s default gzip level. Exports include their runtime
dependencies and both native/shim branches. Neither the display nor the guard
uses uncompressed minified sizes.

## Recovery targets

The [original optimization report](size-analysis/2026-09-10/OPTIMIZATION.md) records the
release, starting point, and optimization checkpoints. Its full per-export matrix
preserves improvements that might otherwise disappear behind a 10% filter.
