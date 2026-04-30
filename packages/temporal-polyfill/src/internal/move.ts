import { BigNano, addBigNanos } from './bigNano'
import { dateAdd, dateAddWithOverflow } from './calendarNativeMath'
import { queryNativeDay } from './calendarNativeQuery'
import { DurationFields, durationTimeFieldDefaults } from './durationFields'
import {
  durationFieldsToBigNano,
  durationHasDateParts,
  durationTimeFieldsToBigNanoStrict,
  getMaxDurationUnit,
  negateDuration,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldNamesAsc,
} from './isoFields'
import {
  OverflowOptions,
  refineOverflowOptions,
} from './optionsRefine'
import {
  DurationSlots,
  EpochSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  ZonedEpochSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  epochMilliToIso,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  nanoToIsoTimeAndDay,
} from './timeMath'
import { NativeTimeZone, queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneNativeMath'
import { Unit, milliInDay } from './units'
import { pluckProps } from './utils'

// High-Level
// -----------------------------------------------------------------------------

export function moveInstant(
  doSubtract: boolean,
  instantSlots: InstantSlots,
  durationSlots: DurationSlots,
): InstantSlots {
  return createInstantSlots(
    moveEpochNano(
      instantSlots.epochNanoseconds,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
    ),
  )
}

export function moveZonedDateTime(
  doSubtract: boolean,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): ZonedDateTimeSlots {
  const nativeTimeZone = queryNativeTimeZone(zonedDateTimeSlots.timeZone)

  return {
    ...zonedDateTimeSlots, // retain timeZone/calendar, order
    ...moveZonedEpochs(
      nativeTimeZone,
      zonedDateTimeSlots.calendar,
      zonedDateTimeSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
  }
}

export function movePlainDateTime(
  doSubtract: boolean,
  plainDateTimeSlots: PlainDateTimeSlots,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): PlainDateTimeSlots {
  const { calendar } = plainDateTimeSlots
  return createPlainDateTimeSlots(
    moveDateTime(
      calendar,
      plainDateTimeSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
    calendar,
  )
}

export function movePlainDate(
  doSubtract: boolean,
  plainDateSlots: PlainDateSlots,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots {
  const { calendar } = plainDateSlots
  return createPlainDateSlots(
    moveDate(
      calendar,
      plainDateSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
    calendar,
  )
}

export function movePlainYearMonth(
  doSubtract: boolean,
  plainYearMonthSlots: PlainYearMonthSlots,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  /*
  PlainYearMonth has one awkward ordering rule: overflow must be read before
  rejecting units below months. Date arithmetic normally reads overflow inside
  dateAdd(), so use the pre-refined entry point below to avoid reading the
  caller's options twice or fabricating an internal options bag.
  */
  const overflow = refineOverflowOptions(options)

  if (durationSlots.sign && getMaxDurationUnit(durationSlots) < Unit.Month) {
    throw new RangeError(errorMessages.invalidSmallUnits)
  }

  const calendarId = plainYearMonthSlots.calendar
  const getDay = (isoFields: IsoDateFields) =>
    queryNativeDay(calendarId, isoFields)

  // The first-of-month must be representable, this check in-bounds
  const isoDateFields: IsoDateFields = checkIsoDateInBounds(
    moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots),
  )

  if (doSubtract) {
    durationSlots = negateDuration(durationSlots)
  }

  const movedIsoDateFields = dateAddWithOverflow(
    calendarId,
    isoDateFields,
    durationSlots,
    overflow,
  )

  return createPlainYearMonthSlots(
    moveToDayOfMonthUnsafe(getDay, movedIsoDateFields),
    calendarId,
  )
}

export function movePlainTime(
  doSubtract: boolean,
  slots: PlainTimeSlots,
  durationSlots: DurationFields,
): PlainTimeSlots {
  return createPlainTimeSlots(
    moveTime(
      slots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
    )[0],
  )
}

// Low-Level
// -----------------------------------------------------------------------------

function moveEpochNano(
  epochNano: BigNano,
  durationFields: DurationFields,
): BigNano {
  return checkEpochNanoInBounds(
    addBigNanos(epochNano, durationTimeFieldsToBigNanoStrict(durationFields)),
  )
}

/*
nativeTimeZone must be derived from zonedEpochSlots.timeZone
*/
export function moveZonedEpochs(
  nativeTimeZone: NativeTimeZone,
  calendarId: string,
  slots: ZonedEpochSlots,
  durationFields: DurationFields,
  options?: OverflowOptions,
): EpochSlots {
  const timeOnlyNano = durationFieldsToBigNano(durationFields, Unit.Hour)
  let epochNano = slots.epochNanoseconds

  if (!durationHasDateParts(durationFields)) {
    epochNano = addBigNanos(epochNano, timeOnlyNano)
    refineOverflowOptions(options) // for validation only
  } else {
    const isoDateTimeFields = zonedEpochSlotsToIso(slots, nativeTimeZone)
    const movedIsoDateFields = moveDate(
      calendarId,
      isoDateTimeFields,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // ZERO-OUT time parts
      },
      options,
    )
    const movedIsoDateTimeFields = {
      ...movedIsoDateFields, // date parts (could be a superset)
      ...pluckProps(isoTimeFieldNamesAsc, isoDateTimeFields), // time parts
    }
    epochNano = addBigNanos(
      getSingleInstantFor(nativeTimeZone, movedIsoDateTimeFields),
      timeOnlyNano,
    )
  }

  return {
    epochNanoseconds: checkEpochNanoInBounds(epochNano),
  }
}

export function moveDateTime(
  calendarId: string,
  isoDateTimeFields: IsoDateTimeFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateTimeFields {
  // could have over 24 hours in certain zones
  const [movedIsoTimeFields, dayDelta] = moveTime(
    isoDateTimeFields,
    durationFields,
  )

  const movedIsoDateFields = moveDate(
    calendarId,
    isoDateTimeFields, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    options,
  )

  return checkIsoDateTimeInBounds({
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  })
}

/*
Skips calendar if moving days only
*/
export function moveDate(
  calendarId: string,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateFields {
  if (durationFields.years || durationFields.months || durationFields.weeks) {
    return dateAdd(calendarId, isoDateFields, durationFields, options)
  }

  refineOverflowOptions(options) // for validation only

  const days =
    durationFields.days + durationFieldsToBigNano(durationFields, Unit.Hour)[0]

  if (days) {
    return checkIsoDateInBounds(moveByDays(isoDateFields, days))
  }

  return isoDateFields
}

/*
Callers should ensure in-bounds
*/
export function moveToDayOfMonthUnsafe<F extends IsoDateFields>(
  getDay: (isoFields: IsoDateFields) => number,
  isoFields: F,
  dayOfMonth = 1,
): F {
  return moveByDays(isoFields, dayOfMonth - getDay(isoFields))
}

function moveTime(
  isoFields: IsoTimeFields,
  durationFields: DurationFields,
): [IsoTimeFields, number] {
  const [durDays, durTimeNano] = durationFieldsToBigNano(
    durationFields,
    Unit.Hour,
  )
  const [newIsoFields, overflowDays] = nanoToIsoTimeAndDay(
    isoTimeFieldsToNano(isoFields) + durTimeNano,
  )

  return [newIsoFields, durDays + overflowDays]
}

export function moveByDays<F extends IsoDateFields>(
  isoFields: F,
  days: number,
): F & Partial<IsoTimeFields> {
  if (days) {
    return {
      ...isoFields,
      ...epochMilliToIso(isoToEpochMilli(isoFields)! + days * milliInDay),
    }
  }
  return isoFields
}
