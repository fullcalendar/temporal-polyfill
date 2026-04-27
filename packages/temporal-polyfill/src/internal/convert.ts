import {
  convertNativePlainMonthDayToDate,
  convertNativePlainYearMonthToDate,
  convertNativeToPlainMonthDay,
  convertNativeToPlainYearMonth,
} from './bagRefine'
import { BigNano, bigIntToBigNano, numberToBigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import { requireObjectLike, toBigInt, toStrictInteger } from './cast'
import { EraYearOrYear, MonthDayFields, YearMonthFields } from './fields'
import {
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import {
  EpochDisambigOptions,
  refineEpochDisambigOptions,
} from './optionsRefine'
import {
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
  createZonedDateTimeSlots,
} from './slots'
import { checkEpochNanoInBounds, checkIsoDateTimeInBounds } from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import {
  getSingleInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneNativeMath'
import { nanoInMicro, nanoInMilli, nanoInSec } from './units'

// Instant -> *
// -----------------------------------------------------------------------------

export function instantToZonedDateTime(
  instantSlots: InstantSlots,
  timeZoneId: string,
  calendarId: string = isoCalendarId,
): ZonedDateTimeSlots {
  return createZonedDateTimeSlots(
    instantSlots.epochNanoseconds,
    timeZoneId,
    calendarId,
  )
}

// ZonedDateTime -> *
// -----------------------------------------------------------------------------

export function zonedDateTimeToInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): InstantSlots {
  return createInstantSlots(zonedDateTimeSlots0.epochNanoseconds)
}

export function zonedDateTimeToPlainDateTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

export function zonedDateTimeToPlainDate(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainDateSlots {
  return createPlainDateSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

export function nativeZonedDateTimeToPlainYearMonth(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  return convertNativeToPlainYearMonth(
    zonedDateTimeSlots0.calendar,
    zonedDateTimeFields,
  )
}

export function nativeZonedDateTimeToPlainMonthDay(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  return convertNativeToPlainMonthDay(
    zonedDateTimeSlots0.calendar,
    zonedDateTimeFields,
  )
}

export function zonedDateTimeToPlainTime(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
): PlainTimeSlots {
  return createPlainTimeSlots(zonedEpochSlotsToIso(zonedDateTimeSlots0))
}

// PlainDateTime -> *
// -----------------------------------------------------------------------------

export function plainDateTimeToZonedDateTime(
  plainDateTimeSlots: PlainDateTimeSlots,
  timeZoneId: string,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots {
  const epochNano = dateToEpochNano(timeZoneId, plainDateTimeSlots, options)
  return createZonedDateTimeSlots(
    checkEpochNanoInBounds(epochNano),
    timeZoneId,
    plainDateTimeSlots.calendar,
  )
}

export function nativePlainDateTimeToPlainYearMonth(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  return createPlainYearMonthSlots({
    ...plainDateTimeSlots,
    ...convertNativeToPlainYearMonth(plainDateTimeSlots.calendar, plainDateFields),
  })
}

export function nativePlainDateTimeToPlainMonthDay(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  return convertNativeToPlainMonthDay(
    plainDateTimeSlots.calendar,
    plainDateFields,
  )
}

function dateToEpochNano(
  timeZoneId: string,
  isoFields: IsoDateTimeFields,
  options?: EpochDisambigOptions,
): BigNano | undefined {
  const epochDisambig = refineEpochDisambigOptions(options)
  const nativeTimeZone = queryNativeTimeZone(timeZoneId)
  return getSingleInstantFor(nativeTimeZone, isoFields, epochDisambig)
}

// PlainDate -> *
// -----------------------------------------------------------------------------

export function plainDateToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields,
  plainDateSlots: PlainDateSlots,
  options: { timeZone: string; plainTime?: PA },
): ZonedDateTimeSlots {
  const timeZoneId = refineTimeZoneString(options.timeZone)
  const plainTimeArg = options.plainTime
  const isoTimeFields =
    plainTimeArg !== undefined ? refinePlainTimeArg(plainTimeArg) : undefined

  const nativeTimeZone = queryNativeTimeZone(timeZoneId)
  let epochNano: BigNano

  if (isoTimeFields) {
    epochNano = getSingleInstantFor(nativeTimeZone, {
      ...plainDateSlots,
      ...isoTimeFields,
    })
  } else {
    epochNano = getStartOfDayInstantFor(nativeTimeZone, {
      ...plainDateSlots,
      ...isoTimeFieldDefaults,
    })
  }

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneId,
    plainDateSlots.calendar,
  )
}

export function plainDateToPlainDateTime(
  plainDateSlots: PlainDateSlots,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...plainDateSlots,
      ...plainTimeFields,
    }),
  )
}

export function nativePlainDateToPlainYearMonth(
  plainDateSlots: { calendar: string },
  plainDateFields: { year: number; monthCode: string },
): PlainYearMonthSlots {
  return convertNativeToPlainYearMonth(plainDateSlots.calendar, plainDateFields)
}

export function nativePlainDateToPlainMonthDay(
  plainDateSlots: { calendar: string },
  plainDateFields: { monthCode: string; day: number },
): PlainMonthDaySlots {
  return convertNativeToPlainMonthDay(plainDateSlots.calendar, plainDateFields)
}

// PlainYearMonth -> *
// -----------------------------------------------------------------------------

export function nativePlainYearMonthToPlainDate(
  plainYearMonthSlots: PlainYearMonthSlots,
  plainYearMonthFields: YearMonthFields,
  bag: { day: number },
): PlainDateSlots {
  return convertNativePlainYearMonthToDate(
    plainYearMonthSlots.calendar,
    plainYearMonthFields,
    bag,
  )
}

// PlainMonthDay -> *
// -----------------------------------------------------------------------------

export function nativePlainMonthDayToPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots,
  plainMonthDayFields: MonthDayFields,
  bag: EraYearOrYear,
): PlainDateSlots {
  return convertNativePlainMonthDayToDate(
    plainMonthDaySlots.calendar,
    plainMonthDayFields,
    bag,
  )
}

// PlainTime -> *
// -----------------------------------------------------------------------------

/*
Only used by funcApi
*/
export function plainTimeToZonedDateTime<PA>(
  refineTimeZoneString: (timeZoneString: string) => string,
  refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots,
  slots: PlainTimeSlots,
  options: { timeZone: string; plainDate: PA },
): ZonedDateTimeSlots {
  const refinedOptions = requireObjectLike(options)
  const plainDateSlots = refinePlainDateArg(refinedOptions.plainDate)
  const timeZoneId = refineTimeZoneString(refinedOptions.timeZone)
  const nativeTimeZone = queryNativeTimeZone(timeZoneId)

  return createZonedDateTimeSlots(
    getSingleInstantFor(nativeTimeZone, { ...plainDateSlots, ...slots }),
    timeZoneId,
    plainDateSlots.calendar,
  )
}

/*
Only used by funcApi
*/
export function plainTimeToPlainDateTime(
  plainTimeSlots0: PlainTimeSlots,
  plainDateSlots1: PlainDateSlots,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...plainTimeSlots0,
      ...plainDateSlots1,
    }),
  )
}

// Epoch-* -> Instant
// -----------------------------------------------------------------------------

/*
Only used by funcApi
Almost public-facing, does input validation
*/
export function epochSecToInstant(epochSec: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(
      numberToBigNano(toStrictInteger(epochSec), nanoInSec),
    ),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochMilliToInstant(epochMilli: number): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(
      numberToBigNano(toStrictInteger(epochMilli), nanoInMilli),
    ),
  )
}

/*
Only used by funcApi
Almost public-facing, does input validation
*/
export function epochMicroToInstant(epochMicro: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochMicro), nanoInMicro)),
  )
}

/*
Almost public-facing, does input validation
*/
export function epochNanoToInstant(epochNano: bigint): InstantSlots {
  return createInstantSlots(
    checkEpochNanoInBounds(bigIntToBigNano(toBigInt(epochNano))),
  )
}
