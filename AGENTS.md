
Scope all work within the <repo-root>/polyfill package.
CD into that directory before running any npm-scripts.

If needed, the `pnpm` binary is located at `/Users/adam/Library/pnpm/pnpm`

Don't bother running bare `pnpm run size` ever


## Typechecking

Always use the npm script for typechecking — do not invoke `tsc` directly or
craft custom `tsc` commands. Running `tsc` by hand can leave `tsconfig.tsbuildinfo`
metadata files stranded in the source tree.

From `polyfill`:

```
pnpm run tsc:all
```


## Linting

After any code change, always check linting from `polyfill`:

```
pnpm run lint
```

If you intentionally limit linting to touched files during iteration, run the
full `pnpm run lint` before handing work back.


## IMPORTANT: Repo Setup (ESPECIALLY right after creating a worktree)

FIRST, install all submodules after cloning a repo:

```
git submodule update --init --recursive
```

SECOND, run `pnpm install` from the repo root


## Test Failures

A big subproject is fixing test262 failures. To run ALL tests,
CD into the `polyfill` directory and run:

```
pnpm run test262 --no-max
```

To run individual test files:

```
# format: pnpm run test262 ../test262/test/<path-to-test-file>.js`
# example:
pnpm run test262 ../test262/test/built-ins/Temporal/Instant/basic.js
```

The test262 runner accepts multiple file paths in one invocation. For example:

```
pnpm run test262 \
  ../test262/test/built-ins/Temporal/PlainYearMonth/prototype/add/options-read-before-algorithmic-validation.js \
  ../test262/test/built-ins/Temporal/PlainYearMonth/prototype/subtract/options-read-before-algorithmic-validation.js \
  --no-max
```

Expected failures live in `polyfill/scripts/test262-expected-failures/`. The
runner picks which files apply from the current lane — see the
`expectedFailureFiles` list in `polyfill/scripts/test262.js`:

- `shim.txt` — the general list for the shim lane. **Add intentional expected
  failures here.**
- `shim-node-lte*.txt` / `shim-node-gte*.txt` — host-Intl and other environment
  quirks tied to a Node version range. Do not add general failures here unless
  the failure really is specific to that range.
- `native.txt` — used instead of the shim lists when Node has native Temporal
  (>=26), where the runner tests the native-precedence artifact.
- `calendar*.txt`, `shim-builtin-calls.txt`, `minified-function-length.txt` —
  selected automatically for the basic (non-`full`) artifact, far-range calendar
  dates, and minifier lanes. Leave these to their stated purpose.

Each file opens with a comment naming its category (`ENV-ISSUE`, `WONTFIX`,
`BUILTIN-USAGE`, etc.). Match that convention when adding entries.

When fixing test262 failures, default to addressing the work as a sequence of
individual sub-fixes/root causes, and review or explain them one-by-one instead
of treating the whole bucket as one opaque change.


## Test262 Notes

- IMPORTANT: Always run `pnpm run build` before running `pnpm run test262`. The test262 runner tests against the built output in `dist/global.js`, not the source files.
- When fabricating internal option bags, prefer null-prototype objects to avoid observing `Object.prototype` pollution.
- For option-ordering tests, read and coerce all relevant options first, then do algorithmic validation.
- `PlainYearMonth.add/subtract` has special lower-unit validation: `overflow` must be read before rejecting units below month.
- The polyfill does not intend to fix all host Intl non-compliance. The goal is
  good-enough Intl behavior, especially preserving the shapes of inputs and
  outputs for Temporal integration. Avoid papering over string-level Intl
  differences unless the fix is easy, local, and not a broad compatibility shim.


## Documentation / READMEs

When prose in one README mentions another package or topic that has its own
dedicated README (or docs page), link directly to that final-destination
README — do NOT link to an in-page section anchor that merely points onward to
it. Prefer the fewest hops to the canonical doc.

The one exception is a doc's own table-of-contents / "Contents" list and
intra-doc navigation, where in-page `#anchor` links are expected.


## Code Comments

Please add a healthy amount of comments to the code. With this temporal stuff,
small portions of code can back be packed with a lot of meaning.


## Bundle Size

Before making size-oriented changes, measure and record the baseline size first.

The size command depends on the `misc/export-size` submodule's built
output. Always build `export-size` first:

```
cd <repo-root>/misc/export-size
pnpm run build
```

Then measure from `polyfill`:

```
cd <repo-root>/polyfill
pnpm run size --raw
```

Use `pnpm run size --raw` for raw byte size. Do not run bare `pnpm run size`.
When reading `pnpm run size --raw` output, record only the minified global
bundle sizes from these lines:

```
Size of ./dist/.global.min.js ...
63043 → 20443

Size of ./dist/full/.global.min.js ...
72634 → 24247
```

In this example, record `20443, Full: 24247`. Ignore the later `export
min+gzip` table for size-audit entries.
