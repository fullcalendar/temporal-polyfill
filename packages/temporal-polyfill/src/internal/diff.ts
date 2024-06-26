import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from './bigNano'
import { NativeDiffOps, monthCodeNumberToMonth } from './calendarNative'
import { DiffOps, YearMonthDiffOps } from './calendarOps'
import { isTimeZoneSlotsEqual } from './compare'
import { DurationFields, durationFieldDefaults } from './durationFields'
import {
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { IntlCalendar, computeIntlMonthsInYear } from './intlMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { isoMonthsInYear } from './isoMath'
import { MarkerToEpochNano, MoveMarker } from './markerSystem'
import {
  moveByDays,
  moveDate,
  moveDateTime,
  moveToDayOfMonthUnsafe,
  moveZonedEpochs,
} from './move'
import { RoundingMode } from './options'
import { DiffOptions, copyOptions, refineDiffOptions } from './optionsRefine'
import {
  computeNanoInc,
  roundBigNano,
  roundByInc,
  roundRelativeDuration,
} from './round'
import {
  DurationSlots,
  IdLike,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  ZonedEpochSlots,
  createDurationSlots,
  extractEpochNano,
  isIdLikeEqual,
} from './slots'
import {
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
} from './timeMath'
import {
  TimeZoneOps,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
import {
  DateUnitName,
  DayTimeUnit,
  TimeUnit,
  TimeUnitName,
  Unit,
  UnitName,
  YearMonthUnitName,
  milliInDay,
  nanoInUtcDay,
} from './units'
import { NumberSign, bindArgs, divModTrunc, pluckProps } from './utils'

// High-level
// -----------------------------------------------------------------------------

export function diffInstants(
  invert: boolean,
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
  options?: DiffOptions<TimeUnitName>,
): DurationSlots {
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(
    invert,
    optionsCopy,
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

export function diffZonedDateTimes<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  invert: boolean,
  slots0: ZonedDateTimeSlots<C, T>,
  slots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions<UnitName>,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(slots0.calendar, slots1.calendar)
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, optionsCopy, Unit.Hour)

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
    const timeZoneSlot = getCommonTimeZoneSlot(slots0.timeZone, slots1.timeZone)
    const timeZoneOps = getTimeZoneOps(timeZoneSlot)
    const calendarOps = getCalendarOps(calendarSlot)

    durationFields = diffZonedEpochsBig(
      calendarOps,
      timeZoneOps,
      slots0,
      slots1,
      sign,
      largestUnit,
      optionsCopy,
    )

    durationFields = roundRelativeDuration(
      durationFields,
      epochNano1,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      calendarOps,
      slots0,
      extractEpochNano as MarkerToEpochNano,
      bindArgs(moveZonedEpochs, timeZoneOps) as MoveMarker,
    )
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainDateTimes<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  invert: boolean,
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options?: DiffOptions<UnitName>,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots1.calendar,
  )
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, optionsCopy, Unit.Day)

  const startEpochNano = isoToEpochNano(plainDateTimeSlots0)!
  const endEpochNano = isoToEpochNano(plainDateTimeSlots1)!
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
    const calendarOps = getCalendarOps(calendarSlot)

    durationFields = diffDateTimesBig(
      calendarOps,
      plainDateTimeSlots0,
      plainDateTimeSlots1,
      sign,
      largestUnit,
      optionsCopy,
    )

    durationFields = roundRelativeDuration(
      durationFields,
      endEpochNano,
      largestUnit,
      smallestUnit,
      roundingInc,
      roundingMode,
      calendarOps,
      plainDateTimeSlots0,
      isoToEpochNano as MarkerToEpochNano,
      moveDateTime as MoveMarker,
    )
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainDates<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  invert: boolean,
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options?: DiffOptions<DateUnitName>,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(
    plainDateSlots0.calendar,
    plainDateSlots1.calendar,
  )
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(
    invert,
    optionsCopy,
    Unit.Day,
    Unit.Year,
    Unit.Day,
  )

  return diffDateLike(
    invert,
    () => getCalendarOps(calendarSlot),
    plainDateSlots0,
    plainDateSlots1,
    ...optionsTuple,
    optionsCopy,
  )
}

export function diffPlainYearMonth<C extends IdLike>(
  getCalendarOps: (calendar: C) => YearMonthDiffOps,
  invert: boolean,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions<YearMonthUnitName>,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(
    plainYearMonthSlots0.calendar,
    plainYearMonthSlots1.calendar,
  )
  const optionsCopy = copyOptions(options)
  const optionsTuple = refineDiffOptions(
    invert,
    optionsCopy,
    Unit.Year,
    Unit.Year,
    Unit.Month,
  )
  const calendarOps = getCalendarOps(calendarSlot)

  return diffDateLike(
    invert,
    () => calendarOps,
    moveToDayOfMonthUnsafe(calendarOps, plainYearMonthSlots0),
    moveToDayOfMonthUnsafe(calendarOps, plainYearMonthSlots1),
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
  origOptions: DiffOptions<DateUnitName> | undefined,
): DurationSlots {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!
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
    const calendarOps = getCalendarOps()

    durationFields = calendarOps.dateUntil(
      startIsoFields,
      endIsoFields,
      largestUnit,
      origOptions,
    )

    if (!(smallestUnit === Unit.Day && roundingInc === 1)) {
      durationFields = roundRelativeDuration(
        durationFields,
        endEpochNano,
        largestUnit,
        smallestUnit,
        roundingInc,
        roundingMode,
        calendarOps,
        startIsoFields,
        isoToEpochNano as MarkerToEpochNano,
        moveDate as MoveMarker,
      )
    }
  }

  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}

export function diffPlainTimes(
  invert: boolean,
  plainTimeSlots0: IsoTimeFields,
  plainTimeSlots1: IsoTimeFields,
  options?: DiffOptions<TimeUnitName>,
): DurationSlots {
  const optionsCopy = copyOptions(options)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, optionsCopy, Unit.Hour, Unit.Hour)

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
  timeZoneOps: TimeZoneOps,
  calendarOps: DiffOps,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  largestUnit: Unit,
  origOptions?: DiffOptions<UnitName>,
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

  return diffZonedEpochsBig(
    calendarOps,
    timeZoneOps,
    slots0,
    slots1,
    sign,
    largestUnit,
    origOptions as DiffOptions<DateUnitName>,
  )
}

export function diffDateTimesExact(
  calendarOps: DiffOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  origOptions?: DiffOptions<UnitName>,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!
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
    calendarOps,
    startIsoFields,
    endIsoFields,
    sign,
    largestUnit,
    origOptions,
  )
}

// Exact Diffing (no rounding): Big units (years/weeks/months/days?)
// -----------------------------------------------------------------------------

function diffZonedEpochsBig(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week/day
  origOptions?: DiffOptions<UnitName>,
): DurationFields {
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZoneOps,
    slots0,
    slots1,
    sign,
  )

  const dateDiff =
    largestUnit === Unit.Day // TODO: use this optimization elsewhere too
      ? diffByDay(isoFields0, isoFields1)
      : calendarOps.dateUntil(
          isoFields0,
          isoFields1,
          largestUnit,
          origOptions as DiffOptions<DateUnitName>,
        )

  const timeDiff = nanoToDurationTimeFields(remainderNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
}

function diffDateTimesBig(
  calendarOps: DiffOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week
  origOptions?: DiffOptions<UnitName>,
): DurationFields {
  const [startIsoDate, endIsoDate, timeNano] = prepareDateTimeDiff(
    startIsoFields,
    endIsoFields,
    sign,
  )
  const dateDiff = calendarOps.dateUntil(
    startIsoDate,
    endIsoDate,
    largestUnit,
    origOptions as DiffOptions<DateUnitName>,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
}

// Prepare
// -----------------------------------------------------------------------------

export function prepareZonedEpochDiff(
  timeZoneOps: TimeZoneOps,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
): [IsoDateFields, IsoDateFields, number] {
  const startIsoFields = zonedEpochSlotsToIso(slots0, timeZoneOps)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesAsc, startIsoFields)
  const endIsoFields = zonedEpochSlotsToIso(slots1, timeZoneOps)
  const endEpochNano = slots1.epochNanoseconds
  let dayCorrection = 0

  // If wall-clock will be overshot, guaranteed 1-day correction
  const timeDiffNano = diffTimes(startIsoFields, endIsoFields)
  const timeSign = Math.sign(timeDiffNano)
  if (timeSign === -sign) {
    dayCorrection++
  }

  // The intermediate datetime after adding date-only units
  let midIsoFields: IsoDateTimeFields
  let midEpochNano: BigNano

  // Computes intermediate zdt after date-unit add
  // Returns `true` if the date-only adding overshot the end-point
  // Increments dayCorrection for next run
  function updateMid(): boolean {
    midIsoFields = {
      ...moveByDays(endIsoFields, dayCorrection++ * -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = getSingleInstantFor(timeZoneOps, midIsoFields)
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
  return [startIsoFields, midIsoFields!, remainderNano]
}

export function prepareDateTimeDiff(
  startIsoDateTime: IsoDateTimeFields,
  endIsoDateTime: IsoDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
): [IsoDateFields, IsoDateFields, number] {
  let endIsoDate: IsoDateFields = endIsoDateTime

  // If date/time diffs conflict, move intermediate date one day forward
  let timeDiffNano = diffTimes(startIsoDateTime, endIsoDateTime)
  if (Math.sign(timeDiffNano) === -sign) {
    endIsoDate = moveByDays(endIsoDateTime, -sign)
    timeDiffNano += nanoInUtcDay * sign
  }

  return [startIsoDateTime, endIsoDate, timeDiffNano]
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
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): DurationFields {
  return {
    ...durationFieldDefaults,
    days: diffDays(startIsoFields, endIsoFields),
  }
}

/*
Partial days are trunc()'d
*/
export function diffDays(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(startIsoFields)!,
    isoToEpochMilli(endIsoFields)!,
  )
}

/*
Partial days are trunc()'d
*/
export function diffEpochMilliByDay(
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.trunc((epochMilli1 - epochMilli0) / milliInDay)
}

function diffTimes(isoTime0: IsoTimeFields, isoTime1: IsoTimeFields): number {
  return isoTimeFieldsToNano(isoTime1) - isoTimeFieldsToNano(isoTime0)
}

// Native
// -----------------------------------------------------------------------------

export function nativeDateUntil(
  this: NativeDiffOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit,
): DurationFields {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(
      { ...startIsoFields, ...isoTimeFieldDefaults },
      { ...endIsoFields, ...isoTimeFieldDefaults },
    )

    if (largestUnit === Unit.Week) {
      ;[weeks, days] = divModTrunc(days, 7)
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
): [yearDiff: number, monthDiff: number, dayDiff: number] {
  // These deltas are lexical at first, but will become real later
  let yearDiff = year1 - year0
  let monthDiff = month1 - month0
  let dayDiff = day1 - day0

  // Moving across months?
  if (yearDiff || monthDiff) {
    const sign = Math.sign(yearDiff || monthDiff)
    let daysInMonth1 = calendarNative.daysInMonthParts(year1, month1)
    let dayCorrect = 0

    // Adding year0/month0/day0 + yearDiff/monthDiff will overshoot days
    // Instead, simulate moving year0/month0/day0 + yearDiff/[monthDiff-sign]
    // Store result in year1/month1 as the revised end point
    if (Math.sign(dayDiff) === -sign) {
      const origDaysInMonth1 = daysInMonth1

      // Back up a month
      ;[year1, month1] = calendarNative.monthAdd(year1, month1, -sign)
      yearDiff = year1 - year0
      monthDiff = month1 - month0
      daysInMonth1 = calendarNative.daysInMonthParts(year1, month1)

      dayCorrect = sign < 0 ? -origDaysInMonth1 : daysInMonth1
    }

    // Recompute dayDiff considering backed-up month and day truncation
    const day0Trunc = Math.min(day0, daysInMonth1)
    dayDiff = day1 - day0Trunc + dayCorrect

    // Moving across years?
    if (yearDiff) {
      // Recompute monthDiff from monthCode
      const [monthCodeNumber0, isLeapYear0] = calendarNative.monthCodeParts(
        year0,
        month0,
      )
      const [monthCodeNumber1, isLeapYear1] = calendarNative.monthCodeParts(
        year1,
        month1,
      )
      monthDiff =
        monthCodeNumber1 - monthCodeNumber0 ||
        Number(isLeapYear1) - Number(isLeapYear0)

      // Adding year0/month0 + yearDiff will overshoot months
      // Instead, simulate moving year0/month0 + [yearDiff-sign]
      if (Math.sign(monthDiff) === -sign) {
        // Needed for computing new monthDiff when moving towards past
        const monthCorrect = sign < 0 && -calendarNative.monthsInYearPart(year1)

        // Back up a year
        year1 -= sign
        yearDiff = year1 - year0

        // Compute new monthDiff that spans across adjacent years
        const month0Trunc = monthCodeNumberToMonth(
          monthCodeNumber0,
          isLeapYear0,
          calendarNative.leapMonth(year1),
        )
        monthDiff =
          month1 -
          month0Trunc +
          (monthCorrect || calendarNative.monthsInYearPart(year1))
      }
    }
  }

  return [yearDiff, monthDiff, dayDiff]
}

// Month Span for ISO/Intl
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

export function getCommonCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (!isIdLikeEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }

  return a
}

export function getCommonTimeZoneSlot<C extends IdLike>(a: C, b: C): C {
  if (!isTimeZoneSlotsEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }

  return a
}
