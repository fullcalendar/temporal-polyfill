
Scope all work within the <repo-root>/packages/temporal-polyfill package.
CD into that directory before running any npm-scripts.

If needed, the `pnpm` binary is located at `/Users/adam/Library/pnpm/pnpm`

Don't bother running `pnpm run size` ever


## Repo Installation

This info will eventually be in the repo root's README.md, but it's only here for now...

Install all submodules after cloning a repo:

```
git submodule update --init --recursive
```

Run `pnpm install` from the repo root


## Test Failures

A big subproject is fixing test262 failures. To run ALL tests,
CD into the `packages/temporal-polyfill` directory and run:

```
pnpm run test262 --no-max
```

To run individual test files:

```
# format: pnpm run test262 ../../test262/test/<path-to-test-file>.js`
# example:
pnpm run test262 ../../test262/test/built-ins/Temporal/Instant/basic.js
```

See these files for failure groups:

- `packages/temporal-polyfill/TEST-FAILURE-BUCKETS.md` (starting point)
- `packages/temporal-polyfill/TEST-FAILURE-BUCKETS.tsv` (all failures)
