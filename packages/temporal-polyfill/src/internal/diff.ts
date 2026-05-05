import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from './bigNano'
import {
  computeCalendarDateFields,
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import { isTimeZoneIdsEqual } from './compare'
import { DurationFields, durationFieldDefaults } from './durationFields'
import {
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { getInternalCalendar } from './externalCalendar'
import type { InternalCalendar } from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { addIsoMonths, diffIsoMonthSlots } from './isoMath'
import {
  addDateMonths,
  computeYearMovedMonth,
  moveByDays,
  moveDate,
  moveDateTime,
  moveToDayOfMonthUnsafe,
  moveZonedEpochs,
} from './move'
import { DiffOptions, Overflow, RoundingMode } from './optionsModel'
import { refineDiffOptions } from './optionsRoundingRefine'
import {
  MarkerToEpochNano,
  MoveMarker,
  isoMarkerToEpochNano,
} from './relativeMath'
import {
  computeNanoInc,
  roundBigNano,
  roundByInc,
  roundRelativeDuration,
} from './round'
import {
  DurationSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  ZonedEpochSlots,
  createDurationSlots,
  extractEpochNano,
} from './slots'
import {
  checkIsoDateInBounds,
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoDateTimeToEpochNano,
  isoDateToEpochMilli,
  isoToEpochNano,
  timeFieldsToNano,
} from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import {
  DateUnitName,
  DayTimeUnit,
  TimeUnit,
  TimeUnitName,
  Unit,
  UnitName,
  YearMonthUnitName,
  nanoInUtcDay,
} from './units'
import { NumberSign, bindArgs, compareNumbers, divModTrunc } from './utils'

/*
TODO: In many places, diffs are just meant to get sign, which can mostly be done canonically!
TODO: fix https://github.com/tc39/proposal-temporal/issues/3141#issuecomment-3230087875
*/

// High-level
// -----------------------------------------------------------------------------

export function diffInstants(
  invert: boolean,
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions<TimeUnitName>,
): DurationSlots {
  const optionsTuple = refineDiffOptions(
    invert,
    options,
    Unit.Second,
    Unit.Hour,
  ) as [TimeUnit, TimeUnit, number, RoundingMode]

  const durationFields = diffEpochNanos(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
    ...optionsTuple,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffZonedDateTimes(
  invert: boolean,
  slots0: ZonedDateTimeSlots,
  slots1: ZonedDateTimeSlots,
  options?: DiffOptions<UnitName>,
): DurationSlots {
  const calendarId = getCommonCalendarId(slots0.calendarId, slots1.calendarId)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour)

  const epochNano0 = slots0.epochNanoseconds
  const epochNano1 = slots1.epochNanoseconds
  const sign = compareBigNanos(epochNano1, epochNano0)
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
    const timeZoneId = getCommonTimeZoneId(slots0.timeZoneId, slots1.timeZoneId)
    const timeZoneImpl = queryTimeZone(timeZoneId)
    durationFields = diffZonedEpochsExact(
      timeZoneImpl,
      calendarId,
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
      slots0,
      extractEpochNano as MarkerToEpochNano,
      bindArgs(
        moveZonedEpochs,
        timeZoneImpl,
        getInternalCalendar(calendarId),
      ) as MoveMarker,
    )
  }

  return createDiffDurationSlots(invert, durationFields)
}

export function diffPlainDateTimes(
  invert: boolean,
  plainDateTimeSlots0: PlainDateTimeSlots,
  plainDateTimeSlots1: PlainDateTimeSlots,
  options?: DiffOptions<UnitName>,
): DurationSlots {
  const calendarId = getCommonCalendarId(
    plainDateTimeSlots0.calendarId,
    plainDateTimeSlots1.calendarId,
  )
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day)

  const startEpochNano = isoDateTimeToEpochNano(plainDateTimeSlots0)!
  const endEpochNano = isoDateTimeToEpochNano(plainDateTimeSlots1)!
  const sign = compareBigNanos(endEpochNano, startEpochNano)
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
      calendarId,
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
      plainDateTimeSlots0,
      isoMarkerToEpochNano as MarkerToEpochNano,
      bindArgs(moveDateTime, getInternalCalendar(calendarId)) as MoveMarker,
    )
  }

  return createDiffDurationSlots(invert, durationFields)
}

export function diffPlainDates(
  invert: boolean,
  plainDateSlots0: PlainDateSlots,
  plainDateSlots1: PlainDateSlots,
  options?: DiffOptions<DateUnitName>,
): DurationSlots {
  const calendarId = getCommonCalendarId(
    plainDateSlots0.calendarId,
    plainDateSlots1.calendarId,
  )
  const optionsTuple = refineDiffOptions(
    invert,
    options,
    Unit.Day,
    Unit.Year,
    Unit.Day,
  )

  return diffDateLike(
    invert,
    calendarId,
    plainDateSlots0,
    plainDateSlots1,
    ...optionsTuple,
  )
}

export function diffPlainYearMonth(
  invert: boolean,
  plainYearMonthSlots0: PlainYearMonthSlots,
  plainYearMonthSlots1: PlainYearMonthSlots,
  options?: DiffOptions<YearMonthUnitName>,
): DurationSlots {
  const calendarId = getCommonCalendarId(
    plainYearMonthSlots0.calendarId,
    plainYearMonthSlots1.calendarId,
  )
  const optionsTuple = refineDiffOptions(
    invert,
    options,
    Unit.Year,
    Unit.Year,
    Unit.Month,
  )
  const calendar = getInternalCalendar(calendarId)
  const getDay = (isoDate: CalendarDateFields) =>
    computeCalendarDateFields(calendar, isoDate).day

  const firstOfMonth0 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots0)
  const firstOfMonth1 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots1)

  // Short-circuit if exactly the same, before the in-bounds check below.
  if (!compareIsoDate(firstOfMonth0, firstOfMonth1)) {
    return createDurationSlots(durationFieldDefaults)
  }

  return diffDateLike(
    invert,
    calendarId,
    // The first-of-month must be representable, this check in-bounds
    checkIsoDateInBounds(firstOfMonth0),
    checkIsoDateInBounds(firstOfMonth1),
    ...optionsTuple,
    /* smallestPrecision = */ Unit.Month,
  )
}

function diffDateLike(
  invert: boolean,
  calendarId: string,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
  smallestPrecision: Unit = Unit.Day,
): DurationSlots {
  const startEpochNano = isoToEpochNano(startIsoDate)
  const endEpochNano = isoToEpochNano(endIsoDate)

  // TODO: best place to check range?
  if (startEpochNano === undefined || endEpochNano === undefined) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  const sign = compareBigNanos(endEpochNano, startEpochNano)
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
    const calendar = getInternalCalendar(calendarId)
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
        combineDateAndTime(startIsoDate, timeFieldDefaults),
        isoMarkerToEpochNano as MarkerToEpochNano,
        bindArgs(moveDate, calendar) as MoveMarker,
      )
    }
  }

  return createDiffDurationSlots(invert, durationFields)
}

export function diffPlainTimes(
  invert: boolean,
  plainTimeSlots0: TimeFields,
  plainTimeSlots1: TimeFields,
  options?: DiffOptions<TimeUnitName>,
): DurationSlots {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour, Unit.Hour)

  const timeDiffNano = roundByInc(
    diffTimes(plainTimeSlots0, plainTimeSlots1),
    computeNanoInc(smallestUnit as TimeUnit, roundingInc),
    roundingMode,
  )

  const durationFields = {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeDiffNano, largestUnit as TimeUnit),
  }

  return createDiffDurationSlots(invert, durationFields)
}

function createDiffDurationSlots(
  invert: boolean,
  durationFields: DurationFields,
): DurationSlots {
  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

// Exact Diffing (no rounding): Attempt small units, fallback to big units
// -----------------------------------------------------------------------------

export function diffZonedEpochsExact(
  timeZoneImpl: TimeZoneImpl,
  calendarId: string,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  largestUnit: Unit,
): DurationFields {
  const sign = compareBigNanos(slots1.epochNanoseconds, slots0.epochNanoseconds)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit < Unit.Day) {
    return diffEpochNanosExact(
      slots0.epochNanoseconds,
      slots1.epochNanoseconds,
      largestUnit as DayTimeUnit,
    )
  }

  // Same-date zoned diffs have no calendar date part. Keeping them as instant
  // diffs also avoids re-resolving an ambiguous repeated wall-clock time while
  // deriving the intermediate marker.
  const isoDateTime0 = zonedEpochSlotsToIso(slots0, timeZoneImpl)
  const isoDateTime1 = zonedEpochSlotsToIso(slots1, timeZoneImpl)
  if (!compareIsoDate(isoDateTime0, isoDateTime1)) {
    return diffEpochNanosExact(
      slots0.epochNanoseconds,
      slots1.epochNanoseconds,
      Unit.Hour,
    )
  }

  return diffZonedEpochsBig(
    calendarId,
    timeZoneImpl,
    slots0,
    slots1,
    sign,
    largestUnit,
  )
}

export function diffDateTimesExact(
  calendarId: string,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  largestUnit: Unit,
): DurationFields {
  const startEpochNano = isoDateTimeToEpochNano(startIsoDateTime)!
  const endEpochNano = isoDateTimeToEpochNano(endIsoDateTime)!
  const sign = compareBigNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit <= Unit.Day) {
    return diffEpochNanosExact(
      startEpochNano,
      endEpochNano,
      largestUnit as DayTimeUnit,
    )
  }

  return diffDateTimesBig(
    calendarId,
    startIsoDateTime,
    endIsoDateTime,
    sign,
    largestUnit,
  )
}

// Exact Diffing (no rounding): Big units (years/weeks/months/days?)
// -----------------------------------------------------------------------------

function diffZonedEpochsBig(
  calendarId: string,
  timeZoneImpl: TimeZoneImpl,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week/day
): DurationFields {
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZoneImpl,
    slots0,
    slots1,
    sign,
  )
  const dateDiff =
    largestUnit === Unit.Day // TODO: use this optimization elsewhere too
      ? diffByDay(isoFields0, isoFields1)
      : diffCalendarDates(
          getInternalCalendar(calendarId),
          isoFields0,
          isoFields1,
          largestUnit,
        )

  return { ...dateDiff, ...nanoToDurationTimeFields(remainderNano) }
}

function diffDateTimesBig(
  calendarId: string,
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week
): DurationFields {
  const [diffStartDate, diffEndDate, timeNano] = prepareDateTimeDiff(
    startIsoDateTime,
    endIsoDateTime,
    sign,
  )
  const dateDiff = diffCalendarDates(
    getInternalCalendar(calendarId),
    diffStartDate,
    diffEndDate,
    largestUnit,
  )
  return { ...dateDiff, ...nanoToDurationTimeFields(timeNano) }
}

export function diffCalendarDates(
  calendar: InternalCalendar,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit,
): DurationFields {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(startIsoDate, endIsoDate)

    if (largestUnit === Unit.Week) {
      ;[weeks, days] = divModTrunc(days, 7)
    }

    return { ...durationFieldDefaults, weeks, days }
  }

  const yearMonthDayStart = computeCalendarDateFields(calendar, startIsoDate)
  const yearMonthDayEnd = computeCalendarDateFields(calendar, endIsoDate)

  if (largestUnit === Unit.Month) {
    const [months, days] = diffCalendarMonthDay(
      calendar,
      startIsoDate,
      endIsoDate,
      yearMonthDayStart,
      yearMonthDayEnd,
    )
    return { ...durationFieldDefaults, months, days }
  }

  const [years, months, days] = diffCalendarYearMonthDay(
    calendar,
    yearMonthDayStart,
    yearMonthDayEnd,
  )

  return { ...durationFieldDefaults, years, months, days }
}

function diffCalendarMonthDay(
  calendar: InternalCalendar,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  startCalendarDateFields: CalendarDateFields,
  endCalendarDateFields: CalendarDateFields,
): [monthDiff: number, dayDiff: number] {
  const { year: year0, month: month0, day: day0 } = startCalendarDateFields
  const { year: year1, month: month1, day: day1 } = endCalendarDateFields
  const sign = Math.sign(
    compareNumbers(year1, year0) ||
      compareNumbers(month1, month0) ||
      diffDays(startIsoDate, endIsoDate),
  )

  if (!sign) {
    return [0, 0]
  }

  // For largestUnit: "months", Temporal counts concrete calendar month slots.
  // In lunisolar calendars this must include inserted leap months instead of
  // collapsing everything to 12 month-code numbers per calendar year.
  let months = calendar
    ? calendar.diffMonthSlots(year0, month0, year1, month1)
    : diffIsoMonthSlots(year0, month0, year1, month1)

  let anchorIsoDate = epochMilliToIsoDateTime(
    addDateMonths(calendar, startIsoDate, 0, months, Overflow.Constrain),
  )

  // If moving by the raw month-slot distance passes the end date, back off one
  // month. This deliberately uses the full date comparison, which avoids
  // treating a constrained 30th -> 29th move as a complete calendar month.
  const anchorCompare = compareIsoDate(anchorIsoDate, endIsoDate)
  if (
    anchorCompare === sign ||
    (anchorCompare === 0 &&
      computeCalendarDateFields(calendar, anchorIsoDate).day !== day0 &&
      !(
        calendar &&
        calendar.isConstrainedFinalIntercalaryMonthDiff(
          sign,
          year0,
          month0,
          day0,
          year1,
          month1,
          day1,
        )
      ))
  ) {
    months -= sign
    anchorIsoDate = epochMilliToIsoDateTime(
      addDateMonths(calendar, startIsoDate, 0, months, Overflow.Constrain),
    )
  }

  return [months, diffDays(anchorIsoDate, endIsoDate)]
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

function diffCalendarYearMonthDay(
  calendar: InternalCalendar,
  startCalendarDateFields: CalendarDateFields,
  endCalendarDateFields: CalendarDateFields,
): [yearDiff: number, monthDiff: number, dayDiff: number] {
  const { year: year0, month: month0, day: day0 } = startCalendarDateFields
  let { year: year1, month: month1, day: day1 } = endCalendarDateFields
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
      monthDiff = diffBalancedYearMonths(
        calendar,
        sign,
        monthCodeNumber0,
        isLeapMonth0,
        monthCodeNumber1,
        isLeapMonth1,
      )

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

  return [yearDiff, monthDiff, dayDiff]
}

function diffBalancedYearMonths(
  calendar: InternalCalendar,
  sign: number,
  monthCodeNumber0: number,
  isLeapMonth0: boolean,
  monthCodeNumber1: number,
  isLeapMonth1: boolean,
): number {
  const leapMonthMeta = calendar ? calendar.leapMonthMeta : undefined

  if (leapMonthMeta !== undefined && leapMonthMeta < 0) {
    const fixedLeapMonth = -leapMonthMeta

    // Hebrew-style calendars have a fixed leap month before a common-month
    // counterpart. A leap-month source constrains to that common counterpart
    // across a year boundary, but the reverse direction remains a month short.
    if (
      sign > 0 &&
      isLeapMonth0 &&
      !isLeapMonth1 &&
      monthCodeNumber1 === fixedLeapMonth
    ) {
      return 0
    }
  } else if (leapMonthMeta !== undefined) {
    if (
      sign < 0 &&
      isLeapMonth0 &&
      !isLeapMonth1 &&
      monthCodeNumber1 === monthCodeNumber0
    ) {
      return 0
    }
  }

  return (
    monthCodeNumber1 - monthCodeNumber0 ||
    Number(isLeapMonth1) - Number(isLeapMonth0)
  )
}

// Prepare
// -----------------------------------------------------------------------------

export function prepareZonedEpochDiff(
  timeZoneImpl: TimeZoneImpl,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
): [CalendarDateFields, CalendarDateFields, number, TimeFields] {
  const startIsoDate = zonedEpochSlotsToIso(slots0, timeZoneImpl)
  const endIsoDate = zonedEpochSlotsToIso(slots1, timeZoneImpl)
  const endEpochNano = slots1.epochNanoseconds
  let dayCorrection = 0

  // If wall-clock will be overshot, guaranteed 1-day correction
  const timeDiffNano = diffTimes(startIsoDate, endIsoDate)
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
      timeZoneImpl,
      combineDateAndTime(midIsoDate, startIsoDate),
    )

    if (compareBigNanos(endEpochNano, midEpochNano) !== -sign) {
      const remainderNano = bigNanoToNumber(
        diffBigNanos(midEpochNano, endEpochNano),
      )
      return [startIsoDate, midIsoDate, remainderNano, startIsoDate]
    }
  }

  throw new RangeError(errorMessages.invalidProtocolResults)
}

function prepareDateTimeDiff(
  startIsoDateTime: CalendarDateTimeFields,
  endIsoDateTime: CalendarDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
): [CalendarDateFields, CalendarDateFields, number] {
  let adjustedEndIsoDate: CalendarDateFields = endIsoDateTime

  // If date/time diffs conflict, move intermediate date one day forward
  let timeDiffNano = diffTimes(startIsoDateTime, endIsoDateTime)
  if (Math.sign(timeDiffNano) === -sign) {
    adjustedEndIsoDate = moveByDays(endIsoDateTime, -sign)
    timeDiffNano += nanoInUtcDay * sign
  }

  return [startIsoDateTime, adjustedEndIsoDate, timeDiffNano]
}

// Diffing Via Epoch Nanoseconds
// -----------------------------------------------------------------------------

function diffEpochNanos(
  startEpochNano: BigNano,
  endEpochNano: BigNano,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      roundBigNano(
        diffBigNanos(startEpochNano, endEpochNano),
        smallestUnit,
        roundingInc,
        roundingMode,
      ),
      largestUnit,
    ),
  }
}

function diffEpochNanosExact(
  startEpochNano: BigNano,
  endEpochNano: BigNano,
  largestUnit: DayTimeUnit,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      diffBigNanos(startEpochNano, endEpochNano),
      largestUnit as DayTimeUnit,
    ),
  }
}

/*
Partial days are trunc()'d
*/
function diffByDay(
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
): DurationFields {
  return {
    ...durationFieldDefaults,
    days: diffDays(startIsoDate, endIsoDate),
  }
}

/*
Partial days are trunc()'d
*/
function diffDays(
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
): number {
  return diffEpochMilliDays(
    isoDateToEpochMilli(startIsoDate)!,
    isoDateToEpochMilli(endIsoDate)!,
  )
}

function diffTimes(time0: TimeFields, time1: TimeFields): number {
  return timeFieldsToNano(time1) - timeFieldsToNano(time0)
}
// -----------------------------------------------------------------------------

export function getCommonCalendarId(a: string, b: string): string {
  if (a !== b) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }

  return a
}

export function getCommonTimeZoneId(a: string, b: string): string {
  if (!isTimeZoneIdsEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }

  return a
}
