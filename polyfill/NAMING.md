# Naming Conventions

Internal naming rules for `polyfill/src`. These apply to local variables,
function parameters, function names, type names, and source file names. They
do not apply to the public Temporal API surface, which is dictated by the spec.

The single overarching rule: **name a value for its shape and unit, not for its
role alone.** `epochNano`, not `epoch`. `isoDate`, not `fields`. `deltaNano`,
not `delta`. A reader should be able to tell what a value is without looking
at its type annotation.

## Contents

- [Shape words: iso, plain, zoned, slots, fields](#shape-words)
- [Unit suffixes](#unit-suffixes)
- [Numeric suffixes for pairs](#numeric-suffixes-for-pairs)
- [Start / end pairs](#start--end-pairs)
- [Parts vs args vs fields](#parts-vs-args-vs-fields)
- [The `Fields` suffix on types vs locals](#the-fields-suffix)
- [Calendar dispatch functions](#calendar-dispatch-functions)
- [Diff, move, and round function names](#diff-move-and-round-function-names)
- [The `Refined` marker](#the-refined-marker)
- [Merge phases](#merge-phases)
- [Option-name abbreviations](#option-name-abbreviations)
- [Option refiners with a positional unit](#option-refiners-with-a-positional-unit)
- [`Str` and `Name` constant suffixes](#str-and-name-constant-suffixes)
- [File names](#file-names)

## Shape words

Several prefixes describe *what kind of record* a value is. They stack with the
unit and numeric suffixes below.

| Prefix | Shape | Example locals |
| --- | --- | --- |
| `iso` | Bare ISO-8601 calendar fields, no calendar and no branding. Typed `CalendarDateFields`, `CalendarDateTimeFields`, or `TimeFields`. | `isoDate`, `isoDateTime`, `isoYear` |
| `plain` | The slots of a `Temporal.Plain*` value: ISO fields **plus** a `calendar`, and carrying the class's branding. Typed `PlainDateSlots` etc. | `plainDateSlots`, `plainTimeSlots0` |
| `zoned` | Anything tied to a time zone. Most often `ZonedEpochNanoFields`, an `epochNanoseconds` plus `timeZone`. | `zonedFields`, `startZoned` |
| `epoch` | An instant on the epoch timeline. **Always** carries a unit suffix. Never bare. | `epochNano`, `epochMilli`, `epochSec`, `epochDays` |
| `calendar` | A calendar-native value, as opposed to ISO. Used for years, months, and fields whose numbering depends on the calendar. | `calendarYear`, `calendarFields` |
| `slots` | The internal record behind a Temporal object, when the specific type is not important in context. | `slots`, `slots0` |

### When to say `plain`

`plain` is not a synonym for `iso`. It signals **a calendar is present**. If a
function takes `CalendarDateFields` and never looks at `.calendar`, call the
param `isoDate`. If it takes `PlainDateSlots` and uses the calendar, call it
`plainDateSlots` or just `slots`. Do not write `plainDate` for a bare
`CalendarDateFields`.

Time-only values are never ISO-specific, since time has no calendar. Use
`timeFields`, not `isoTime`.

### Never use bare `isoFields`

A value is always one of date, time, or dateTime. The name must say which:
`isoDate`, `isoDateTime`, or `timeFields`. A bare `isoFields` is a lint-by-eye
failure.

## Unit suffixes

Any scalar that measures time must carry its unit as a suffix:

- `Nano`, `Micro`, `Milli`, `Sec`, `Minutes`, `Hours`, `Days`
- Big values use `BigNano` (a `bigint` of nanoseconds).

This applies to locals, params, and function names alike:

```ts
moveEpochNanoByNano(epochNano, deltaNano)
isoDateToEpochDays(isoDate)
timeFieldsToNano(timeFields)
```

A bare `epoch`, `delta`, `offset`, or `diff` holding a number is wrong unless it
is genuinely unitless. The one legitimate bare `epoch` is in the exotic
calendars, where `epoch: number` is a calendar's Julian Day epoch, which is the
correct calendrical sense of the word.

## Numeric suffixes for pairs

When a function handles two values of the same kind, suffix them `0` and `1`,
not `a`/`b` and not `first`/`second`:

```ts
compareIsoDateFields(isoDate0, isoDate1)
const epochNano0 = ...
const epochNano1 = ...
```

The suffix combines with whatever stem is correct for the shape: `isoDate0`,
`isoDateTime1`, `epochNano0`, `slots1`, `record0`. The `0`/`1` convention maps
onto left/right or start/end without committing to which, which is what you
want in compare and diff code.

## Start / end pairs

When the two values are genuinely a start and an end, and especially when they
have **different shapes**, prefer `start`/`end` over `0`/`1`:

```ts
const [startIsoDateTime, endIsoDate, remainderNano] = prepareZonedEpochDiff(...)
```

The `start`/`end` prefix combines with the same shape and unit stems:
`startEpochNano`, `endIsoDate`, `startIsoDateTime`, `endEpochSec`.

`startZoned`/`endZoned` is the current name for a `ZonedEpochNanoFields` pair.
It is accepted but vaguer than its siblings. If it is ever renamed, the
consistent choice is `startZonedEpochNano`/`endZonedEpochNano`.

## Parts vs args vs fields

Three words for "the pieces of a date," each meaning something different:

| Word | Meaning | Example |
| --- | --- | --- |
| `fields` / a shape noun | An **object** with named properties. | `isoDate`, `timeFields`, `durationFields` |
| `parts` | **Positional numbers**: `(year, month, day)` passed as separate arguments or returned as a tuple. Tuple types take the suffix too: `MonthCodeParts`. | `isoPartsToEpochDays(year, month, day)`, `computeIsoFieldsFromParts`, `monthCodeParts` |
| `args` | Literal **function or constructor arguments**, almost always for Intl or `bindArgs`. Never used to mean "positional date pieces." | `intlFormatArgs`, `bindArgs`, `getArgsForRange` |

So a function pair converting between the two forms reads as
`isoDateToEpochDays(isoDate)` versus `isoPartsToEpochDays(year, month, day)`.

`parts` is mildly overloaded by the Intl sense (`formatToParts`, `intlParts`),
but the `From`/`To` position in the function name disambiguates. Do not invent
a third term.

## The `Fields` suffix

**On type names, keep it.** `CalendarDateFields`, `TimeFields`,
`DurationFields`, `ZonedEpochNanoFields`. The suffix says "this is a plain
record, not a class instance."

**On locals and params, drop it** when a shape prefix already carries the
meaning. The type annotation already says `Fields`. Repeating it on every
variable is noise:

| Prefer | Over |
| --- | --- |
| `isoDate` | `isoDateFields` |
| `isoDateTime` | `isoDateTimeFields` |
| `timeFields` | `isoTimeFields`, `time` |
| `durationFields` | `duration` |

The exceptions are shapes that would be ambiguous without it: `timeFields`
(because `time` reads as a scalar), `durationFields` (because `duration` reads
as a `Temporal.Duration` instance), and `zonedFields`.

**On function names, keep it where it disambiguates** from a class-instance or
slots variant: `compareIsoDateFields`, `validateIsoDateFields`,
`formatIsoDateFields`. It may be dropped where there is no collision.

## Calendar dispatch functions

There are three tiers per calendar concept, and the name says which tier you
are holding:

| Tier | Naming | Where |
| --- | --- | --- |
| ISO-only math | `computeIsoX` | `isoCalendarMath.ts` |
| Calendar impl method | `calendar.computeX(...)` | `calendarImpl.ts` and the exotic calendars |
| Null-safe dispatcher | `computeCalendarX(calendar, ...)` | `calendarDerived.ts` |

The dispatcher takes a possibly-null `CalendarImpl` (null means ISO) and picks
between the impl method and the ISO fallback. **Keep the `Calendar` qualifier
in the dispatcher's name.** Dropping it to `computeX` would collide with the
impl method name, which hurts both readability at call sites and grep-driven
renames.

If the length ever becomes a problem, change the verb rather than dropping the
qualifier, for example `deriveX`, and record the new rule here.

## Diff, move, and round function names

### The unit in the name is the unit of the result

For the functional API and `apiHelpers`:

- `diff(a, b)` returns a **Duration**. The word "duration" is implied and
  omitted.
- `diffDays(a, b)`, `diffMonths(a, b)`, `diffHours(a, b)` return a **number** in
  the named unit. The `apiHelpers` forms put the input shape first:
  `diffDateDays`, `diffDateTimeWeeks`.
- `roundToDay`, `roundToMonth`, `roundToYear` round **to** the named unit.
- `addDays`, `subtractMonths` move **by** a number of the named unit.

So the rule is: if the function deals in a Duration, say nothing. If it deals
in any single unit, put that unit in the name.

### Internal: `diff` returns fields, `count` returns a number

Inside `internal/`, `diff*` always returns `DurationFields`. A helper that
returns a bare number of units is a `count*`, shaped `count<Shape><Unit>`:

```
countIsoDays(startIsoDate, endIsoDate)          fixed unit, plural
countEpochNanoDays(startEpochNano, endEpochNano)
countEpochNanoUnit(start, end, unit, ...)       unit is a parameter: bare `Unit`
countZonedDayWeekUnit(unit, ...)                unit kind plus bare `Unit`
countRelativeUnit(unit, relativeUnitDiff, ...)
```

The shape is a singular adjective (`Iso`, `EpochNano`, `Zoned`), and the unit
comes last, plural when it is fixed and bare `Unit` when it is passed in,
optionally preceded by the unit kind (`DayWeekUnit`).

A function name carries **one active verb**. `computeEpochNanoUnitDiff` was
wrong twice over: `compute` was a verb standing in as a layer marker, and
`Diff` was the real verb demoted to a noun. Two older scalar helpers keep the
`diff` verb because the unit is in the name and they predate the rule:
`diffEpochMilliDays` and `diffIsoMonthSlots`. Do not add more.

### Internal diff shapes

Internal diff helpers put the **input shape** after the verb, pluralized when
the function takes two of that shape, and the **strategy** after that. There
are three layers:

```
Entry layer (options already refined; always Rounded)
  diff<Shape>sRounded                 diffDatesRounded, diffZonedDateTimesRounded, diffTimesRounded

Strategy layer (split by unit kind)
  diff<Shape><UnitKind>UnitsRounded   diffZonedCalendarUnitsRounded, diffDateCalendarUnitsRounded
  diff<Shape>sBy<UnitKind>Unit        diffDatesByDayWeekUnit, diffEpochNanosByDayWeekUnit

Exact layer (unrounded, only where a Rounded sibling exists)
  diff<Shape>sExact                   diffDateTimesExact, diffZonedEpochsExact
```

The unit kinds are `Calendar` (year, month), `DayWeek` (day, week; typed
`DayWeekUnit` in `units.ts`), and `Time` (hour and smaller).

**Every entry-layer diff carries `Rounded`**, whether or not an `Exact`
sibling exists. `diffDatesRounded` and `diffTimesRounded` have no exact
variant and are still suffixed. `Exact` appears only when there is a
`Rounded` sibling to distinguish it from.

### Internal move shapes

Movers come in two families, told apart by the presence of `By`:

```
move<Shape>                         moveDate, moveDateTime, moveTime, moveEpochNano
move<Shape>By<Unit>                 moveDateByDays, moveTimeByNano, moveEpochNanoByNano
move<Shape>By<UnitKind>Units        moveDateByCalendarUnits, moveDateByDayWeekUnits
add<Thing>                          addCalendarMonths
moveTo<Boundary>                    moveToStartOfMonth
moveTo[Refined]<Ordinal>            moveToRefinedDayOfWeek (internal), moveToDayOfWeek (apiHelpers)
round<Shape>To<Target>              roundDateTimeToInc, roundZonedEpochToDay
```

- Bare `move<Shape>` takes `DurationFields` and applies all of them.
- `move<Shape>By<...>` takes one or more **numeric counts** in the named units.
- `add<Thing>` is numbers in, numbers out, with no fields on either side.
- An **ordinal** is a 1-based coordinate within a containing period: day of
  the year, day of the month, day of the week, week of the year.
  `moveTo<Ordinal>` moves a date so that ordinal equals a requested value.
  The word "position" is retired for this; do not reintroduce it.
- `ToInc` marks a rounder that takes an already-computed nanosecond increment
  rather than a unit.

## The `Refined` marker

`Refined` in a name marks the boundary between `apiHelpers` and `internal`.
An `internal` function whose arguments are already coerced integers and
parsed option enums says so: `moveToRefinedDayOfYear`,
`createDateFromRefinedFields`, `slotsFromRefinedFields.ts`. The `apiHelpers`
wrapper with the same root and public-shaped arguments drops the word:
`moveToDayOfYear`. Only use `Refined` where such a pair exists or where the
function's contract is "the caller has already done the observable reads."

## Merge phases

Field-update (`with`) pipelines run in two phases with distinct verbs:

1. `merge<Shape>Fields` combines existing slots with the caller's bag and
   returns plain fields (`mergeDateFields`, `mergeZonedDateTimeFields`).
2. `create<Shape>FromMergedFields` builds slots from those fields after the
   caller has read its options (`createDateTimeFromMergedFields`).

When a merge returns a tuple, the merged all-fields object comes first and the
calendar-only fields second.

## Option-name abbreviations

Options are plucked in alphabetical order of their **real** option names under
a `// alphabetical` comment. Some locals abbreviate the real name for
readability. Where the coerce function does not make the real name obvious,
add a trailing comment with the real name so the alphabetical claim can be
verified without opening `coerce.ts`:

```ts
// alphabetical
const calendarDisplay = coerceCalendarDisplay(options) // "calendarName"
const subsecDigits = coerceFractionalSecondDigits(options) // "fractionalSecondDigits"
const offsetDisplay = coerceOffsetDisplay(options) // "offset"
const roundingMode = coerceRoundingMode(options, RoundingModeEnum.Trunc)
const smallestUnit = coerceSmallestUnit(options)
const timeZoneDisplay = coerceTimeZoneDisplay(options) // "timeZoneName"
```

Skip the comment when the coerce function already spells the option out
(`coerceRoundingMode`, `coerceSmallestUnit`).

Known abbreviations:

| Local | Real option |
| --- | --- |
| `subsecDigits` | `fractionalSecondDigits` |
| `roundingInc` | `roundingIncrement` |
| `epochDisambig` | `disambiguation` |
| `offsetDisambig` | `offset` (in `from` / `with` options) |
| `offsetDisplay` | `offset` (in `toString` options) |
| `calendarDisplay` | `calendarName` |
| `timeZoneDisplay` | `timeZoneName` |
| `totalUnit` | `unit` |

## Option refiners with a positional unit

Most refiners read `smallestUnit` from the bag. When the unit is instead fixed
by the calling function's name, as in the functional API's `roundToDay` or
`diffDays`, the refiner takes it as an argument and is qualified with `Unit`:
`refineUnitDiffOptions`, `refineUnitRoundOptions`. The qualifier says "the
unit is positional, not read from options." Do not name these after the
public method (`refineRoundToOptions`).

## `Str` and `Name` constant suffixes

String constants that hold a **property or option name** end in `Name`:
`roundingModeName`, `subsecDigitsName`, `relativeToName`. Some older ones end
in `Str` (`smallestUnitStr`, `largestUnitStr`, `totalUnitStr`). Both are in
use. Prefer `Name` for new option-name constants. Reserve `Str` for constants
that are string *content* rather than an identifier, such as `fractionRegExpStr`.

## File names

Files are named for the operation or concept they hold, verb first where the
contents are verbs: `diff.ts`, `move.ts`, `moveOrdinal.ts`, `withFields.ts`.

**`apiHelpers` files that wrap an `internal` file of the same root take a
`Helpers` suffix**, so the pair reads `../internal/move` beside
`./moveHelpers`: `diffHelpers`, `diffUnitHelpers`, `moveHelpers`,
`moveOrdinalHelpers`. Files in `apiHelpers` with no same-root twin stay
unsuffixed: `branding`, `classStyle`, `gettersForSlots`, `gettersForNative`,
`withFields`. Repeating a basename across the two directories is avoided for
grep and editor-tab reasons, not because it is ambiguous to the compiler.

**`options/` is a sibling of `internal/`, not a layer above or below it.** It
holds the files that read raw public option bags. `options/model.ts` is the
canonical home for every option enum and refined tuple type; `internal/` and
`apiHelpers/` import those types from there and never redeclare them. The
other files in that directory are the parsers that produce the enums, and
none of them exports a type.
