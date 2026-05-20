# Non-Standard Functional API Catalog

This catalog lists the public functions in `src/funcApi/non-standard` that are
extra relative to the corresponding `src/funcApi/shim` entrypoints. Standard
Temporal-shaped functions such as `add`, `subtract`, `round`, `equals`,
`toString`, and construction/parsing helpers are intentionally omitted.

Abbreviations used below:

- `Record` is the record type exported by the file being cataloged.
- `OverflowOptions` is the calendar-field overflow options bag.
- `RoundOptions` is `RoundingModeName | RoundingMathOptions`.

## `plainDate.ts`

Temporal type: `PlainDate`.

### With Helpers

| Function | Abbreviated signature |
| --- | --- |
| `withDayOfYear` | `(record: Record, dayOfYear: number, options?: OverflowOptions) => Record` |
| `withDayOfMonth` | `(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record` |
| `withDayOfWeek` | `(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record` |
| `withWeekOfYear` | `(record: Record, weekOfYear: number, options?: OverflowOptions) => Record` |

### Unit Add Helpers

| Function | Abbreviated signature |
| --- | --- |
| `addYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `addMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `addWeeks` | `(record: Record, weeks: number) => Record` |
| `addDays` | `(record: Record, days: number) => Record` |

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, weeks: number) => Record` |
| `subtractDays` | `(record: Record, days: number) => Record` |

### Unit Round Helpers

| Function | Abbreviated signature |
| --- | --- |
| `roundToYear` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToMonth` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToWeek` | `(record: Record, options?: RoundOptions) => Record` |

### Start-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `startOfYear` | `(record: Record) => Record` |
| `startOfMonth` | `(record: Record) => Record` |
| `startOfWeek` | `(record: Record) => Record` |

### End-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `endOfYear` | `(record: Record) => Record` |
| `endOfMonth` | `(record: Record) => Record` |
| `endOfWeek` | `(record: Record) => Record` |

### Unit Difference Helpers

| Function | Abbreviated signature |
| --- | --- |
| `diffYears` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMonths` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffWeeks` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffDays` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |

## `plainDateTime.ts`

Temporal type: `PlainDateTime`.

### With Helpers

| Function | Abbreviated signature |
| --- | --- |
| `withDayOfYear` | `(record: Record, dayOfYear: number, options?: OverflowOptions) => Record` |
| `withDayOfMonth` | `(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record` |
| `withDayOfWeek` | `(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record` |
| `withWeekOfYear` | `(record: Record, weekOfYear: number, options?: OverflowOptions) => Record` |

### Unit Add Helpers

| Function | Abbreviated signature |
| --- | --- |
| `addYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `addMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `addWeeks` | `(record: Record, weeks: number) => Record` |
| `addDays` | `(record: Record, days: number) => Record` |
| `addHours` | `(record: Record, hours: number) => Record` |
| `addMinutes` | `(record: Record, minutes: number) => Record` |
| `addSeconds` | `(record: Record, seconds: number) => Record` |
| `addMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `addMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `addNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, weeks: number) => Record` |
| `subtractDays` | `(record: Record, days: number) => Record` |
| `subtractHours` | `(record: Record, hours: number) => Record` |
| `subtractMinutes` | `(record: Record, minutes: number) => Record` |
| `subtractSeconds` | `(record: Record, seconds: number) => Record` |
| `subtractMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `subtractMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `subtractNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Round Helpers

| Function | Abbreviated signature |
| --- | --- |
| `roundToYear` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToMonth` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToWeek` | `(record: Record, options?: RoundOptions) => Record` |

### Start-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `startOfYear` | `(record: Record) => Record` |
| `startOfMonth` | `(record: Record) => Record` |
| `startOfWeek` | `(record: Record) => Record` |
| `startOfDay` | `(record: Record) => Record` |
| `startOfHour` | `(record: Record) => Record` |
| `startOfMinute` | `(record: Record) => Record` |
| `startOfSecond` | `(record: Record) => Record` |
| `startOfMillisecond` | `(record: Record) => Record` |
| `startOfMicrosecond` | `(record: Record) => Record` |

### End-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `endOfYear` | `(record: Record) => Record` |
| `endOfMonth` | `(record: Record) => Record` |
| `endOfWeek` | `(record: Record) => Record` |
| `endOfDay` | `(record: Record) => Record` |
| `endOfHour` | `(record: Record) => Record` |
| `endOfMinute` | `(record: Record) => Record` |
| `endOfSecond` | `(record: Record) => Record` |
| `endOfMillisecond` | `(record: Record) => Record` |
| `endOfMicrosecond` | `(record: Record) => Record` |

### Unit Difference Helpers

| Function | Abbreviated signature |
| --- | --- |
| `diffYears` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMonths` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffWeeks` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffDays` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffHours` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMinutes` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffSeconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMilliseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMicroseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffNanoseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |

## `zonedDateTime.ts`

Temporal type: `ZonedDateTime`.

### With Helpers

| Function | Abbreviated signature |
| --- | --- |
| `withDayOfYear` | `(record: Record, dayOfYear: number, options?: OverflowOptions) => Record` |
| `withDayOfMonth` | `(record: Record, dayOfMonth: number, options?: OverflowOptions) => Record` |
| `withDayOfWeek` | `(record: Record, dayOfWeek: number, options?: OverflowOptions) => Record` |
| `withWeekOfYear` | `(record: Record, weekOfYear: number, options?: OverflowOptions) => Record` |

### Unit Add Helpers

| Function | Abbreviated signature |
| --- | --- |
| `addYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `addMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `addWeeks` | `(record: Record, weeks: number) => Record` |
| `addDays` | `(record: Record, days: number) => Record` |
| `addHours` | `(record: Record, hours: number) => Record` |
| `addMinutes` | `(record: Record, minutes: number) => Record` |
| `addSeconds` | `(record: Record, seconds: number) => Record` |
| `addMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `addMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `addNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Subtract Helpers

| Function | Abbreviated signature |
| --- | --- |
| `subtractYears` | `(record: Record, years: number, options?: OverflowOptions) => Record` |
| `subtractMonths` | `(record: Record, months: number, options?: OverflowOptions) => Record` |
| `subtractWeeks` | `(record: Record, weeks: number) => Record` |
| `subtractDays` | `(record: Record, days: number) => Record` |
| `subtractHours` | `(record: Record, hours: number) => Record` |
| `subtractMinutes` | `(record: Record, minutes: number) => Record` |
| `subtractSeconds` | `(record: Record, seconds: number) => Record` |
| `subtractMilliseconds` | `(record: Record, milliseconds: number) => Record` |
| `subtractMicroseconds` | `(record: Record, microseconds: number) => Record` |
| `subtractNanoseconds` | `(record: Record, nanoseconds: number) => Record` |

### Unit Round Helpers

| Function | Abbreviated signature |
| --- | --- |
| `roundToYear` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToMonth` | `(record: Record, options?: RoundOptions) => Record` |
| `roundToWeek` | `(record: Record, options?: RoundOptions) => Record` |

### Start-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `startOfYear` | `(record: Record) => Record` |
| `startOfMonth` | `(record: Record) => Record` |
| `startOfWeek` | `(record: Record) => Record` |
| `startOfHour` | `(record: Record) => Record` |
| `startOfMinute` | `(record: Record) => Record` |
| `startOfSecond` | `(record: Record) => Record` |
| `startOfMillisecond` | `(record: Record) => Record` |
| `startOfMicrosecond` | `(record: Record) => Record` |

### End-Of-Unit Helpers

| Function | Abbreviated signature |
| --- | --- |
| `endOfYear` | `(record: Record) => Record` |
| `endOfMonth` | `(record: Record) => Record` |
| `endOfWeek` | `(record: Record) => Record` |
| `endOfDay` | `(record: Record) => Record` |
| `endOfHour` | `(record: Record) => Record` |
| `endOfMinute` | `(record: Record) => Record` |
| `endOfSecond` | `(record: Record) => Record` |
| `endOfMillisecond` | `(record: Record) => Record` |
| `endOfMicrosecond` | `(record: Record) => Record` |

### Unit Difference Helpers

| Function | Abbreviated signature |
| --- | --- |
| `diffYears` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMonths` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffWeeks` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffDays` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffHours` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMinutes` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffSeconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMilliseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffMicroseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |
| `diffNanoseconds` | `(record0: Record, record1: Record, options?: RoundOptions) => number` |

## Files With No Extra Public Non-Standard Functions

These public non-standard entrypoints currently do not export functions beyond
their corresponding shim entrypoints:

- `duration.ts`
- `instant.ts`
- `plainMonthDay.ts`
- `plainTime.ts`
- `plainYearMonth.ts`
