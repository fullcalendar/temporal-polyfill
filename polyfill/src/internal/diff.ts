import {
  computeCalendarDateFields,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import { type CalendarImpl } from './calendarImpl'
import { DurationFields, durationFieldDefaults } from './durationFields'
import {
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochDays,
  isoDateToEpochNano,
} from './epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { diffIsoMonthSlots } from './isoCalendarMath'
import {
  moveDateByCalendarUnits,
  moveDateByDays,
  moveToStartOfMonth,
  resolveMonthInMovedYear,
} from './move'
import { Overflow, RoundingModeEnum } from './optionsModel'
import {
  createDateRelativeOps,
  createDateTimeRelativeOps,
  createZonedRelativeOps,
} from './relativeMath'
import {
  computeBigNanoInc,
  computeNanoInc,
  roundBigNanoToInc,
  roundRelativeDuration,
} from './round'
import { roundNumberToInc } from './roundNumber'
import { getCommonTimeZone } from './slotUtils'
import { ZonedEpochNanoFields } from './slots'
import { checkIsoDateInBounds } from './temporalLimits'
import { timeFieldsToNano } from './timeFieldMath'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { DayTimeUnit, TimeUnit, Unit, nanoInUtcDay } from './units'
import {
  NumberSign,
  compareBigInts,
  compareNumbers,
  divTrunc,
  modTrunc,
} from './utils'

// Pre-refined diff entry points
// -----------------------------------------------------------------------------
// Shared diff cores that receive fully refined settings, one per value kind.
// This keeps each public API's observable option access in its own wrapper
// while sharing all temporal arithmetic, range checks, and algorithm-dependent
// validation below.

export function diffZonedDateTimesRounded(
  calendar: CalendarImpl,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  return largestUnit < Unit.Day
    ? diffEpochNanosRounded(
        startZoned.epochNanoseconds,
        endZoned.epochNanoseconds,
        largestUnit as TimeUnit,
        smallestUnit as TimeUnit,
        roundingInc,
        roundingMode,
      )
    : diffZonedCalendarUnitsRounded(
        calendar,
        startZoned,
        endZoned,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
      )
}

export function diffDateTimesRounded(
  calendar: CalendarImpl,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  return largestUnit <= Unit.Day
    ? diffEpochNanosRounded(
        isoDateTimeToEpochNano(startIsoDateTime),
        isoDateTimeToEpochNano(endIsoDateTime),
        largestUnit as DayTimeUnit,
        smallestUnit as DayTimeUnit,
        roundingInc,
        roundingMode,
      )
    : diffDateTimeCalendarUnitsRounded(
        calendar,
        startIsoDateTime,
        endIsoDateTime,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
      )
}

export function diffYearMonthsRounded(
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const firstOfMonth0 = moveToStartOfMonth(calendar, startIsoDate)
  const firstOfMonth1 = moveToStartOfMonth(calendar, endIsoDate)

  // Short-circuit if exactly the same, before the in-bounds check below.
  if (!compareIsoDates(firstOfMonth0, firstOfMonth1)) {
    return durationFieldDefaults
  }

  return diffDateCalendarUnitsRounded(
    calendar,
    // The first-of-month must be representable, this check in-bounds
    checkIsoDateInBounds(firstOfMonth0),
    checkIsoDateInBounds(firstOfMonth1),
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    /* smallestPrecision = */ Unit.Month,
  )
}

export function diffDatesRounded(
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  smallestPrecision: Unit = Unit.Day,
): DurationFields {
  return largestUnit === Unit.Day
    ? diffEpochNanosRounded(
        isoDateToEpochNano(startIsoDate),
        isoDateToEpochNano(endIsoDate),
        largestUnit,
        smallestUnit as Unit.Day,
        roundingInc,
        roundingMode,
      )
    : diffDateCalendarUnitsRounded(
        calendar,
        startIsoDate,
        endIsoDate,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        smallestPrecision,
      )
}

export function diffTimesRounded(
  plainTimeSlots0: TimeFields,
  plainTimeSlots1: TimeFields,
  largestUnit: TimeUnit,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const timeDiffNano = roundNumberToInc(
    timeFieldsToNano(plainTimeSlots1) - timeFieldsToNano(plainTimeSlots0),
    computeNanoInc(smallestUnit, roundingInc),
    roundingMode,
  )
  const durationFields = {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeDiffNano, largestUnit),
  }
  return durationFields
}

// Rounded diff strategies
// -----------------------------------------------------------------------------
// Exact diff followed by rounding, split by unit kind: calendar units go
// through RelativeOps rounding, pure time units through epoch nanoseconds.
// (The func API's unit-specific diffs compose the exact diffs below directly.)

// Calendar-unit branch; no public options or direction.
export function diffZonedCalendarUnitsRounded(
  calendar: CalendarImpl,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  // Calendar units need one time zone, even when the instants are equal and the
  // answer would otherwise be zero, so check that first.
  const timeZone = getCommonTimeZone(startZoned.timeZone, endZoned.timeZone)
  const endEpochNano = endZoned.epochNanoseconds
  if (endEpochNano === startZoned.epochNanoseconds) {
    return durationFieldDefaults
  }
  let durationFields: DurationFields
  durationFields = diffZonedEpochsExact(
    timeZone,
    calendar,
    startZoned,
    endZoned,
    largestUnit,
  )
  durationFields = roundRelativeDuration(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    createZonedRelativeOps(calendar, timeZone, startZoned),
    true,
  )
  return durationFields
}

// Calendar-unit branch; no public options or direction.
export function diffDateTimeCalendarUnitsRounded(
  calendar: CalendarImpl,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const endEpochNano = isoDateTimeToEpochNano(endIsoDateTime)
  const sign = compareBigInts(
    endEpochNano,
    isoDateTimeToEpochNano(startIsoDateTime),
  )
  if (!sign) {
    return durationFieldDefaults
  }
  let durationFields: DurationFields
  durationFields = diffDateTimesBig(
    calendar,
    startIsoDateTime,
    endIsoDateTime,
    sign,
    largestUnit,
  )
  durationFields = roundRelativeDuration(
    durationFields,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    createDateTimeRelativeOps(calendar, startIsoDateTime),
  )
  return durationFields
}

// ISO date inputs; calendar units are resolved by the calendar implementation.
// Date-only precision can skip rounding, including YearMonth's month precision.
export function diffDateCalendarUnitsRounded(
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  smallestPrecision: Unit = Unit.Day,
): DurationFields {
  const endEpochNano = isoDateToEpochNano(endIsoDate)
  if (!compareIsoDates(startIsoDate, endIsoDate)) {
    return durationFieldDefaults
  }

  let durationFields: DurationFields
  durationFields = diffCalendarDates(
    calendar,
    startIsoDate,
    endIsoDate,
    largestUnit,
  )
  if (!(smallestUnit === smallestPrecision && roundingInc === 1)) {
    durationFields = roundRelativeDuration(
      durationFields,
      endEpochNano,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      createDateRelativeOps(calendar, startIsoDate),
    )
  }
  return durationFields
}

export function diffEpochNanosRounded(
  startEpochNano: bigint,
  endEpochNano: bigint,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      roundBigNanoToInc(
        endEpochNano - startEpochNano,
        computeBigNanoInc(smallestUnit, roundingInc),
        roundingMode,
      ),
      largestUnit,
    ),
  }
}

// Exact date-time diff dispatch
// -----------------------------------------------------------------------------
// Unrounded diffs for zoned and plain date-times. Sub-day largest units are a
// plain epoch subtraction; larger units decompose into date and time parts.

export function diffZonedEpochsExact(
  timeZone: TimeZone,
  calendar: CalendarImpl,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  largestUnit: Unit,
): DurationFields {
  if (largestUnit < Unit.Day) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        endZoned.epochNanoseconds - startZoned.epochNanoseconds,
        largestUnit as DayTimeUnit,
      ),
    }
  }

  return diffZonedDateParts(timeZone, startZoned, endZoned, (start, end) =>
    diffCalendarDates(calendar, start, end, largestUnit),
  )
}

export function diffDateTimesExact(
  calendar: CalendarImpl,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
): DurationFields {
  const startEpochNano = isoDateTimeToEpochNano(startIsoDateTime)
  const endEpochNano = isoDateTimeToEpochNano(endIsoDateTime)
  const sign = compareBigInts(endEpochNano, startEpochNano)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit <= Unit.Day) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        endEpochNano - startEpochNano,
        largestUnit as DayTimeUnit,
      ),
    }
  }

  return diffDateTimesBig(
    calendar,
    startIsoDateTime,
    endIsoDateTime,
    sign,
    largestUnit,
  )
}

// Date-time decomposition
// -----------------------------------------------------------------------------
// Split a date-time diff into a date diff plus a time remainder, correcting the
// intermediate date by a day when the wall-clock times conflict. The zoned
// variants also resolve the intermediate wall-clock through the time zone.

// Inputs carry valid epochs. Prepare wall-clock date parts once, then let the
// caller select calendar-month or day/week arithmetic for that interval.
export function diffZonedDateParts(
  timeZone: TimeZone,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  diffDate: (
    start: CalendarDateFields,
    end: CalendarDateFields,
  ) => DurationFields,
): DurationFields {
  const sign = compareBigInts(
    endZoned.epochNanoseconds,
    startZoned.epochNanoseconds,
  )
  if (!sign) {
    return durationFieldDefaults
  }

  // Same-date zoned diffs have no calendar date part. Keeping them as instant
  // diffs also avoids re-resolving an ambiguous repeated wall-clock time while
  // deriving the intermediate marker.
  const isoDateTime0 = zonedEpochSlotsToIso(startZoned)
  const isoDateTime1 = zonedEpochSlotsToIso(endZoned)
  if (!compareIsoDates(isoDateTime0, isoDateTime1)) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        endZoned.epochNanoseconds - startZoned.epochNanoseconds,
        Unit.Hour,
      ),
    }
  }

  const [startIsoDateTime, endIsoDate, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    startZoned,
    endZoned,
    sign,
  )
  const dateDiff = diffDate(startIsoDateTime, endIsoDate)

  return { ...dateDiff, ...nanoToDurationTimeFields(remainderNano) }
}

function diffDateTimesBig(
  calendar: CalendarImpl,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week
): DurationFields {
  let diffEndDate: CalendarDateFields = endIsoDateTime

  // If date/time diffs conflict, move intermediate date one day forward.
  let timeNano =
    timeFieldsToNano(endIsoDateTime) - timeFieldsToNano(startIsoDateTime)
  if (Math.sign(timeNano) === -sign) {
    diffEndDate = moveDateByDays(endIsoDateTime, -sign)
    timeNano += nanoInUtcDay * sign
  }

  const dateDiff = diffCalendarDates(
    calendar,
    startIsoDateTime,
    diffEndDate,
    largestUnit,
  )
  return { ...dateDiff, ...nanoToDurationTimeFields(timeNano) }
}

export function prepareZonedEpochDiff(
  timeZone: TimeZone,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  sign: -1 | 1,
): [CalendarDateTimeFields, CalendarDateFields, number] {
  const startIsoDate = zonedEpochSlotsToIso(startZoned)
  const endIsoDate = zonedEpochSlotsToIso(endZoned)
  const endEpochNano = endZoned.epochNanoseconds
  let dayCorrection = 0

  // If wall-clock will be overshot, guaranteed 1-day correction
  const timeDiffNano =
    timeFieldsToNano(endIsoDate) - timeFieldsToNano(startIsoDate)
  const timeSign = Math.sign(timeDiffNano)
  if (timeSign === -sign) {
    dayCorrection++
  }

  // Date-only units land on the end date with the start time, which can still
  // overshoot after the wall-clock correction above. Going backward, the marker
  // can resolve to the earlier occurrence of a repeated hour. Going forward, a
  // compatible DST push-forward can move the marker past the end. These limits
  // are absolute, so they include any correction already applied above.
  const maxDayCorrection = sign > 0 ? 2 : 1

  // The condition-less `for` lets TypeScript see that the final candidate is
  // returned unconditionally, so the result type needs no `undefined`.
  for (; ; dayCorrection++) {
    const midIsoDate = moveDateByDays(endIsoDate, dayCorrection * -sign)
    const midEpochNano = getSingleInstantFor(
      timeZone,
      combineDateAndTime(midIsoDate, startIsoDate),
    )

    if (
      dayCorrection === maxDayCorrection ||
      compareBigInts(endEpochNano, midEpochNano) !== -sign
    ) {
      const remainderNano = Number(endEpochNano - midEpochNano)
      return [startIsoDate, midIsoDate, remainderNano]
    }
  }
}

// Exact date and uniform-interval arithmetic
// -----------------------------------------------------------------------------
// Date-only diffing. Calendar units delegate to the calendar implementation;
// day/week units balance an elapsed interval without calendar arithmetic.

// Calendar-unit diffs follow CalendarDateUntil and NonISODateUntil, which
// count whole years, then whole months, one candidate at a time until the next
// candidate would "surpass" the end date (NonISODateSurpasses). The counts are
// computed here in closed form instead: start from the difference between the
// end's and start's fields, then back off by one toward zero if that
// overshoots. One back-off is always enough, because the backed-off count
// lands in a year or month strictly before the end's, in the direction of the
// diff. The leftover days are counted from the date reached by adding those
// years and months with overflow constrain.
export function diffCalendarDates(
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit, // TODO: put this arg after calendar to allow for bindArgs?
): DurationFields {
  if (largestUnit <= Unit.Week) {
    return diffDatesByDayWeekUnit(
      largestUnit === Unit.Week,
      startIsoDate,
      endIsoDate,
    )
  }

  const sign = compareIsoDates(endIsoDate, startIsoDate)
  let years = 0
  let months = 0
  let days = 0

  if (sign) {
    const {
      year: year0,
      month: month0,
      day: day0,
    } = computeCalendarDateFields(calendar, startIsoDate)
    const {
      year: year1,
      month: month1,
      day: day1,
    } = computeCalendarDateFields(calendar, endIsoDate)
    // Orders the start's day-of-month against the end's. Every surpass check
    // falls back to this when the months it compares are equal.
    const dayOrder = compareNumbers(day0, day1)
    // The start's month in the year reached by adding the counted years
    let movedMonth = month0

    if (largestUnit === Unit.Year && (years = year1 - year0)) {
      const [monthCodeNumber0, isLeapMonth0] = computeCalendarMonthCodeParts(
        calendar,
        year0,
        month0,
      )
      const [monthCodeNumber1, isLeapMonth1] = computeCalendarMonthCodeParts(
        calendar,
        year1,
        month1,
      )
      movedMonth = resolveMonthInMovedYear(
        calendar,
        year1,
        monthCodeNumber0,
        isLeapMonth0,
        Overflow.Constrain,
      )

      // NonISODateSurpasses checks a candidate year count twice, and either
      // check can fail when the start is in a leap month the end's year lacks:
      // 1. By monthCode, in string order, which puts each leap month just
      //    after its common month (M04 < M04L < M05). Chinese M04L-10 does not
      //    reach M04-20 in a year without M04L, though its constrained month
      //    does.
      // 2. By the constrained ordinal month. Hebrew M05L-15 constrains to
      //    M06-15 in a common year, which passes M06-10, though M05L sorts
      //    before M06.
      if (
        sign *
          (compareNumbers(
            monthCodeNumber0 * 2 + Number(isLeapMonth0),
            monthCodeNumber1 * 2 + Number(isLeapMonth1),
          ) || dayOrder) >
          0 ||
        sign * (compareNumbers(movedMonth, month1) || dayOrder) > 0
      ) {
        years -= sign
        movedMonth = resolveMonthInMovedYear(
          calendar,
          year0 + years,
          monthCodeNumber0,
          isLeapMonth0,
          Overflow.Constrain,
        )
      }
    }

    // Count month slots, not monthCode numbers, so inserted leap months count.
    // Back off one month if the start's day is past the end's. That can't
    // happen when the slot count is zero, so the count never flips sign: with
    // years counted, the year check above ruled it out, and otherwise the
    // start and end share a month and the start comes first.
    months =
      (calendar
        ? calendar.diffMonthSlots(year0 + years, movedMonth, year1, month1)
        : diffIsoMonthSlots(year0 + years, movedMonth, year1, month1)) -
      (sign * dayOrder > 0 ? sign : 0)

    // Skip the move when there's nothing to add. Besides saving work, this
    // avoids reading the start month's length, which a host Intl can fail to
    // compute at the far end of its supported range.
    days = countIsoDays(
      years || months
        ? moveDateByCalendarUnits(
            calendar,
            startIsoDate,
            years,
            months,
            Overflow.Constrain,
          )
        : startIsoDate,
      endIsoDate,
    )
  }

  return { ...durationFieldDefaults, years, months, days }
}

// Diff in day/week units. Weeks are seven days, independently of the
// attached calendar, so this never consults the calendar implementation.
export function diffDatesByDayWeekUnit(
  asWeeks: boolean,
  start: CalendarDateFields,
  end: CalendarDateFields,
): DurationFields {
  const days = countIsoDays(start, end)
  return asWeeks
    ? {
        ...durationFieldDefaults,
        weeks: divTrunc(days, 7),
        days: modTrunc(days, 7),
      }
    : { ...durationFieldDefaults, days }
}

// Date comparison and day-count primitives
// -----------------------------------------------------------------------------
// Leaf helpers over ISO date fields that avoid epoch conversion.

// Local field comparison avoids converting edge-of-range dates to epoch time.
export function compareIsoDates(
  isoDate0: CalendarDateFields,
  isoDate1: CalendarDateFields,
): number {
  return (
    compareNumbers(isoDate0.year, isoDate1.year) ||
    compareNumbers(isoDate0.month, isoDate1.month) ||
    compareNumbers(isoDate0.day, isoDate1.day)
  )
}

/*
Partial days are trunc()'d
*/
function countIsoDays(
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
): number {
  return isoDateToEpochDays(endIsoDate) - isoDateToEpochDays(startIsoDate)
}
