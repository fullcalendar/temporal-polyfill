import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from './bigNano'
import { diffEpochMilliByDay, nativeDateUntil } from './calendarNativeMath'
import { queryNativeDay } from './calendarNativeQuery'
import { isTimeZoneIdsEqual } from './compare'
import { DurationFields, durationFieldDefaults } from './durationFields'
import {
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldNamesAsc,
  isoTimeFieldNamesAsc,
} from './isoFields'
import {
  moveByDays,
  moveDate,
  moveDateTime,
  moveToDayOfMonthUnsafe,
  moveZonedEpochs,
} from './move'
import { RoundingMode } from './optionsModel'
import { DiffOptions, refineDiffOptions } from './optionsRefine'
import { MarkerToEpochNano, MoveMarker } from './relativeMath'
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
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
} from './timeMath'
import { NativeTimeZone, queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneNativeMath'
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
import { NumberSign, bindArgs, pluckProps } from './utils'

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
  const calendarId = getCommonCalendarId(slots0.calendar, slots1.calendar)
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
    const timeZoneId = getCommonTimeZoneId(slots0.timeZone, slots1.timeZone)
    const nativeTimeZone = queryNativeTimeZone(timeZoneId)
    const isoFields0 = zonedEpochSlotsToIso(slots0, nativeTimeZone)
    const isoFields1 = zonedEpochSlotsToIso(slots1, nativeTimeZone)

    // During a fall-back transition, same-date wall-clock times can move in
    // the opposite direction from epoch time. Treat that as a pure time diff
    // to avoid mixed-sign calendar/time duration fields.
    if (
      isoFields0.isoYear === isoFields1.isoYear &&
      isoFields0.isoMonth === isoFields1.isoMonth &&
      isoFields0.isoDay === isoFields1.isoDay &&
      Math.sign(diffTimes(isoFields0, isoFields1)) === -sign
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
        nativeTimeZone,
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
        bindArgs(moveZonedEpochs, nativeTimeZone, calendarId) as MoveMarker,
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
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots1.calendar,
  )
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day)

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
      isoToEpochNano as MarkerToEpochNano,
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
    plainDateSlots0.calendar,
    plainDateSlots1.calendar,
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
    plainYearMonthSlots0.calendar,
    plainYearMonthSlots1.calendar,
  )
  const optionsTuple = refineDiffOptions(
    invert,
    options,
    Unit.Year,
    Unit.Year,
    Unit.Month,
  )
  const getDay = (isoFields: IsoDateFields) =>
    queryNativeDay(calendarId, isoFields)

  const firstOfMonth0 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots0)
  const firstOfMonth1 = moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots1)

  // Short-circuit if exactly the same (no in-bounds checking later)
  // HACK: not using compareIsoDateFields because choked when epochMillis out-of-bounds
  if (
    firstOfMonth0.isoYear === firstOfMonth1.isoYear &&
    firstOfMonth0.isoMonth === firstOfMonth1.isoMonth &&
    firstOfMonth0.isoDay === firstOfMonth1.isoDay
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
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
  smallestPrecision: Unit = Unit.Day,
): DurationSlots {
  const startEpochNano = isoToEpochNano(startIsoFields)
  const endEpochNano = isoToEpochNano(endIsoFields)

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
    durationFields = nativeDateUntil(
      calendarId,
      startIsoFields,
      endIsoFields,
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
        startIsoFields,
        isoToEpochNano as MarkerToEpochNano,
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
  plainTimeSlots0: IsoTimeFields,
  plainTimeSlots1: IsoTimeFields,
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
  nativeTimeZone: NativeTimeZone,
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
  const isoFields0 = zonedEpochSlotsToIso(slots0, nativeTimeZone)
  const isoFields1 = zonedEpochSlotsToIso(slots1, nativeTimeZone)
  if (
    isoFields0.isoYear === isoFields1.isoYear &&
    isoFields0.isoMonth === isoFields1.isoMonth &&
    isoFields0.isoDay === isoFields1.isoDay &&
    Math.sign(diffTimes(isoFields0, isoFields1)) === -sign
  ) {
    return diffEpochNanosExact(
      slots0.epochNanoseconds,
      slots1.epochNanoseconds,
      Unit.Hour,
    )
  }

  return diffZonedEpochsBig(
    calendarId,
    nativeTimeZone,
    slots0,
    slots1,
    sign,
    largestUnit,
  )
}

export function diffDateTimesExact(
  calendarId: string,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
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
    calendarId,
    startIsoFields,
    endIsoFields,
    sign,
    largestUnit,
  )
}

// Exact Diffing (no rounding): Big units (years/weeks/months/days?)
// -----------------------------------------------------------------------------

function diffZonedEpochsBig(
  calendarId: string,
  nativeTimeZone: NativeTimeZone,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week/day
): DurationFields {
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    nativeTimeZone,
    slots0,
    slots1,
    sign,
  )
  const isoDateFields0 = toIsoDateFields(isoFields0)
  const isoDateFields1 = toIsoDateFields(isoFields1)

  const dateDiff =
    largestUnit === Unit.Day // TODO: use this optimization elsewhere too
      ? diffByDay(isoDateFields0, isoDateFields1)
      : nativeDateUntil(calendarId, isoDateFields0, isoDateFields1, largestUnit)

  const timeDiff = nanoToDurationTimeFields(remainderNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
}

function diffDateTimesBig(
  calendarId: string,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  sign: NumberSign, // guaranteed non-zero
  largestUnit: Unit, // year/month/week
): DurationFields {
  const [startIsoDate, endIsoDate, timeNano] = prepareDateTimeDiff(
    startIsoFields,
    endIsoFields,
    sign,
  )
  const dateDiff = nativeDateUntil(
    calendarId,
    startIsoDate,
    endIsoDate,
    largestUnit,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)
  const dateTimeDiff = { ...dateDiff, ...timeDiff }
  return dateTimeDiff
}

// Prepare
// -----------------------------------------------------------------------------

export function prepareZonedEpochDiff(
  nativeTimeZone: NativeTimeZone,
  slots0: ZonedEpochSlots,
  slots1: ZonedEpochSlots,
  sign: NumberSign, // guaranteed non-zero
): [IsoDateFields, IsoDateFields, number] {
  const startIsoFields = zonedEpochSlotsToIso(slots0, nativeTimeZone)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesAsc, startIsoFields)
  const endIsoFields = zonedEpochSlotsToIso(slots1, nativeTimeZone)
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
    midEpochNano = getSingleInstantFor(nativeTimeZone, midIsoFields)
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
  let endIsoDate: IsoDateFields = toIsoDateFields(endIsoDateTime)

  // If date/time diffs conflict, move intermediate date one day forward
  let timeDiffNano = diffTimes(startIsoDateTime, endIsoDateTime)
  if (Math.sign(timeDiffNano) === -sign) {
    endIsoDate = toIsoDateFields(moveByDays(endIsoDateTime, -sign))
    timeDiffNano += nanoInUtcDay * sign
  }

  return [toIsoDateFields(startIsoDateTime), endIsoDate, timeDiffNano]
}

// TODO: eventually get rid of this somehow!
function toIsoDateFields(isoFields: IsoDateFields): IsoDateFields {
  return pluckProps(isoDateFieldNamesAsc, isoFields)
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

function diffTimes(isoTime0: IsoTimeFields, isoTime1: IsoTimeFields): number {
  return isoTimeFieldsToNano(isoTime1) - isoTimeFieldsToNano(isoTime0)
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
