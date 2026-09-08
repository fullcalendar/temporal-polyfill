import {
  computeCalendarDateFields,
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYearForYear,
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
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { diffIsoMonthSlots } from './isoCalendarMath'
import {
  addCalendarMonths,
  addDateMonths,
  computeYearMovedMonth,
  moveByDays,
  moveToStartOfMonth,
} from './move'
import { Overflow, RoundingModeEnum } from './optionsModel'
import {
  createDateRelativeOps,
  createDateTimeRelativeOps,
  createPlainIsoOps,
  createZonedIsoOps,
  createZonedRelativeOps,
} from './relativeMath'
import {
  computeBigNanoInc,
  computeNanoInc,
  roundBigNanoToInc,
  roundNumberToInc,
  roundRelativeDuration,
} from './round'
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

// Shared diff cores receive fully refined settings. This keeps each public
// API's observable option access in its own wrapper while sharing all temporal
// arithmetic, range checks, and algorithm-dependent validation below it.
export function computeZonedDateTimeDiff(
  calendar: CalendarImpl,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  return largestUnit < Unit.Day
    ? diffEpochNanos(
        startZoned.epochNanoseconds,
        endZoned.epochNanoseconds,
        largestUnit as TimeUnit,
        smallestUnit as TimeUnit,
        roundingInc,
        roundingMode,
      )
    : computeZonedCalendarDiff(
        calendar,
        startZoned,
        endZoned,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
      )
}

export function computePlainDateTimeDiff(
  calendar: CalendarImpl,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  return largestUnit <= Unit.Day
    ? diffEpochNanos(
        isoDateTimeToEpochNano(startIsoDateTime),
        isoDateTimeToEpochNano(endIsoDateTime),
        largestUnit as DayTimeUnit,
        smallestUnit as DayTimeUnit,
        roundingInc,
        roundingMode,
      )
    : computeCalendarDateTimeDiff(
        calendar,
        startIsoDateTime,
        endIsoDateTime,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
      )
}

export function computePlainYearMonthDiff(
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
  if (!compareIsoDate(firstOfMonth0, firstOfMonth1)) {
    return durationFieldDefaults
  }

  return computeCalendarDateDiff(
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

export function computePlainDateDiff(
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
    ? diffEpochNanos(
        isoDateToEpochNano(startIsoDate),
        isoDateToEpochNano(endIsoDate),
        largestUnit,
        smallestUnit as Unit.Day,
        roundingInc,
        roundingMode,
      )
    : computeCalendarDateDiff(
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

export function computePlainTimeDiff(
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

// Rounded calendar and ISO diff strategies
// -----------------------------------------------------------------------------
// These pre-refined branches compose exact diffing with relative rounding and
// are shared by duration-returning and numeric unit-diff entry points.

// ISO date inputs; calendar units are resolved by the calendar implementation.
// Date-only precision can skip rounding, including YearMonth's month precision.
export function computeCalendarDateDiff(
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
  if (!compareIsoDate(startIsoDate, endIsoDate)) {
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

// Calendar-unit branch shared with fixed helpers; no public options or direction.
export function computeCalendarDateTimeDiff(
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

// Calendar-unit branch shared with fixed helpers; no public options or direction.
export function computeZonedCalendarDiff(
  calendar: CalendarImpl,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  largestUnit: Unit,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const endEpochNano = endZoned.epochNanoseconds
  if (endEpochNano === startZoned.epochNanoseconds) {
    return durationFieldDefaults
  }
  let durationFields: DurationFields
  const timeZone = getCommonTimeZone(startZoned.timeZone, endZoned.timeZone)
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

// Diff ISO dates in fixed day/week units while keeping epoch-based relative
// rounding internal to the duration-producing layer.
export function computeIsoDateDiff(
  unit: Unit.Day | Unit.Week,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const startEpochNano = isoDateToEpochNano(startIsoDate)
  const endEpochNano = isoDateToEpochNano(endIsoDate)
  const durationFields = diffIsoDates(
    unit === Unit.Week,
    startIsoDate,
    endIsoDate,
  )
  return endEpochNano === startEpochNano ||
    (smallestUnit === Unit.Day && roundingInc === 1)
    ? durationFields
    : roundRelativeDuration(
        durationFields,
        endEpochNano,
        unit,
        smallestUnit,
        roundingInc,
        roundingMode,
        createPlainIsoOps(combineDateAndTime(startIsoDate, timeFieldDefaults)),
      )
}

// Diff ISO date-times in fixed day/week units. Epoch nanoseconds are an
// implementation detail for uniform-day balancing and sub-day rounding.
export function computeIsoDateTimeDiff(
  unit: Unit.Day | Unit.Week,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const startEpochNano = isoDateTimeToEpochNano(startIsoDateTime)
  const endEpochNano = isoDateTimeToEpochNano(endIsoDateTime)

  if (endEpochNano === startEpochNano) {
    return durationFieldDefaults
  }
  if (unit === Unit.Day) {
    return diffEpochNanos(
      startEpochNano,
      endEpochNano,
      unit,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
    )
  }

  return roundRelativeDuration(
    diffIsoEpochs(unit, startEpochNano, endEpochNano),
    endEpochNano,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
    createPlainIsoOps(startIsoDateTime),
  )
}

// Zoned day/week differences use ISO date movement while retaining zoned
// relative rounding for variable-length local days.
export function computeZonedIsoDiff(
  unit: Unit.Day | Unit.Week,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  smallestUnit: Unit,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): DurationFields {
  const endEpochNano = endZoned.epochNanoseconds
  if (endEpochNano === startZoned.epochNanoseconds) {
    return durationFieldDefaults
  }

  const timeZone = getCommonTimeZone(startZoned.timeZone, endZoned.timeZone)
  return roundRelativeDuration(
    diffZonedDateParts(timeZone, startZoned, endZoned, (start, end) =>
      diffIsoDates(unit === Unit.Week, start, end),
    ),
    endEpochNano,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
    createZonedIsoOps(startZoned),
    true,
  )
}

// Exact structured diffing
// -----------------------------------------------------------------------------
// These operations balance dates and date-times without applying rounding.

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

// Inputs carry valid epochs. Prepare wall-clock date parts once, then let the
// caller select calendar-month or ISO day/week arithmetic for that interval.
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
  if (!compareIsoDate(isoDateTime0, isoDateTime1)) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        endZoned.epochNanoseconds - startZoned.epochNanoseconds,
        Unit.Hour,
      ),
    }
  }

  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    startZoned,
    endZoned,
    sign,
  )!
  const dateDiff = diffDate(isoFields0, isoFields1)

  return { ...dateDiff, ...nanoToDurationTimeFields(remainderNano) }
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
    diffEndDate = moveByDays(endIsoDateTime, -sign)
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

export function diffCalendarDates(
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit, // TODO: put this arg after calendar to allow for bindArgs?
): DurationFields {
  if (largestUnit <= Unit.Week) {
    return diffIsoDates(largestUnit === Unit.Week, startIsoDate, endIsoDate)
  }

  const yearMonthDayStart = computeCalendarDateFields(calendar, startIsoDate)
  const yearMonthDayEnd = computeCalendarDateFields(calendar, endIsoDate)

  if (largestUnit === Unit.Month) {
    const { year: year0, month: month0, day: day0 } = yearMonthDayStart
    const { year: year1, month: month1, day: day1 } = yearMonthDayEnd
    const sign = Math.sign(
      compareNumbers(year1, year0) ||
        compareNumbers(month1, month0) ||
        diffDays(startIsoDate, endIsoDate),
    )

    let months = 0
    let days = 0
    if (sign) {
      // Temporal counts concrete calendar month slots here, which matters for
      // lunisolar calendars with inserted leap months.
      months = calendar
        ? calendar.diffMonthSlots(year0, month0, year1, month1)
        : diffIsoMonthSlots(year0, month0, year1, month1)

      let anchorIsoDate = addDateMonths(
        calendar,
        startIsoDate,
        0,
        months,
        Overflow.Constrain,
      )

      // Back off a month if the anchor overshot the end. diffMonthSlots and
      // addMonths are exact inverses, so the anchor always lands in the end's
      // (year, month) — no need to compare those, only the day. Compare the
      // *original* start day, since a day clamped down by a shorter target
      // month isn't a real overshoot (this keeps e.g. a 30-day leap month
      // diffed against a 29-day one in its slot).
      if (sign * compareNumbers(day0, day1) > 0) {
        months -= sign
        anchorIsoDate = addDateMonths(
          calendar,
          startIsoDate,
          0,
          months,
          Overflow.Constrain,
        )
      }

      days = diffDays(anchorIsoDate, endIsoDate)
    }

    return { ...durationFieldDefaults, months, days }
  }

  const { year: year0, month: month0, day: day0 } = yearMonthDayStart
  let { year: year1, month: month1, day: day1 } = yearMonthDayEnd
  let yearDiff = year1 - year0
  let monthDiff = month1 - month0
  let dayDiff = day1 - day0

  if (yearDiff || monthDiff) {
    const sign = Math.sign(yearDiff || monthDiff)
    let daysInMonth1 = computeCalendarDaysInMonthForYearMonth(
      calendar,
      year1,
      month1,
    )
    let dayCorrect = 0

    // A constrained month move that would turn the original day into the last
    // day of a shorter month is not enough to earn a full month/year in a diff.
    // Compare against the original day, not the truncated target-month day.
    if (Math.sign(day1 - day0) === -sign) {
      const origDaysInMonth1 = daysInMonth1
      const yearMonthParts = addCalendarMonths(calendar, year1, month1, -sign)
      ;({ year: year1, month: month1 } = yearMonthParts)
      yearDiff = year1 - year0
      monthDiff = month1 - month0
      daysInMonth1 = computeCalendarDaysInMonthForYearMonth(
        calendar,
        year1,
        month1,
      )

      dayCorrect = sign < 0 ? -origDaysInMonth1 : daysInMonth1
    }

    const day0Trunc = Math.min(day0, daysInMonth1)
    dayDiff = day1 - day0Trunc + dayCorrect

    if (yearDiff) {
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
      const leapMonthMeta = calendar ? calendar.leapMonthMeta : undefined
      // Leap-month sources can constrain to common counterparts across a year
      // boundary; those asymmetric cases keep a zero month remainder here.
      monthDiff =
        leapMonthMeta !== undefined &&
        isLeapMonth0 &&
        !isLeapMonth1 &&
        (leapMonthMeta < 0
          ? sign > 0 && monthCodeNumber1 === -leapMonthMeta
          : sign < 0 && monthCodeNumber1 === monthCodeNumber0)
          ? 0
          : monthCodeNumber1 - monthCodeNumber0 ||
            Number(isLeapMonth1) - Number(isLeapMonth0)

      if (Math.sign(monthDiff) === -sign) {
        const monthCorrect =
          sign < 0 && -computeCalendarMonthsInYearForYear(calendar, year1)

        year1 -= sign
        yearDiff = year1 - year0

        const month0Trunc = computeYearMovedMonth(
          calendar,
          monthCodeNumber0,
          isLeapMonth0,
          calendar ? calendar.computeLeapMonth(year1) : undefined,
          Overflow.Constrain,
        )
        monthDiff =
          month1 -
          month0Trunc +
          (monthCorrect || computeCalendarMonthsInYearForYear(calendar, year1))
      } else if (calendar) {
        const month0Projected = computeYearMovedMonth(
          calendar,
          monthCodeNumber0,
          isLeapMonth0,
          calendar.computeLeapMonth(year1),
          Overflow.Constrain,
        )

        // Once the year portion is balanced, the month remainder is the
        // concrete number of calendar month slots between the source
        // month-code tuple as it would exist in the balanced year and the
        // target month. This matters for variable-leap calendars: M07 in a
        // year with an inserted M05L is ordinal month 8, so M01 - M07 is
        // seven month slots, not six month-code numbers.
        monthDiff = calendar.diffMonthSlots(
          year1,
          month0Projected,
          year1,
          month1,
        )
      }
    }
  }

  return {
    ...durationFieldDefaults,
    years: yearDiff,
    months: monthDiff,
    days: dayDiff,
  }
}

// Zoned diff preparation
// -----------------------------------------------------------------------------
// This lower layer derives the wall-clock anchor and elapsed remainder needed
// by exact zoned date-part diffing.

/*
HACK: callers should always assert defined result
*/
export function prepareZonedEpochDiff(
  timeZone: TimeZone,
  startZoned: ZonedEpochNanoFields,
  endZoned: ZonedEpochNanoFields,
  sign: -1 | 1,
): [CalendarDateTimeFields, CalendarDateFields, number] | undefined {
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

  // Date-only units land on the end date with the
  // start time. Around a compatible DST push-forward, forward differences can
  // overshoot once more after the plain wall-clock correction above, so only
  // that direction gets a single extra retry.
  const maxDayCorrection = dayCorrection + (sign > 0 ? 1 : 0)

  for (; dayCorrection <= maxDayCorrection; dayCorrection++) {
    const midIsoDate = moveByDays(endIsoDate, dayCorrection * -sign)
    const midEpochNano = getSingleInstantFor(
      timeZone,
      combineDateAndTime(midIsoDate, startIsoDate),
    )

    if (compareBigInts(endEpochNano, midEpochNano) !== -sign) {
      const remainderNano = Number(endEpochNano - midEpochNano)
      return [startIsoDate, midIsoDate, remainderNano]
    }
  }
}

// Uniform epoch and ISO diffing
// -----------------------------------------------------------------------------
// Fixed-length units bypass calendar arithmetic and work from elapsed epochs or
// ISO day counts.

export function diffEpochNanos(
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

// Balance a uniform elapsed interval without calendar arithmetic.
export function diffIsoEpochs(
  unit: Unit.Day | Unit.Week,
  startEpochNano: bigint,
  endEpochNano: bigint,
): DurationFields {
  const durationFields = {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(endEpochNano - startEpochNano, Unit.Day),
  }
  return unit === Unit.Week
    ? {
        ...durationFields,
        weeks: divTrunc(durationFields.days, 7),
        days: modTrunc(durationFields.days, 7),
      }
    : durationFields
}

// Diff in *iso-calendar-units* (day or week)
// ISO weeks are seven days, independently of the attached calendar.
export function diffIsoDates(
  asWeeks: boolean,
  start: CalendarDateFields,
  end: CalendarDateFields,
): DurationFields {
  const days = diffDays(start, end)
  return asWeeks
    ? {
        ...durationFieldDefaults,
        weeks: divTrunc(days, 7),
        days: modTrunc(days, 7),
      }
    : { ...durationFieldDefaults, days }
}

// Private date primitives
// -----------------------------------------------------------------------------
// Field comparisons and day counts form the bottom layer of structured diffs.

// Local field comparison avoids converting edge-of-range dates to epoch time.
function compareIsoDate(
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
function diffDays(
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
): number {
  return isoDateToEpochDays(endIsoDate) - isoDateToEpochDays(startIsoDate)
}
