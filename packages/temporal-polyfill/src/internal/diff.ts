import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from './bigNano'
import { getCalendarLeapMonthMeta, queryCalendarDay } from './calendarQuery'
import { isTimeZoneIdsEqual } from './compare'
import { DurationFields, durationFieldDefaults } from './durationFields'
import {
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  ExternalCalendar,
  getExternalCalendar,
  isCoreCalendarId,
} from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import {
  addIsoMonths,
  computeIsoDateFields,
  computeIsoDaysInMonth,
  computeIsoMonthCodeParts,
  diffIsoMonthSlots,
  isoMonthsInYear,
} from './isoMath'
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

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
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
    const isoDateTime0 = zonedEpochSlotsToIso(slots0, timeZoneImpl)
    const isoDateTime1 = zonedEpochSlotsToIso(slots1, timeZoneImpl)

    // During a fall-back transition, same-date wall-clock times can move in
    // the opposite direction from epoch time. Treat that as a pure time diff
    // to avoid mixed-sign calendar/time duration fields.
    if (
      isoDateTime0.year === isoDateTime1.year &&
      isoDateTime0.month === isoDateTime1.month &&
      isoDateTime0.day === isoDateTime1.day &&
      Math.sign(diffTimes(isoDateTime0, isoDateTime1)) === -sign
    ) {
      durationFields = diffEpochNanos(
        epochNano0,
        epochNano1,
        Unit.Hour,
        smallestUnit as TimeUnit,
        roundingInc,
        roundingMode,
      )
    } else {
      durationFields = diffZonedEpochsBig(
        calendarId,
        timeZoneImpl,
        slots0,
        slots1,
        sign,
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
        bindArgs(moveZonedEpochs, timeZoneImpl, calendarId) as MoveMarker,
      )
    }
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
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
      bindArgs(moveDateTime, calendarId) as MoveMarker,
    )
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
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
  const getDay = (isoDate: CalendarDateFields) =>
    queryCalendarDay(calendarId, isoDate)

  const firstOfMonth0 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots0)
  const firstOfMonth1 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots1)

  // Short-circuit if exactly the same (no in-bounds checking later)
  // HACK: not using compareIsoDateFields because choked when epochMillis out-of-bounds
  if (
    firstOfMonth0.year === firstOfMonth1.year &&
    firstOfMonth0.month === firstOfMonth1.month &&
    firstOfMonth0.day === firstOfMonth1.day
  ) {
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
    durationFields = diffCalendarDates(
      calendarId,
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
        bindArgs(moveDate, calendarId) as MoveMarker,
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

  // During a fall-back transition, same-date wall-clock times can move in
  // the opposite direction from epoch time. Treat that as a pure time diff
  // to avoid mixed-sign calendar/time duration fields.
  //
  // TODO: make DRY with diffZonedDateTimes
  //
  const isoDateTime0 = zonedEpochSlotsToIso(slots0, timeZoneImpl)
  const isoDateTime1 = zonedEpochSlotsToIso(slots1, timeZoneImpl)
  if (
    isoDateTime0.year === isoDateTime1.year &&
    isoDateTime0.month === isoDateTime1.month &&
    isoDateTime0.day === isoDateTime1.day &&
    Math.sign(diffTimes(isoDateTime0, isoDateTime1)) === -sign
  ) {
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
      : diffCalendarDates(calendarId, isoFields0, isoFields1, largestUnit)

  const timeDiff = nanoToDurationTimeFields(remainderNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
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
    calendarId,
    diffStartDate,
    diffEndDate,
    largestUnit,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
}

export function diffCalendarDates(
  calendarId: string,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  largestUnit: Unit,
): DurationFields {
  const externalCalendar = isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId)

  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(startIsoDate, endIsoDate)

    if (largestUnit === Unit.Week) {
      ;[weeks, days] = divModTrunc(days, 7)
    }

    return { ...durationFieldDefaults, weeks, days }
  }

  const yearMonthDayStart = externalCalendar
    ? externalCalendar.computeDateFields(startIsoDate)
    : computeIsoDateFields(startIsoDate)
  const yearMonthDayEnd = externalCalendar
    ? externalCalendar.computeDateFields(endIsoDate)
    : computeIsoDateFields(endIsoDate)

  if (largestUnit === Unit.Month) {
    const [months, days] = diffCalendarMonthDay(
      calendarId,
      externalCalendar,
      startIsoDate,
      endIsoDate,
      yearMonthDayStart,
      yearMonthDayEnd,
    )
    return { ...durationFieldDefaults, months, days }
  }

  const [years, months, days] = diffCalendarYearMonthDay(
    externalCalendar,
    yearMonthDayStart,
    yearMonthDayEnd,
  )

  return { ...durationFieldDefaults, years, months, days }
}

function diffCalendarMonthDay(
  calendarId: string,
  externalCalendar: ExternalCalendar | undefined,
  startIsoDate: CalendarDateFields,
  endIsoDate: CalendarDateFields,
  startCalendarDateFields: CalendarDateFields,
  endCalendarDateFields: CalendarDateFields,
): [monthDiff: number, dayDiff: number] {
  const { year: year0, month: month0, day: day0 } = startCalendarDateFields
  const { year: year1, month: month1, day: day1 } = endCalendarDateFields
  const sign = Math.sign(
    compareYearMonth(year1, month1, year0, month0) ||
      diffDays(startIsoDate, endIsoDate),
  )

  if (!sign) {
    return [0, 0]
  }

  // For largestUnit: "months", Temporal counts concrete calendar month slots.
  // In lunisolar calendars this must include inserted leap months instead of
  // collapsing everything to 12 month-code numbers per calendar year.
  let months = externalCalendar
    ? externalCalendar.diffMonthSlots(year0, month0, year1, month1)
    : diffIsoMonthSlots(year0, month0, year1, month1)

  let anchorIsoDate = epochMilliToIsoDateTime(
    addDateMonths(calendarId, startIsoDate, 0, months, Overflow.Constrain),
  )

  // If moving by the raw month-slot distance passes the end date, back off one
  // month. This deliberately uses the full date comparison, which avoids
  // treating a constrained 30th -> 29th move as a complete calendar month.
  const anchorCompare = compareIsoDate(anchorIsoDate, endIsoDate)
  const anchorCalendarDateFields = externalCalendar
    ? externalCalendar.computeDateFields(anchorIsoDate)
    : computeIsoDateFields(anchorIsoDate)
  if (
    anchorCompare === sign ||
    (anchorCompare === 0 &&
      anchorCalendarDateFields.day !== day0 &&
      !externalCalendar?.isConstrainedFinalIntercalaryMonthDiff(
        sign,
        year0,
        month0,
        day0,
        year1,
        month1,
        day1,
      ))
  ) {
    months -= sign
    anchorIsoDate = epochMilliToIsoDateTime(
      addDateMonths(calendarId, startIsoDate, 0, months, Overflow.Constrain),
    )
  }

  return [months, diffDays(anchorIsoDate, endIsoDate)]
}

// comparison util used ONLY in this file
function compareYearMonth(
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  return compareNumbers(year0, year1) || compareNumbers(month0, month1)
}

// comparison util used ONLY in this file
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
  externalCalendar: ExternalCalendar | undefined,
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
    let daysInMonth1 = externalCalendar
      ? externalCalendar.computeDaysInMonth(year1, month1)
      : computeIsoDaysInMonth(year1, month1)
    let dayCorrect = 0

    // A constrained month move that would turn the original day into the last
    // day of a shorter month is not enough to earn a full month/year in a diff.
    // Compare against the original day, not the truncated target-month day.
    if (Math.sign(day1 - day0) === -sign) {
      const origDaysInMonth1 = daysInMonth1
      const yearMonthParts = externalCalendar
        ? externalCalendar.addMonths(year1, month1, -sign)
        : addIsoMonths(year1, month1, -sign)
      ;({ year: year1, month: month1 } = yearMonthParts)
      yearDiff = year1 - year0
      monthDiff = month1 - month0
      daysInMonth1 = externalCalendar
        ? externalCalendar.computeDaysInMonth(year1, month1)
        : computeIsoDaysInMonth(year1, month1)

      dayCorrect = sign < 0 ? -origDaysInMonth1 : daysInMonth1
    }

    const day0Trunc = Math.min(day0, daysInMonth1)
    dayDiff = day1 - day0Trunc + dayCorrect

    if (yearDiff) {
      const [monthCodeNumber0, isLeapMonth0] = externalCalendar
        ? externalCalendar.computeMonthCodeParts(year0, month0)
        : computeIsoMonthCodeParts(month0)
      const [monthCodeNumber1, isLeapMonth1] = externalCalendar
        ? externalCalendar.computeMonthCodeParts(year1, month1)
        : computeIsoMonthCodeParts(month1)
      monthDiff = diffBalancedYearMonths(
        externalCalendar,
        sign,
        monthCodeNumber0,
        isLeapMonth0,
        monthCodeNumber1,
        isLeapMonth1,
      )

      if (Math.sign(monthDiff) === -sign) {
        const monthCorrect =
          sign < 0 &&
          -(externalCalendar
            ? externalCalendar.computeMonthsInYear(year1)
            : isoMonthsInYear)

        year1 -= sign
        yearDiff = year1 - year0

        const month0Trunc = computeYearMovedMonth(
          externalCalendar,
          monthCodeNumber0,
          isLeapMonth0,
          externalCalendar
            ? externalCalendar.computeLeapMonth(year1)
            : undefined,
          Overflow.Constrain,
        )
        monthDiff =
          month1 -
          month0Trunc +
          (monthCorrect ||
            (externalCalendar
              ? externalCalendar.computeMonthsInYear(year1)
              : isoMonthsInYear))
      } else if (externalCalendar) {
        const month0Projected = computeYearMovedMonth(
          externalCalendar,
          monthCodeNumber0,
          isLeapMonth0,
          externalCalendar.computeLeapMonth(year1),
          Overflow.Constrain,
        )

        // Once the year portion is balanced, the month remainder is the
        // concrete number of calendar month slots between the source
        // month-code tuple as it would exist in the balanced year and the
        // target month. This matters for variable-leap calendars: M07 in a
        // year with an inserted M05L is ordinal month 8, so M01 - M07 is
        // seven month slots, not six month-code numbers.
        monthDiff = externalCalendar.diffMonthSlots(
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
  externalCalendar: ExternalCalendar | undefined,
  sign: number,
  monthCodeNumber0: number,
  isLeapMonth0: boolean,
  monthCodeNumber1: number,
  isLeapMonth1: boolean,
): number {
  const leapMonthMeta = externalCalendar
    ? getCalendarLeapMonthMeta(externalCalendar.id)
    : undefined

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

  // The intermediate datetime after adding date-only units
  let midIsoDate: CalendarDateFields
  let midEpochNano: BigNano

  // Computes intermediate zdt after date-unit add
  // Returns `true` if the date-only adding overshot the end-point
  // Increments dayCorrection for next run
  function updateMid(): boolean {
    midIsoDate = moveByDays(endIsoDate, dayCorrection++ * -sign)
    midEpochNano = getSingleInstantFor(
      timeZoneImpl,
      combineDateAndTime(midIsoDate, startIsoDate),
    )
    return compareBigNanos(endEpochNano, midEpochNano) === -sign
  }

  if (updateMid()) {
    // Inconsistent date/time diffs
    // If moving forwards in time, DST might have shifted wall-clock time forward,
    // so try backing off one day.
    // If moving backwards in time, DST never shifts wall-clock backwards,
    // so we know for sure there's an error without backing off.
    if (sign === -1 || updateMid()) {
      throw new RangeError(errorMessages.invalidProtocolResults)
    }
  }

  const remainderNano = bigNanoToNumber(
    diffBigNanos(midEpochNano!, endEpochNano),
  )
  return [startIsoDate, midIsoDate!, remainderNano, startIsoDate]
}

export function prepareDateTimeDiff(
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
export function diffByDay(
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
export function diffDays(
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
