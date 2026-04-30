import {
  BigNano,
  bigNanoOutside,
  bigNanoToBigInt,
  divModBigNano,
  moveBigNano,
  numberToBigNano,
} from './bigNano'
import * as errorMessages from './errorMessages'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateTimeFieldNamesAsc,
  isoTimeFieldDefaults,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { Overflow } from './optionsModel'
import {
  Unit,
  milliInDay,
  milliInSec,
  nanoInMicro,
  nanoInMilli,
  nanoInSec,
  nanoInUtcDay,
} from './units'
import { givenFieldsToBigNano, nanoToGivenFields } from './unitMath'
import { clampProp, divModFloor, divModTrunc, zipProps } from './utils'

/*
NOTES on limits:

Date
  min = Date.UTC(-271821, 4 - 1, 20) // -8640000000000000
  max = Date.UTC(275760, 9 - 1, 13) // 8640000000000000
Instant
  min = Temporal.Instant.fromEpochMilliseconds(-8640000000000000)
  max = Temporal.Instant.fromEpochMilliseconds(8640000000000000)
ZonedDateTime
  min.toZonedDateTimeISO('<hypothetical-min-timezone>') // -271821-04-20 - 59:59.999999999
  max.toZonedDateTimeISO('<hypothetical-max-timezone>') // 275760-09-13 + 59:59.999999999
PlainDateTime
  min = new Temporal.PlainDateTime(-271821, 4, 19, 0, 0, 0, 0, 0, 1)
  max = new Temporal.PlainDateTime(275760, 9, 13, 23, 59, 59, 999, 999, 999)
PlainDate
  min = new Temporal.PlainDate(-271821, 4, 19)
  max = new Temporal.PlainDate(275760, 9, 13)
PlainYearMonth
  min = new Temporal.PlainYearMonth(-271821, 4)
  max = new Temporal.PlainYearMonth(275760, 9)
*/

/*
TODO: move all check* calls as late as possible, right before record-creation, even for moving!
*/

const maxDays = 100000000
export const maxMilli = maxDays * milliInDay
const epochNanoMax: BigNano = [maxDays, 0]
const epochNanoMin: BigNano = [-maxDays, 0]
const isoYearMax = 275760 // optimization. isoYear at epochNanoMax
const isoYearMin = -271821 // optimization. isoYear at epochNanoMin
const isoNoonFieldDefaults: IsoTimeFields = {
  ...isoTimeFieldDefaults,
  isoHour: 12,
}

export function checkIsoYearMonthInBounds<T extends IsoDateFields>(
  isoFields: T,
): T {
  // TODO: just authenticate based on hardcoded min/max isoYear/Month/Day. for other types too
  clampProp(
    isoFields,
    'isoYear' as any,
    isoYearMin,
    isoYearMax,
    Overflow.Reject,
  )

  if (isoFields.isoYear === isoYearMin) {
    clampProp(isoFields, 'isoMonth' as any, 4, 12, Overflow.Reject)
  } else if (isoFields.isoYear === isoYearMax) {
    clampProp(isoFields, 'isoMonth' as any, 1, 9, Overflow.Reject)
  }

  return isoFields
}

export function checkIsoDateInBounds<T extends IsoDateFields>(isoFields: T): T {
  // PlainDate bounds are date-level bounds, not midnight-instant bounds.
  // Noon is inside the valid PlainDateTime range for both edge dates:
  // -271821-04-19 and +275760-09-13.
  checkIsoDateTimeInBounds({
    ...isoFields,
    ...isoNoonFieldDefaults,
  })
  return isoFields
}

/*
Used on isoYear/Month/Date before doing zoned operations
See CheckISODaysRange in spec
TEMPORARY
*/
export function checkIsoDateInBoundsStrict<T extends IsoDateFields>(
  isoFields: T,
): T {
  const bigNano = isoToEpochNano({
    ...isoFields,
    ...isoTimeFieldDefaults,
  })

  // TODO: better way to do this besides hardcoding limit
  if (!bigNano || Math.abs(bigNano[0]) > 1e8) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  return isoFields
}

export function checkIsoDateTimeInBounds<T extends IsoDateTimeFields>(
  isoFields: T,
): T {
  const isoYear = clampProp(
    isoFields as IsoDateFields,
    'isoYear',
    isoYearMin,
    isoYearMax,
    Overflow.Reject,
  )
  // this seems bad because this 'nudge' already happens in isoToLegacyDate
  const nudge = isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  if (nudge) {
    // needs to be within 23:59:59.999 of min/max epochNano
    checkEpochNanoInBounds(
      isoToEpochNano({
        ...isoFields,
        isoDay: isoFields.isoDay + nudge,
        isoNanosecond: isoFields.isoNanosecond - nudge,
      }),
    )
  }

  return isoFields
}

export function checkEpochNanoInBounds(
  epochNano: BigNano | undefined,
): BigNano {
  if (!epochNano || bigNanoOutside(epochNano, epochNanoMin, epochNanoMax)) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }
  return epochNano
}

// Field <-> Nanosecond Conversion
// -----------------------------------------------------------------------------

export function isoTimeFieldsToNano(isoTimeFields: IsoTimeFields): number {
  return givenFieldsToBigNano(isoTimeFields, Unit.Hour, isoTimeFieldNamesAsc)[1]
}

export function nanoToIsoTimeAndDay(nano: number): [IsoTimeFields, number] {
  const dayAndNano = divModFloor(nano, nanoInUtcDay)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const dayDelta = dayAndNano[0]
  const timeNano = dayAndNano[1]
  const isoTimeFields = nanoToGivenFields(
    timeNano,
    Unit.Hour,
    isoTimeFieldNamesAsc,
  ) as IsoTimeFields

  return [isoTimeFields, dayDelta]
}

// Epoch Unit Conversion
// -----------------------------------------------------------------------------
// nano -> [micro/milli/sec]

export function epochNanoToSec(epochNano: BigNano): number {
  return epochNanoToSecMod(epochNano)[0]
}

export function epochNanoToSecMod(epochNano: BigNano): [number, number] {
  return divModBigNano(epochNano, nanoInSec)
}

export function epochNanoToMilli(epochNano: BigNano): number {
  return divModBigNano(epochNano, nanoInMilli)[0]
}

export function epochNanoToMicro(epochNano: BigNano): bigint {
  return bigNanoToBigInt(epochNano, nanoInMicro)
}

// [micro/milli/sec] -> nano

/*
Expects a proper integer
*/
export function epochMilliToNano(epochMilli: number): BigNano {
  return numberToBigNano(epochMilli, nanoInMilli)
}

// ISO <-> Epoch Conversion
// -----------------------------------------------------------------------------
// ISO Fields -> Epoch

export function isoToEpochSec(
  isoDateTimeFields: IsoDateTimeFields,
): [number, number] {
  // assume valid
  // TODO: nicer way to splice this (while still excluding subsec)
  const epochSec = isoArgsToEpochSec(
    isoDateTimeFields.isoYear,
    isoDateTimeFields.isoMonth,
    isoDateTimeFields.isoDay,
    isoDateTimeFields.isoHour,
    isoDateTimeFields.isoMinute,
    isoDateTimeFields.isoSecond,
  )

  const subsecNano =
    isoDateTimeFields.isoMillisecond * nanoInMilli +
    isoDateTimeFields.isoMicrosecond * nanoInMicro +
    isoDateTimeFields.isoNanosecond

  return [epochSec, subsecNano]
}

/*
If out-of-bounds, returns undefined
*/
export function isoToEpochMilli(
  isoDateTimeFields: IsoDateTimeFields | IsoDateFields,
): number | undefined {
  return isoArgsToEpochMilli(
    isoDateTimeFields.isoYear,
    isoDateTimeFields.isoMonth,
    isoDateTimeFields.isoDay,
    (isoDateTimeFields as IsoDateTimeFields).isoHour,
    (isoDateTimeFields as IsoDateTimeFields).isoMinute,
    (isoDateTimeFields as IsoDateTimeFields).isoSecond,
    (isoDateTimeFields as IsoDateTimeFields).isoMillisecond,
  )
}

/*
For converting to fake epochNano values for math
If out-of-bounds, returns undefined
*/
export function isoToEpochNano(
  isoFields: IsoDateTimeFields | IsoDateFields,
): BigNano | undefined {
  const epochMilli = isoToEpochMilli(isoFields)

  if (epochMilli !== undefined) {
    const dayAndMilli = divModTrunc(epochMilli, milliInDay)
    // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
    const days = dayAndMilli[0]
    const milliRemainder = dayAndMilli[1]

    const timeNano =
      milliRemainder * nanoInMilli +
      ((isoFields as IsoDateTimeFields).isoMicrosecond || 0) * nanoInMicro +
      ((isoFields as IsoDateTimeFields).isoNanosecond || 0)

    return [days, timeNano]
  }
}

/*
For converting to proper epochNano values
CALLERS DO NOT NEED TO CHECK in-bounds!
(Result should be considered a finalized "Instant")
*/
export function isoToEpochNanoWithOffset(
  isoFields: IsoDateTimeFields,
  offsetNano: number,
): BigNano {
  const timeAndDay = nanoToIsoTimeAndDay(
    isoTimeFieldsToNano(isoFields) - offsetNano,
  )
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const newIsoTimeFields = timeAndDay[0]
  const dayDelta = timeAndDay[1]
  const epochNano = isoToEpochNano({
    ...isoFields,
    isoDay: isoFields.isoDay + dayDelta,
    ...newIsoTimeFields,
  })
  return checkEpochNanoInBounds(epochNano)
}

// ISO Arguments -> Epoch

export type IsoTuple = [
  isoYear: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMilli?: number,
]

/*
Assumes in-bounds
*/
export function isoArgsToEpochSec(...args: IsoTuple): number {
  return isoArgsToEpochMilli.apply(undefined, args)! / milliInSec
}

/*
If out-of-bounds, returns undefined
*/
export function isoArgsToEpochMilli(...args: IsoTuple): number | undefined {
  const legacyDateTuple = isoToLegacyDate.apply(undefined, args)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const legacyDate = legacyDateTuple[0]
  const daysNudged = legacyDateTuple[1]
  const epochMilli = legacyDate.valueOf()

  if (!isNaN(epochMilli)) {
    return epochMilli - daysNudged * milliInDay
  }
}

export function isoToLegacyDate(
  isoYear: number,
  isoMonth = 1,
  isoDay = 1,
  isoHour = 0,
  isoMinute = 0,
  isoSec = 0,
  isoMilli = 0,
): [Date, number] {
  // allows this function to accept values beyond valid Instants
  // (PlainDateTime allows values within 24hrs)
  const daysNudged =
    isoYear === isoYearMin ? 1 : isoYear === isoYearMax ? -1 : 0

  // Note: Date.UTC() interprets one and two-digit years as being in the
  // 20th century, so don't use it
  const legacyDate = new Date() // should throw out-of-range error here?
  legacyDate.setUTCHours(isoHour, isoMinute, isoSec, isoMilli)
  legacyDate.setUTCFullYear(isoYear, isoMonth - 1, isoDay + daysNudged)

  return [legacyDate, daysNudged]
}

// Epoch -> ISO Fields

export function epochNanoToIso(
  epochNano: BigNano,
  offsetNano: number,
): IsoDateTimeFields {
  const dayAndTimeNano = moveBigNano(epochNano, offsetNano)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  let days = dayAndTimeNano[0]
  let timeNano = dayAndTimeNano[1]

  // convert to start-of-day and time-of-day
  if (timeNano < 0) {
    timeNano += nanoInUtcDay
    days -= 1
  }

  const milliParts = divModFloor(timeNano, nanoInMilli)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const timeMilli = milliParts[0]
  const nanoRemainder = milliParts[1]
  const microParts = divModFloor(nanoRemainder, nanoInMicro)
  const isoMicrosecond = microParts[0]
  const isoNanosecond = microParts[1]
  const epochMilli = days * milliInDay + timeMilli

  return epochMilliToIso(epochMilli, isoMicrosecond, isoNanosecond)
}

/*
Accommodates epochMillis that are slightly out-of-range
*/
export function epochMilliToIso(
  epochMilli: number,
  isoMicrosecond = 0,
  isoNanosecond = 0,
): IsoDateTimeFields {
  const daysOver = // beyond min/max
    Math.ceil(Math.max(0, Math.abs(epochMilli) - maxMilli) / milliInDay) *
    Math.sign(epochMilli)

  // create a date that's forced within bounds
  const legacyDate = new Date(epochMilli - daysOver * milliInDay)

  return zipProps(isoDateTimeFieldNamesAsc as any, [
    legacyDate.getUTCFullYear(),
    legacyDate.getUTCMonth() + 1,
    legacyDate.getUTCDate() + daysOver, // push back out-of-bounds
    legacyDate.getUTCHours(),
    legacyDate.getUTCMinutes(),
    legacyDate.getUTCSeconds(),
    legacyDate.getUTCMilliseconds(),
    isoMicrosecond,
    isoNanosecond,
  ])
}
