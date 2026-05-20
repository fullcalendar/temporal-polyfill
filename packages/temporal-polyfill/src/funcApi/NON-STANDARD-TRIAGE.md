# Non-Standard Functional API Follow-Up Triage

These are the behavior questions deferred while porting the non-standard
functional API surface into shim/native implementations.

## `temporal-utils` Behavior Gaps

- Confirm integer coercion and error types match the existing non-standard
  function API behavior.

## ZonedDateTime DST And Transitions

- Add parity cases around spring-forward gaps and fall-back repeated wall times.
- Cover date-based movement (`addDays`, `addWeeks`, `withDayOfWeek`) separately
  from exact-time movement (`addHours`, `addNanoseconds`).
- Cover `startOf*` and `endOf*` helpers on days with 23 or 25 hours.
- Cover zones whose transition happens near midnight, where start/end of day
  behavior is easiest to regress.

## Rounding Equivalence

- Compare current interval-based rounding against the `temporal-utils`
  `start.until(...).add(...)` strategy for year, month, and week.
- Include exact-boundary, before-midpoint, midpoint, and after-midpoint cases.
- Include ZonedDateTime cases where the interval contains a time-zone
  transition.

## Packaging And Bundle Shape

- Recheck `fns/*` bundle and declaration output once native files import
  `temporal-utils` for real.
- Measure size only if this becomes a size-oriented change.
