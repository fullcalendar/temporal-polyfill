import { DayTimeNano, compareDayTimeNanos, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldDefaults,
} from './durationFields'
import {
  negateDurationFields,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
} from './durationMath'
import { IsoDateFields, IsoTimeFields, IsoDateTimeFields, isoTimeFieldDefaults, isoTimeFieldNamesAsc } from './calendarIsoFields'
import {
  isoDaysInWeek,
  isoMonthsInYear,
} from './calendarIso'
import {
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano
} from './epochAndTime'
import { moveByIsoDays, moveDateTime, moveToMonthStart, moveZonedEpochNano } from './move'
import { RoundingMode } from './options'
import { computeNanoInc, roundByInc, roundDayTimeNano, roundRelativeDuration } from './round'
import { TimeZoneOps, getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  milliInDay,
  nanoInUtcDay,
} from './units'
import { NumSign, bindArgs, divModTrunc, identityFunc, pluckProps } from './utils'
import { NativeDiffOps } from './calendarNative'
import { IntlCalendar, computeIntlMonthsInYear } from './calendarIntl'
import { DiffOps, YearMonthDiffOps } from './calendarOps'
import { DurationBranding, DurationSlots, IdLike, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, createDurationX, getCommonCalendarSlot, getCommonTimeZoneSlot } from './slots'
import { DiffOptions, copyOptions, refineDiffOptions } from './optionsRefine'

// High-level
// -------------------------------------------------------------------------------------------------

export function diffInstants(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(invert, optionsCopy, Unit.Second, Unit.Hour) as
    [TimeUnit, TimeUnit, number, RoundingMode]

  let durationFields = diffEpochNano(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
    ...optionsTuple,
  )

  if (invert) {
    durationFields = negateDurationFields(durationFields)
  }

  return createDurationX(durationFields)
}

export function diffZonedDateTimes<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] = refineDiffOptions(invert, optionsCopy, Unit.Hour)

  const startEpochNano = zonedDateTimeSlots0.epochNanoseconds
  const endEpochNano = zonedDateTimeSlots1.epochNanoseconds
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else if (largestUnit < Unit.Day) {
    durationFields = diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  } else {
    const timeZoneSlot = getCommonTimeZoneSlot(zonedDateTimeSlots0.timeZone, zonedDateTimeSlots1.timeZone)
    const timeZoneOps = getTimeZoneOps(timeZoneSlot)
    const calendarOps = getCalendarOps(calendarSlot)

    durationFields = diffZonedEpochNanoViaCalendar(
      calendarOps,
      timeZoneOps,
      sign,
      startEpochNano,
      endEpochNano,
      largestUnit,
      optionsCopy,
    )

    if (sign && !(smallestUnit === Unit.Nanosecond && roundingInc === 1)) {
      durationFields = roundRelativeDuration(
        durationFields,
        endEpochNano,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        startEpochNano, // marker
        identityFunc, // markerToEpochNano
        (m: DayTimeNano, d: DurationFields) => moveZonedEpochNano(calendarOps, timeZoneOps, m, d), // moveMarker
      )
    }
  }

  if (invert) {
    durationFields = negateDurationFields(durationFields)
  }

  return createDurationX(durationFields)
}

export function diffPlainDateTimes<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] = refineDiffOptions(invert, optionsCopy, Unit.Day)

  const startEpochNano = isoToEpochNano(plainDateTimeSlots0)!
  const endEpochNano = isoToEpochNano(plainDateTimeSlots1)!
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else if (largestUnit <= Unit.Day) {
    durationFields = diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as DayTimeUnit,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
    )
  } else {
    const calendarOps = getCalendarOps(calendarSlot)

    durationFields = diffDateTimesViaCalendar(
      calendarOps,
      sign,
      plainDateTimeSlots0,
      plainDateTimeSlots1,
      largestUnit,
      optionsCopy,
    )

    if (sign && !(smallestUnit === Unit.Nanosecond && roundingInc === 1)) {
      durationFields = roundRelativeDuration(
        durationFields,
        endEpochNano,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        plainDateTimeSlots0, // marker
        isoToEpochNano as (isoFields: IsoDateTimeFields) => DayTimeNano, // markerToEpochNano
        (m: IsoDateTimeFields, d: DurationFields) => moveDateTime(calendarOps, m, d), // moveMarker
      )
    }
  }

  if (invert) {
    durationFields = negateDurationFields(durationFields)
  }

  return createDurationX(durationFields)
}

export function diffPlainDates<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainDateSlots0.calendar, plainDateSlots1.calendar)
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(invert, optionsCopy, Unit.Day, Unit.Year, Unit.Day)

  return diffDateLike(
    invert || false,
    () => getCalendarOps(calendarSlot),
    plainDateSlots0,
    plainDateSlots1,
    ...optionsTuple,
    optionsCopy,
  )
}

export function diffPlainYearMonth<C extends IdLike>(
  getCalendarOps: (calendar: C) => YearMonthDiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(invert, optionsCopy, Unit.Year, Unit.Year, Unit.Month)
  const calendarOps = getCalendarOps(calendarSlot)

  return diffDateLike(
    invert || false,
    () => calendarOps,
    moveToMonthStart(calendarOps, plainYearMonthSlots0),
    moveToMonthStart(calendarOps, plainYearMonthSlots1),
    ...optionsTuple,
    optionsCopy,
  )
}

function diffDateLike(
  invert: boolean,
  getCalendarOps: () => DiffOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
  origOptions: DiffOptions | undefined,
): DurationSlots {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  let durationFields: DurationFields

  if (!sign) {
    durationFields = durationFieldDefaults
  } else {
    let calendarOps: DiffOps

    if (largestUnit === Unit.Day) {
      durationFields = diffByDay(startIsoFields, endIsoFields)
    } else {
      calendarOps = getCalendarOps()
      durationFields = calendarOps.dateUntil(startIsoFields, endIsoFields, largestUnit, origOptions)
    }

    if (!(smallestUnit === Unit.Day && roundingInc === 1)) {
      calendarOps ||= getCalendarOps()
      durationFields = roundRelativeDuration(
        durationFields,
        endEpochNano,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        startIsoFields, // marker
        isoToEpochNano as (isoFields: IsoDateFields) => DayTimeNano, // markerToEpochNano
        (m: IsoDateFields, d: DurationFields) => calendarOps.dateAdd(m, d), // moveMarker
      )
    }

    if (invert) {
      durationFields = negateDurationFields(durationFields)
    }
  }

  return createDurationX(durationFields)
}

export function diffPlainTimes(
  plainTimeSlots0: IsoTimeFields,
  plainTimeSlots1: IsoTimeFields,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] = refineDiffOptions(invert, optionsCopy, Unit.Hour, Unit.Hour)

  const startTimeNano = isoTimeFieldsToNano(plainTimeSlots0)
  const endTimeNano = isoTimeFieldsToNano(plainTimeSlots1)
  const nanoInc = computeNanoInc(smallestUnit as TimeUnit, roundingInc)
  const timeNano = roundByInc(endTimeNano - startTimeNano, nanoInc, roundingMode)

  let durationFields = {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeNano, largestUnit as TimeUnit),
  }

  if (invert) {
    durationFields = negateDurationFields(durationFields)
  }

  return createDurationX(durationFields)
}

// Exact Diffing
// -------------------------------------------------------------------------------------------------

export function diffZonedEpochNanoExact(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit < Unit.Day) {
    return diffEpochNanoExact(startEpochNano, endEpochNano, largestUnit as DayTimeUnit)
  }

  return diffZonedEpochNanoViaCalendar(
    calendarOps,
    timeZoneOps,
    sign,
    startEpochNano,
    endEpochNano,
    largestUnit,
    origOptions,
  )
}

export function diffDateTimesExact(
  calendarOps: DiffOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)

  if (!sign) {
    return durationFieldDefaults
  }
  if (largestUnit <= Unit.Day) {
    return diffEpochNanoExact(startEpochNano, endEpochNano, largestUnit as DayTimeUnit)
  }

  return diffDateTimesViaCalendar(
    calendarOps,
    sign,
    startIsoFields,
    endIsoFields,
    largestUnit,
    origOptions,
  )
}

// Diffing Via Calendar
// -------------------------------------------------------------------------------------------------

function diffZonedEpochNanoViaCalendar(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps,
  sign: NumSign,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
  const startIsoFields = zonedEpochNanoToIso(timeZoneOps, startEpochNano)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesAsc, startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZoneOps, endEpochNano)
  const isoToZonedEpochNano = bindArgs(getSingleInstantFor, timeZoneOps)
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNano = isoToZonedEpochNano(midIsoFields)
  let midSign = compareDayTimeNanos(endEpochNano, midEpochNano)

  // Might need multiple backoffs: one for simple time overage, other for end being in DST gap
  // TODO: use a do-while loop?
  let cnt = 0
  while (midSign === -sign) {
    if (cnt++ > 1) {
      throw new RangeError('Invalid TimeZoneProtocol results')
    }
    midIsoFields = {
      ...moveByIsoDays(midIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = isoToZonedEpochNano(midIsoFields)
    midSign = compareDayTimeNanos(endEpochNano, midEpochNano)
  }

  const dateDiff = largestUnit === Unit.Day
    ? diffByDay(startIsoFields, midIsoFields)
    : calendarOps.dateUntil(startIsoFields, midIsoFields, largestUnit, origOptions)

  const timeDiffNano = dayTimeNanoToNumber(diffDayTimeNanos(midEpochNano, endEpochNano)) // could be over 24 hour, so we need to consider day too
  const timeDiff = nanoToDurationTimeFields(timeDiffNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return dateTimeDiff
}

function diffDateTimesViaCalendar(
  calendarOps: DiffOps,
  sign: NumSign,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
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

  const dateDiff = calendarOps.dateUntil(
    { ...midIsoFields, ...isoTimeFieldDefaults },
    { ...endIsoFields, ...isoTimeFieldDefaults },
    largestUnit,
    origOptions,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return dateTimeDiff
}

// Diffing Via Epoch Nanoseconds
// -------------------------------------------------------------------------------------------------

function diffEpochNano(
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

function diffEpochNanoExact(
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: DayTimeUnit,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      diffDayTimeNanos(startEpochNano, endEpochNano),
      largestUnit as DayTimeUnit,
    )
  }
}

function diffByDay(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): DurationFields {
  return { ...durationFieldDefaults, days: diffDays(startIsoFields, endIsoFields) }
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
Must always be given start-of-day
*/
export function diffEpochMilliByDay(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.round((epochMilli1 - epochMilli0) / milliInDay)
}

// Native
// -------------------------------------------------------------------------------------------------

export function nativeDateUntil(
  this: NativeDiffOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit,
): DurationFields {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(startIsoFields, endIsoFields)

    if (largestUnit === Unit.Week) {
      [weeks, days] = divModTrunc(days, isoDaysInWeek)
    }

    return { ...durationFieldDefaults, weeks, days }
  }

  const yearMonthDayStart = this.dateParts(startIsoFields)
  const yearMonthDayEnd = this.dateParts(endIsoFields)
  let [years, months, days] = diffYearMonthDay(
    this,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

  if (largestUnit === Unit.Month) {
    months += this.monthsInYearSpan(years, yearMonthDayStart[0])
    years = 0
  }

  return { ...durationFieldDefaults, years, months, days }
}

function diffYearMonthDay(
  calendarNative: NativeDiffOps,
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
] {
  let yearDiff!: number
  let monthsInYear1!: number
  let monthDiff!: number
  let daysInMonth1!: number
  let dayDiff!: number

  function updateYearMonth() {
    let [monthCodeNumber0, isLeapYear0] = calendarNative.monthCodeParts(year0, month0)
    let [monthCodeNumber1, isLeapYear1] = calendarNative.monthCodeParts(year1, month1)

    yearDiff = year1 - year0
    monthsInYear1 = calendarNative.monthsInYearPart(year1)
    monthDiff = yearDiff
      // crossing years
      ? (monthCodeNumber1 - monthCodeNumber0) || (Number(isLeapYear1) - Number(isLeapYear0))
      // same year
      : month1 - Math.min(month0, monthsInYear1)
  }

  function updateYearMonthDay() {
    updateYearMonth()
    daysInMonth1 = calendarNative.daysInMonthParts(year1, month1)
    dayDiff = day1 - Math.min(day0, daysInMonth1)
  }

  updateYearMonthDay()
  const daySign = Math.sign(dayDiff) as NumSign
  const sign = (Math.sign(yearDiff) || Math.sign(monthDiff) || daySign) as NumSign

  if (sign) {
    // overshooting day? correct by moving to penultimate month
    if (daySign === -sign) {
      const oldDaysInMonth1 = daysInMonth1
      ;([year1, month1] = calendarNative.monthAdd(year1, month1, -sign))
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

  return [yearDiff, monthDiff, dayDiff]
}

// Month Span for ISO/Intl
// -------------------------------------------------------------------------------------------------

export function computeIsoMonthsInYearSpan(yearDelta: number): number {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(
  this: IntlCalendar,
  yearDelta: number,
  yearStart: number,
): number {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = yearStart; year !== yearEnd; year += yearSign) {
    months += computeIntlMonthsInYear.call(this, year + yearCorrection)
  }

  return months
}
