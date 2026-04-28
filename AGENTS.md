
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

The test262 runner accepts multiple file paths in one invocation. For example:

```
pnpm run test262 \
  ../../test262/test/built-ins/Temporal/PlainYearMonth/prototype/add/options-read-before-algorithmic-validation.js \
  ../../test262/test/built-ins/Temporal/PlainYearMonth/prototype/subtract/options-read-before-algorithmic-validation.js \
  --no-max
```

To run a whole bucket from the TSV file, generate the file list with `awk`:

```
pnpm run test262 $(awk -F '\t' '$1 == "A" { print "../../test262/" $2 }' TEST-FAILURE-BUCKETS.tsv) --no-max
```

See these files for failure groups:

- `packages/temporal-polyfill/TEST-FAILURE-BUCKETS.md` (starting point)
- `packages/temporal-polyfill/TEST-FAILURE-BUCKETS.tsv` (all failures)


## Test262 Observability Notes

- Test262 runs against built output in `dist/global.js`. After source edits, run `pnpm run build` before expecting `pnpm run test262` to reflect the changes.
- For observability failures, avoid converting internal tuple/array paths back to spread, destructuring, or `for...of` when the code intentionally uses index access. Those constructs can observe `Array.prototype[Symbol.iterator]`.
- When fabricating internal option bags, prefer null-prototype objects to avoid observing `Object.prototype` pollution.
- For option-ordering tests, read and coerce all relevant options first, then do algorithmic validation.
- `PlainYearMonth.add/subtract` has special lower-unit validation: `overflow` must be read before rejecting units below month.
