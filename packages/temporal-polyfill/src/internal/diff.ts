import { CalendarImpl } from './calendarImpl'
import { CalendarDateAddFunc, CalendarDateUntilFunc } from './calendarRecordTypes'
import { DayTimeNano, compareDayTimeNanos, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  DurationFieldsWithSign,
  durationFieldDefaults,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDurationInternals,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateFields, IsoTimeFields, pluckIsoTimeFields, IsoDateTimeFields, isoTimeFieldDefaults } from './isoFields'
import {
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
  moveByIsoDays,
} from './isoMath'
import { moveDateTime, moveZonedEpochNano } from './move'
import { DiffOptions, LargestUnitOptions, RoundingMode, refineDiffOptions } from './options'
import { computeNanoInc, roundByInc, roundDayTimeNano, roundRelativeDuration } from './round'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneMath'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  milliInDay,
  nanoInUtcDay,
} from './units'
import { NumSign, divModTrunc, identityFunc } from './utils'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecordTypes'

// High-Level
// -------------------------------------------------------------------------------------------------
// the main value-add is doing negating and options-processing

export function diffPlainTimes(
  internals0: IsoTimeFields,
  internals1: IsoTimeFields,
  options: DiffOptions | undefined,
  invert?: boolean
): DurationFieldsWithSign {
  let durationInternals = updateDurationFieldsSign(
    diffTimes(
      internals0,
      internals1,
      ...(refineDiffOptions(invert, options, Unit.Hour, Unit.Hour) as [TimeUnit, TimeUnit, number, RoundingMode]),
    ),
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return durationInternals
}

export function diffInstants(
  epochNano0: DayTimeNano,
  epochNano1: DayTimeNano,
  options?: DiffOptions,
  invert?: boolean
): DurationFieldsWithSign {
  let durationInternals = updateDurationFieldsSign(
    diffEpochNano(
      epochNano0,
      epochNano1,
      ...(
        refineDiffOptions(invert, options, Unit.Second, Unit.Hour) as
          [TimeUnit, TimeUnit, number, RoundingMode]
      ),
    ),
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return durationInternals
}

// Dates & Times
// -------------------------------------------------------------------------------------------------

export function diffDateTimes(
  calendarRecord: { dateAdd: CalendarDateAddFunc, dateUntil: CalendarDateUntilFunc },
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
  origOptions?: LargestUnitOptions,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!

  if (largestUnit <= Unit.Day) {
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  }

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  let timeNano = endTimeNano - startTimeNano
  const timeSign = Math.sign(timeNano)

  // simulate startDate plus time fields (because that happens before adding date)
  let midIsoFields: IsoDateFields = startIsoFields

  // move start-fields forward so time-diff-sign matches date-diff-sign
  if (timeSign === -sign) {
    midIsoFields = moveByIsoDays(startIsoFields, sign)
    timeNano += nanoInUtcDay * sign
  }

  const dateDiff = calendarDateUntilEasy(
    calendarRecord,
    { ...midIsoFields, ...isoTimeFieldDefaults }, // hack
    { ...endIsoFields, ...isoTimeFieldDefaults }, // hack
    largestUnit,
    origOptions,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff },
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateTimeFields) => DayTimeNano, // markerToEpochNano -- TODO: better after removing `!`
    (m: IsoDateTimeFields, d: DurationFields) => moveDateTime(calendarRecord, m, d),
  )
}

export function diffDates(
  calendarRecord: { dateAdd: CalendarDateAddFunc, dateUntil: CalendarDateUntilFunc },
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
  origOptions?: LargestUnitOptions,
): DurationFields {
  const dateDiff = calendarDateUntilEasy(calendarRecord, startIsoFields, endIsoFields, largestUnit, origOptions)

  // fast path, no rounding
  // important for tests and custom calendars
  if (smallestUnit === Unit.Day && roundingInc === 1) {
    return dateDiff
  }

  return roundRelativeDuration(
    dateDiff,
    isoToEpochNano(endIsoFields)!,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateFields) => DayTimeNano, // markerToEpochNano
    (m: IsoDateFields, d: DurationFields) => calendarRecord.dateAdd(m, updateDurationFieldsSign(d)),
  )
}

function diffDays(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(startIsoFields)!,
    isoToEpochMilli(endIsoFields)!,
  )
}

/*
Used internally by Calendar!
*/
export function diffDatesExact(
  calendar: CalendarImpl,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(startIsoFields, endIsoFields)
    const sign = Math.sign(days) as NumSign

    if (largestUnit === Unit.Week) {
      [weeks, days] = divModTrunc(days, isoDaysInWeek)
    }

    return { ...durationFieldDefaults, weeks, days, sign }
  }

  const yearMonthDayStart = calendar.queryYearMonthDay(startIsoFields)
  const yearMonthDayEnd = calendar.queryYearMonthDay(endIsoFields)
  let [years, months, days, sign] = diffYearMonthDay(
    calendar,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

  if (largestUnit === Unit.Month) {
    months += calendar.queryMonthsInYearSpan(years, yearMonthDayStart[0])
    years = 0
  }

  return { ...durationFieldDefaults, years, months, days, sign }
}

export function diffTimes(
  startIsoFields: IsoTimeFields,
  endIsoFields: IsoTimeFields,
  largestUnit: TimeUnit,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  const timeNano = roundByInc(endTimeNano - startTimeNano, nanoInc, roundingMode)

  return {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeNano, largestUnit),
  }
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function diffZonedEpochNano<C, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  calendarSlot: C,
  timeZoneSlot: T,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
  origOptions?: LargestUnitOptions,
): DurationFields {
  if (largestUnit < Unit.Day) {
    // doesn't need timeZone
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  }

  const calendarRecord = getCalendarRecord(calendarSlot)
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return durationFieldDefaults
  }

  const startIsoFields = zonedEpochNanoToIso(timeZoneRecord, startEpochNano)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZoneRecord, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZoneRecord) // necessary to bind?
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNano = isoToZonedEpochNano(midIsoFields)
  let midSign = compareDayTimeNanos(endEpochNano, midEpochNano)

  // Might need multiple backoffs: one for simple time overage, other for end being in DST gap
  // TODO: use a do-while loop?
  while (midSign === -sign) {
    midIsoFields = {
      ...moveByIsoDays(midIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = isoToZonedEpochNano(midIsoFields)
    midSign = compareDayTimeNanos(endEpochNano, midEpochNano)
  }

  const dateDiff = calendarDateUntilEasy(calendarRecord, startIsoFields, midIsoFields, largestUnit, origOptions)
  const timeDiffNano = dayTimeNanoToNumber(diffDayTimeNanos(midEpochNano, endEpochNano)) // could be over 24 hour, so we need to consider day too
  const timeDiff = nanoToDurationTimeFields(timeDiffNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff },
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startEpochNano, // marker
    identityFunc, // markerToEpochNano
    // TODO: better way to bind
    (m: DayTimeNano, d: DurationFields) => moveZonedEpochNano(calendarRecord, timeZoneRecord, m, d),
  )
}

export function diffEpochNano(
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      roundDayTimeNano(
        diffDayTimeNanos(startEpochNano, endEpochNano),
        smallestUnit,
        roundingInc,
        roundingMode,
      ),
      largestUnit,
    ),
  }
}

/*
Must always be given start-of-day
*/
export function diffEpochMilliByDay( // TODO: rename diffEpochMilliDays?
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.round((epochMilli1 - epochMilli0) / milliInDay)
}

// Calendar Utils
// -------------------------------------------------------------------------------------------------

export function calendarDateUntilEasy(
  calendarRecord: { dateUntil: CalendarDateUntilFunc },
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit, // largeUnit
  origOptions?: LargestUnitOptions,
): DurationFieldsWithSign {
  if (largestUnit === Unit.Day) {
    return updateDurationFieldsSign({
      ...durationFieldDefaults,
      days: diffDays(isoDateFields0, isoDateFields1)
    })
  }
  return calendarRecord.dateUntil(isoDateFields0, isoDateFields1, largestUnit, origOptions)
}

function diffYearMonthDay(
  calendarImpl: CalendarImpl,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): [
  yearDiff: number,
  monthDiff: number,
  dayDiff: number,
  sign: NumSign,
] {
  let yearDiff!: number
  let monthsInYear1!: number
  let monthDiff!: number
  let daysInMonth1!: number
  let dayDiff!: number

  function updateYearMonth() {
    let [monthCodeNumber0, isLeapYear0] = calendarImpl.queryMonthCode(year0, month0)
    let [monthCodeNumber1, isLeapYear1] = calendarImpl.queryMonthCode(year1, month1)

    yearDiff = year1 - year0
    monthsInYear1 = calendarImpl.computeMonthsInYear(year1)
    monthDiff = yearDiff
      // crossing years
      ? (monthCodeNumber1 - monthCodeNumber0) || (Number(isLeapYear1) - Number(isLeapYear0))
      // same year
      : month1 - Math.min(month0, monthsInYear1)
  }

  function updateYearMonthDay() {
    updateYearMonth()
    daysInMonth1 = calendarImpl.queryDaysInMonth(year1, month1)
    dayDiff = day1 - Math.min(day0, daysInMonth1)
  }

  updateYearMonthDay()
  const daySign = Math.sign(dayDiff) as NumSign
  const sign = (Math.sign(yearDiff) || Math.sign(monthDiff) || daySign) as NumSign

  if (sign) {
    // overshooting day? correct by moving to penultimate month
    if (daySign === -sign) {
      const oldDaysInMonth1 = daysInMonth1
      ;([year1, month1] = calendarImpl.addMonths(year1, month1, -sign))
      updateYearMonthDay()
      dayDiff += sign < 0 // correct with days-in-month further in past
        ? -oldDaysInMonth1 // correcting from past -> future
        : daysInMonth1 // correcting from future -> past
    }

    // overshooting month? correct by moving to penultimate year
    const monthSign = Math.sign(monthDiff) as NumSign
    if (monthSign === -sign) {
      const oldMonthsInYear1 = monthsInYear1
      year1 -= sign
      updateYearMonth()
      monthDiff += sign < 0 // correct with months-in-year further in past
        ? -oldMonthsInYear1 // correcting from past -> future
        : monthsInYear1 // correcting from future -> past
    }
  }

  return [yearDiff, monthDiff, dayDiff, sign]
}

export function computeIsoMonthsInYearSpan(yearDelta: number): number {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(
  yearDelta: number,
  yearStart: number,
  calendarImpl: CalendarImpl,
): number {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = yearStart; year !== yearEnd; year += yearSign) {
    months += calendarImpl.computeMonthsInYear(year + yearCorrection)
  }

  return months
}
