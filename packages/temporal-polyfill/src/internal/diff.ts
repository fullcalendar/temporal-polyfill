import { DayTimeNano, compareDayTimeNanos, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldDefaults,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDuration,
} from './durationFields'
import { IsoDateFields, IsoTimeFields, IsoDateTimeFields, isoTimeFieldDefaults, isoTimeFieldNamesDesc } from './calendarIsoFields'
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
  unitNameMap,
  unitNamesAsc,
} from './units'
import { NumSign, divModTrunc, identityFunc, pluckProps } from './utils'
import { NativeDiffOps } from './calendarNative'
import { IntlCalendar, computeIntlMonthsInYear } from './calendarIntl'
import { DiffOps, YearMonthDiffOps } from './calendarOps'
import { DurationSlots, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import { DiffOptions, prepareOptions, refineDiffOptions } from '../genericApi/optionsRefine'
import { DurationBranding } from '../genericApi/branding'
import { IdLike, ensureObjectlike } from './cast'
import { getCommonCalendarSlot } from '../genericApi/calendarSlotString'
import { getCommonTimeZoneSlot } from '../genericApi/timeZoneSlotString'

export function diffZonedDateTimes<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
  const optionsCopy = prepareOptions(options)

  let durationFields = diffZonedEpochNano(
    getCalendarOps,
    getTimeZoneOps,
    calendarSlot,
    () => getCommonTimeZoneSlot(zonedDateTimeSlots0.timeZone, zonedDateTimeSlots1.timeZone),
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
    ...refineDiffOptions(invert, optionsCopy, Unit.Hour),
    optionsCopy,
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding,
  }
}

export function diffInstants(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const optionsCopy = prepareOptions(options)
  let durationFields = diffEpochNano(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
    ...(
      refineDiffOptions(invert, optionsCopy, Unit.Second, Unit.Hour) as
        [TimeUnit, TimeUnit, number, RoundingMode]
    ),
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding,
  }
}

export function diffPlainDateTimes<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
  const optionsCopy = prepareOptions(options)
  const diffOptionsTuple = refineDiffOptions(invert, optionsCopy, Unit.Day)

  let durationFields = diffDateTimes(
    getCalendarOps,
    calendarSlot,
    plainDateTimeSlots0,
    plainDateTimeSlots1,
    ...diffOptionsTuple,
    optionsCopy,
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding,
  }
}

export function diffPlainYearMonth<C extends IdLike>(
  getCalendarOps: (calendar: C) => YearMonthDiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  const optionsCopy = prepareOptions(options)

  const calendarOps = getCalendarOps(calendarSlot)
  let durationFields = diffDates(
    getCalendarOps,
    calendarSlot,
    moveToMonthStart(calendarOps, plainYearMonthSlots0),
    moveToMonthStart(calendarOps, plainYearMonthSlots1),
    ...refineDiffOptions(invert, optionsCopy, Unit.Year, Unit.Year, Unit.Month),
    optionsCopy,
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding,
  }
}

export function diffPlainDates<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainDateSlots0.calendar, plainDateSlots1.calendar)
  const optionsCopy = prepareOptions(options)
  const optionsTuple = refineDiffOptions(
    invert,
    optionsCopy,
    Unit.Day,
    Unit.Year,
    Unit.Day,
  )

  let durationFields = diffDates(
    getCalendarOps,
    calendarSlot,
    plainDateSlots0,
    plainDateSlots1,
    ...optionsTuple,
    optionsCopy,
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding,
  }
}

export function diffPlainTimes(
  plainTimeSlots0: IsoTimeFields,
  plainTimeSlots1: IsoTimeFields,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationSlots {
  const optionsCopy = prepareOptions(options)

  let durationFields = diffTimes(
    plainTimeSlots0,
    plainTimeSlots1,
    ...(refineDiffOptions(invert, optionsCopy, Unit.Hour, Unit.Hour) as
      [TimeUnit, TimeUnit, number, RoundingMode]),
  )

  if (invert) {
    durationFields = negateDuration(durationFields)
  }

  return {
    ...durationFields,
    branding: DurationBranding
  }
}

// Dates & Times
// -------------------------------------------------------------------------------------------------

export function diffDateTimes<C>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  calendarSlot: C,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
  origOptions?: DiffOptions,
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
  if (!sign) {
    return durationFieldDefaults
  }

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

  const calendarOps = getCalendarOps(calendarSlot)
  const dateDiff = calendarOps.dateUntil(
    { ...midIsoFields, ...isoTimeFieldDefaults }, // hack
    { ...endIsoFields, ...isoTimeFieldDefaults }, // hack
    largestUnit,
    origOptions,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return roundRelativeDuration(
    dateTimeDiff,
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateTimeFields) => DayTimeNano, // markerToEpochNano
    (m: IsoDateTimeFields, d: DurationFields) => moveDateTime(calendarOps, m, d), // moveMarker
  )
}

/*
No rounding!
TODO: make DRY
*/
export function diffDateTimes2<C>(
  calendarOps: DiffOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!

  if (largestUnit < Unit.Day) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        diffDayTimeNanos(startEpochNano, endEpochNano),
        largestUnit as DayTimeUnit,
      )
    }
  }

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return durationFieldDefaults
  }

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
    { ...midIsoFields, ...isoTimeFieldDefaults }, // hack
    { ...endIsoFields, ...isoTimeFieldDefaults }, // hack
    largestUnit,
    origOptions,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return dateTimeDiff
}

export function diffDates<C>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  calendarSlot: C,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
  origOptions: DiffOptions | undefined,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return durationFieldDefaults
  }

  let calendarOps: DiffOps
  let dateDiff: DurationFields

  if (largestUnit === Unit.Day) {
    dateDiff = {
      ...durationFieldDefaults,
      days: diffDays(startIsoFields, endIsoFields) // TODO: use epochNano somehow?
    }
  } else {
    calendarOps = getCalendarOps(calendarSlot)
    dateDiff = calendarOps.dateUntil(startIsoFields, endIsoFields, largestUnit, origOptions)
  }

  // short-circuit rounding
  // NOTE: roundRelativeDuration already short-circuits for nanoseconds. make DRY?
  if (smallestUnit === Unit.Day && roundingInc === 1) {
    return dateDiff
  }

  calendarOps ||= getCalendarOps(calendarSlot)

  return roundRelativeDuration(
    dateDiff,
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

function diffDays(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(startIsoFields)!,
    isoToEpochMilli(endIsoFields)!,
  )
}

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
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  calendarSlot: C,
  getTimeZoneSlot: () => T,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
  origOptions?: DiffOptions,
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

  const timeZoneSlot = getTimeZoneSlot()

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return durationFieldDefaults
  }

  const timeZoneOps = getTimeZoneOps(timeZoneSlot)
  const calendarOps = getCalendarOps(calendarSlot)

  const startIsoFields = zonedEpochNanoToIso(timeZoneOps, startEpochNano)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesDesc, startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZoneOps, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZoneOps) // necessary to bind?
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

  const dateDiff = largestUnit === Unit.Day
    ? { ...durationFieldDefaults, days: diffDays(startIsoFields, midIsoFields), }
    : calendarOps.dateUntil(startIsoFields, midIsoFields, largestUnit, origOptions)

  const timeDiffNano = dayTimeNanoToNumber(diffDayTimeNanos(midEpochNano, endEpochNano)) // could be over 24 hour, so we need to consider day too
  const timeDiff = nanoToDurationTimeFields(timeDiffNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return roundRelativeDuration(
    dateTimeDiff,
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

/*
No rounding!
TODO: make DRY
*/
export function diffZonedEpochNano2(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  origOptions?: DiffOptions,
): DurationFields {
  if (largestUnit < Unit.Day) {
    return {
      ...durationFieldDefaults,
      ...nanoToDurationDayTimeFields(
        diffDayTimeNanos(startEpochNano, endEpochNano),
        largestUnit as DayTimeUnit,
      )
    }
  }

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return durationFieldDefaults
  }

  const startIsoFields = zonedEpochNanoToIso(timeZoneOps, startEpochNano)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesDesc, startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZoneOps, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZoneOps) // necessary to bind?
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

  const dateDiff = largestUnit === Unit.Day
    ? { ...durationFieldDefaults, days: diffDays(startIsoFields, midIsoFields), }
    : calendarOps.dateUntil(startIsoFields, midIsoFields, largestUnit, origOptions)

  const timeDiffNano = dayTimeNanoToNumber(diffDayTimeNanos(midEpochNano, endEpochNano)) // could be over 24 hour, so we need to consider day too
  const timeDiff = nanoToDurationTimeFields(timeDiffNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }

  return dateTimeDiff
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
