import { CalendarImpl } from './calendarImpl'
import { CalendarOps } from './calendarOps'
import {
  DurationFields,
  DurationInternals,
  durationFieldDefaults,
  nanoToDurationFields,
  timeNanoToDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateFields, IsoTimeFields, pluckIsoTimeFields, IsoDateTimeFields } from './isoFields'
import {
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
} from './isoMath'
import { LargeInt, compareLargeInts } from './largeInt'
import { moveDateByDays, moveDateTime, moveZonedEpochNano } from './move'
import { Overflow, RoundingMode } from './options'
import { computeNanoInc, roundByInc, roundByIncLarge, roundRelativeDuration } from './round'
import { TimeZoneOps, getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  milliInDay,
  nanoInUtcDay,
} from './units'
import { NumSign, divModTrunc, identityFunc } from './utils'

// Dates & Times
// -------------------------------------------------------------------------------------------------

export function diffDateTimes(
  calendar: CalendarOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
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

  const sign = compareLargeInts(startEpochNano, endEpochNano)
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  let timeNano = endTimeNano - startTimeNano
  const timeSign = Math.sign(timeNano)
  let midIsoFields = startIsoFields

  // move start-fields forward so time-diff-sign matches date-diff-sign
  if (timeSign === -sign) {
    midIsoFields = {
      ...moveDateByDays(startIsoFields, sign),
      ...pluckIsoTimeFields(startIsoFields),
    }
    timeNano += nanoInUtcDay
  }

  const dateDiff = calendar.dateUntil(midIsoFields, endIsoFields, largestUnit)
  const timeDiff = timeNanoToDurationFields(timeNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff },
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateTimeFields) => LargeInt, // markerToEpochNano -- TODO: better after removing `!`
    // TODO: better way to bind w/o specifying Overflow
    (m: IsoDateTimeFields, d: DurationFields) => moveDateTime(calendar, m, d, Overflow.Constrain),
  )
}

export function diffDates(
  calendar: CalendarOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  const dateDiff = calendar.dateUntil(startIsoFields, endIsoFields, largestUnit)

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
    isoToEpochNano as (isoFields: IsoDateFields) => LargeInt, // markerToEpochNano
    // TODO: better way to bind w/o specifying Overflow
    (m: IsoDateFields, d: DurationFields) => calendar.dateAdd(m, updateDurationFieldsSign(d), Overflow.Constrain),
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
): DurationInternals {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffEpochMilliByDay(
      isoToEpochMilli(startIsoFields)!,
      isoToEpochMilli(endIsoFields)!,
    )
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
    ...timeNanoToDurationFields(timeNano, largestUnit),
  }
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function diffZonedEpochNano(
  calendar: CalendarOps,
  timeZone: TimeZoneOps,
  startEpochNano: LargeInt,
  endEpochNano: LargeInt,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
): DurationFields {
  if (largestUnit < Unit.Day) {
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  }

  const sign = compareLargeInts(startEpochNano, endEpochNano)
  const startIsoFields = zonedEpochNanoToIso(timeZone, startEpochNano)
  const startIsoTimeFields = pluckIsoTimeFields(startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZone, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZone)
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNano = isoToZonedEpochNano(midIsoFields)
  const midSign = compareLargeInts(midEpochNano, endEpochNano)

  if (midSign === -sign) {
    midIsoFields = {
      ...moveDateByDays(endIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = isoToZonedEpochNano(midIsoFields)
  }

  const dateDiff = calendar.dateUntil(startIsoFields, midIsoFields, largestUnit)
  const timeDiffNano = endEpochNano.addLargeInt(midEpochNano, -1).toNumber()
  const timeDiff = timeNanoToDurationFields(timeDiffNano)

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
    (m: LargeInt, d: DurationFields) => moveZonedEpochNano(calendar, timeZone, m, d, Overflow.Constrain),
  )
}

export function diffEpochNano(
  startEpochNano: LargeInt,
  endEpochNano: LargeInt,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationFields(
      roundByIncLarge(
        endEpochNano.addLargeInt(startEpochNano, -1),
        computeNanoInc(smallestUnit, roundingInc),
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
    yearDiff = year1 - year0
    monthsInYear1 = calendarImpl.computeMonthsInYear(year1)
    monthDiff = month1 - Math.min(month0, monthsInYear1)
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
    const monthSign = Math.sign(monthDiff)
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

  for (let year = 0; year !== yearEnd; year += yearSign) {
    months += calendarImpl.computeMonthsInYear(year + yearCorrection)
  }

  return months
}
