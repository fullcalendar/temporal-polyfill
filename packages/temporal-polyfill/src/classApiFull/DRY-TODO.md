# DRY TODO: classApi and classApiFull

`classApiFull` intentionally duplicates `classApi` for now. The goal was to
make Intl calendar support an explicit entrypoint branch instead of a
side-effect import, while keeping the refactor easy to reason about.

## Current split

- `classApi` is the core branch. Calendar strings resolve only to the core
  internal calendar sentinels: ISO and Gregory.
- `classApiFull` is the full branch. Calendar strings resolve through
  `resolveFullCalendar`, which handles ISO, Gregory, and Intl-backed calendars.
- Shared internals should accept already-resolved `InternalCalendar` values when
  calendar behavior is involved. They should not decide whether a string
  calendar ID is core-only or full.

## Likely DRY path

1. Keep `calendarArg.ts` branch-local.
   This is the main policy boundary. Core and full intentionally answer
   calendar strings differently.

2. Keep `construct.ts` branch-local for now.
   These wrappers adapt public constructor calendar IDs to resolved internal
   calendars before calling `internal/construct.ts`. That keeps
   `internal/construct.ts` focused on validation and slot creation.

3. Merge duplicate Temporal type modules only after their calendar resolution
   dependency is injectable.
   Most files differ only in imports from `./calendarArg` and `./construct`.
   A future shared implementation could accept a small branch config:

   - calendar argument refinement
   - constructor slot wrappers
   - parse calendar resolver

4. Watch parse entrypoints.
   `from(...)` string paths call `parsePlainDate`, `parseZonedDateTime`, etc.
   Those parser calls should continue receiving an explicit resolver from the
   API branch.

5. Leave `intlDateTimeFormat.ts`, `intlExtended.ts`, and `intlFormatConfig.ts`
   as low-priority duplication.
   They are currently copied as-is. DRY-ing them is mostly mechanical and less
   important than the calendar argument and construction paths.

## Cleanup targets

- Remove duplicated method bodies once calendar policy can be injected cleanly.
- Prefer deleting newly-unused branch helpers immediately when inlining or
  merging code.
- Avoid reintroducing side-effect calendar registration or internal string
  calendar resolution.
