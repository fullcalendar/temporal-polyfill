# Intl.DateTimeFormat Islamic Fallback Removal Plan

## Context

The package currently patches one narrow `Intl.DateTimeFormat` compliance gap:
when native `Intl.DateTimeFormat#resolvedOptions().calendar` reports broad
fallback calendar IDs like `islamic` or `islamic-rgsa`, the polyfill probes host
formatting output and reports a concrete Temporal-compatible calendar such as
`islamic-civil`, `islamic-tbla`, or `islamic-umalqura`.

This makes these test262 checks pass:

- `intl402/DateTimeFormat/constructor-options-calendar-islamic-fallback.js`
- Temporal object formatting paths whose calendar compatibility checks depend
  on `Intl.DateTimeFormat` resolved calendar IDs.

We may later choose to stop patching this host `Intl.DateTimeFormat` behavior.
That would keep this polyfill focused on accepting Temporal objects in
`Intl.DateTimeFormat`, while leaving broader native Intl quirks untouched.

## Removal Scope

If we decide to remove the patch, remove these pieces together:

- Delete `src/externalCalendars/intlDateTimeFormat.ts`.
  This contains `resolveDateTimeFormatCalendarId`, the Islamic fallback probe
  dates, cache, and candidate calendar list.

- Update `src/externalCalendars/intlCalendarProvider.ts`.
  Remove the `resolveDateTimeFormatCalendarId` import and property from
  `intlCalendarProvider`.

- Update `src/internal/externalCalendar.ts`.
  Remove the optional `resolveDateTimeFormatCalendarId` provider hook.
  Remove `resolveExternalDateTimeFormatCalendarId`.
  Remove comments that distinguish the two provider calendar-resolution hooks.

- Update `src/internal/intlFormatPrep.ts`.
  Remove the `resolveExternalDateTimeFormatCalendarId` import.
  Remove `resolveDateTimeFormatResolvedOptions`.
  Change `createFormatPrepper` back to using `subformat.resolvedOptions()`
  directly.

- Update `src/classApi/intlDateTimeFormat.ts`.
  Remove the `resolveDateTimeFormatResolvedOptions` import.
  In `createResolvedOptionsMethod`, use `internals.rawFormat.resolvedOptions()`
  directly and keep only the existing `timeZone` repair behavior.
  In `createDateTimeFormatInternals`, use `rawFormat.resolvedOptions()`
  directly when copying resolved options and locale.

- Update `src/intl-calendars.test.ts`.
  Remove the regression test named
  `reports concrete DateTimeFormat fallbacks for islamic calendar aliases`.
  That test currently verifies both `Intl.DateTimeFormat(...).resolvedOptions()`
  and Temporal formatting with a concrete fallback calendar.

- Keep `src/impl.test.ts` without the old core fallback test.
  The fallback behavior should not move back into core coverage if we decide to
  stop patching it.

- Update `scripts/test262-config/expected-failures.txt`.
  Add `intl402/DateTimeFormat/constructor-options-calendar-islamic-fallback.js`
  as an intentional failure, with a comment explaining that the package does not
  normalize broad Islamic fallback calendar IDs from native
  `Intl.DateTimeFormat`.

## Expected Behavior After Removal

After removal, native `Intl.DateTimeFormat` output is allowed to surface
`islamic` or `islamic-rgsa` from `resolvedOptions().calendar` when the host does
so. Temporal calendar validation should still reject user-supplied fallback-only
calendar IDs where it already does today.

This means the DateTimeFormat Islamic fallback test becomes an expected failure,
rather than a behavior the polyfill actively repairs.

## Verification Checklist

After removing the patch:

- Run `pnpm run build`.
- Run `pnpm run lint`.
- Run the specific expected-failure candidate:
  `pnpm run test262 ../../test262/test/intl402/DateTimeFormat/constructor-options-calendar-islamic-fallback.js --no-max`
  and confirm it is reported as expected, not unexpected.
- Run `pnpm run test262 --no-max`.
- Run `pnpm run vitest`.

