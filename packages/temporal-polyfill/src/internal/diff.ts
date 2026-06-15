import type { Temporal } from 'temporal-spec'
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
  negateDurationFields,
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
import { addIsoMonths, diffIsoMonthSlots } from './isoCalendarMath'
import {
  addDateMonths,
  computeYearMovedMonth,
  moveByDays,
  moveDate,
  moveDateTime,
  moveToStartOfMonth,
  moveZonedEpochSlots,
} from './move'
import { Overflow, RoundingModeEnum } from './optionsModel'
import { refineDiffOptions } from './optionsRoundingRefine'
import {
  MarkerToEpochNano,
  MoveMarker,
  createMarkerMoveOps,
} from './relativeMath'
import {
  computeBigNanoInc,
  computeNanoInc,
  roundBigNanoToInc,
  roundNumberToInc,
  roundRelativeDuration,
} from './round'
import { getCommonTimeZone } from './slotUtils'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDurationSlots,
  getEpochNano,
} from './slots'
import { checkIsoDateInBounds } from './temporalLimits'
import { timeFieldsToNano } from './timeFieldMath'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { DayTimeUnit, TimeUnit, Unit, nanoInUtcDay } from './units'
import {
  NumberSign,
  bindArgs,
  compareBigInts,
  compareNumbers,
  divTrunc,
  modTrunc,
} from './utils'

// High-level
// -----------------------------------------------------------------------------

export function diffInstants(
  invert: boolean,
  instantSlots0: EpochNanoFields,
  instantSlots1: EpochNanoFields,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Second, Unit.Hour) as [
      TimeUnit,
      TimeUnit,
      number,
      RoundingModeEnum,
    ]

  const durationFields = diffEpochNanos(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffZonedDateTimes(
  invert: boolean,
  calendar: CalendarImpl,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour)

  const epochNano0 = slots0.epochNanoseconds
  const epochNano1 = slots1.epochNanoseconds
  const sign = compareBigInts(epochNano1, epochNano0)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else if (largestUnit < Unit.Day) {
    durationFields = diffEpochNanos(
      epochNano0,
      epochNano1,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  } else {
    const timeZone = getCommonTimeZone(slots0.timeZone, slots1.timeZone)
    durationFields = diffZonedEpochsExact(
      timeZone,
      calendar,
      slots0,
      slots1,
      largestUnit,
    )

    durationFields = roundRelativeDuration(
      durationFields,
      epochNano1,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      createMarkerMoveOps(
        slots0,
        getEpochNano as MarkerToEpochNano,
        moveZonedEpochSlots as MoveMarker,
      ),
    )
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainDateTimes(
  invert: boolean,
  calendar: CalendarImpl,
  plainDateTimeSlots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  plainDateTimeSlots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day)

  const startEpochNano = isoDateTimeToEpochNano(plainDateTimeSlots0)
  const endEpochNano = isoDateTimeToEpochNano(plainDateTimeSlots1)
  const sign = compareBigInts(endEpochNano, startEpochNano)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else if (largestUnit <= Unit.Day) {
    durationFields = diffEpochNanos(
      startEpochNano,
      endEpochNano,
      largestUnit as DayTimeUnit,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
    )
  } else {
    durationFields = diffDateTimesBig(
      calendar,
      plainDateTimeSlots0,
      plainDateTimeSlots1,
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
      createMarkerMoveOps(
        plainDateTimeSlots0,
        isoDateTimeToEpochNano as MarkerToEpochNano,
        bindArgs(moveDateTime, calendar) as MoveMarker,
      ),
    )
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainDates(
  invert: boolean,
  calendar: CalendarImpl,
  plainDateSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainDateSlots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day, Unit.Year, Unit.Day)

  return diffDateLike(
    invert,
    calendar,
    plainDateSlots0,
    plainDateSlots1,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
}

export function diffPlainYearMonth(
  invert: boolean,
  calendar: CalendarImpl,
  plainYearMonthSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainYearMonthSlots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Year, Unit.Year, Unit.Month)
  const firstOfMonth0 = moveToStartOfMonth(calendar, plainYearMonthSlots0)
  const firstOfMonth1 = moveToStartOfMonth(calendar, plainYearMonthSlots1)

  // Short-circuit if exactly the same, before the in-bounds check below.
  if (!compareIsoDate(firstOfMonth0, firstOfMonth1)) {
    return createDurationSlots(durationFieldDefaults)
  }

  return diffDateLike(
    invert,
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

function diffDateLike(
  invert: boolean,
  calendar: CalendarImpl,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  smallestPrecision: Unit = Unit.Day,
): DurationFields & { sign: NumberSign } {
  const startEpochNano = isoDateToEpochNano(startIsoDate)
  const endEpochNano = isoDateToEpochNano(endIsoDate)
  const sign = compareBigInts(endEpochNano, startEpochNano)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else if (largestUnit === Unit.Day) {
    durationFields = diffEpochNanos(
      startEpochNano,
      endEpochNano,
      largestUnit,
      smallestUnit as Unit.Day,
      roundingInc,
      roundingMode,
    )
  } else {
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
        createMarkerMoveOps(
          startIsoDate,
          isoDateToEpochNano as MarkerToEpochNano,
          bindArgs(moveDate, calendar) as MoveMarker,
        ),
      )
    }
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainTimes(
  invert: boolean,
  plainTimeSlots0: TimeFields,
  plainTimeSlots1: TimeFields,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour, Unit.Hour)

  const timeDiffNano = roundNumberToInc(
    timeFieldsToNano(plainTimeSlots1) - timeFieldsToNano(plainTimeSlots0),
    computeNanoInc(smallestUnit as TimeUnit, roundingInc),
    roundingMode,
  )

  const durationFields = {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeDiffNano, largestUnit as TimeUnit),
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

// Exact Diffing (no rounding): Attempt small units, fallback to big units
// -----------------------------------------------------------------------------

export function diffZonedEpochsExact(
  timeZone: TimeZone,
  calendar: CalendarImpl,
  // wish these didn't also hold calendar
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  largestUnit: Unit,
): DurationFields {
  const sign = compareBigInts(slots1.epochNanoseconds, slots0.epochNanoseconds)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit < Unit.Day) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        slots1.epochNanoseconds - slots0.epochNanoseconds,
        largestUnit as DayTimeUnit,
      ),
    }
  }

  // Same-date zoned diffs have no calendar date part. Keeping them as instant
  // diffs also avoids re-resolving an ambiguous repeated wall-clock time while
  // deriving the intermediate marker.
  const isoDateTime0 = zonedEpochSlotsToIso(slots0)
  const isoDateTime1 = zonedEpochSlotsToIso(slots1)
  if (!compareIsoDate(isoDateTime0, isoDateTime1)) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        slots1.epochNanoseconds - slots0.epochNanoseconds,
        Unit.Hour,
      ),
    }
  }

  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    slots0,
    slots1,
    sign,
  )!
  const dateDiff =
    largestUnit === Unit.Day // TODO: use this optimization elsewhere too
      ? { ...durationFieldDefaults, days: diffDays(isoFields0, isoFields1) }
      : diffCalendarDates(calendar, isoFields0, isoFields1, largestUnit)

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

// Exact Diffing (no rounding): Big units (years/weeks/months/days?)
// -----------------------------------------------------------------------------

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
    const days = diffDays(startIsoDate, endIsoDate)

    if (largestUnit === Unit.Week) {
      return {
        ...durationFieldDefaults,
        weeks: divTrunc(days, 7),
        days: modTrunc(days, 7),
      }
    }

    return { ...durationFieldDefaults, days }
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
      const yearMonthParts = calendar
        ? calendar.addMonths(year1, month1, -sign)
        : addIsoMonths(year1, month1, -sign)
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

// Prepare
// -----------------------------------------------------------------------------

/*
HACK: callers should always assert defined result
*/
export function prepareZonedEpochDiff(
  timeZone: TimeZone,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  sign: NumberSign, // guaranteed non-zero
): [CalendarDateTimeFields, CalendarDateFields, number] | undefined {
  const startIsoDate = zonedEpochSlotsToIso(slots0)
  const endIsoDate = zonedEpochSlotsToIso(slots1)
  const endEpochNano = slots1.epochNanoseconds
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

// Diffing Via Epoch Nanoseconds
// -----------------------------------------------------------------------------

function diffEpochNanos(
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

/*
Partial days are trunc()'d
*/
function diffDays(
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
): number {
  return isoDateToEpochDays(endIsoDate) - isoDateToEpochDays(startIsoDate)
}
