import { BigNano, addBigNanos } from './bigNano'
import { monthCodeNumberToMonth } from './calendarMonthCode'
import { getCalendarLeapMonthMeta, queryCalendarDay } from './calendarQuery'
import {
  DurationFields,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
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
  ExternalCalendar,
  getExternalCalendar,
  isCoreCalendarId,
} from './externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import type { CalendarYearMonthFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import {
  addIsoMonths,
  computeIsoDateFields,
  computeIsoDaysInMonth,
  computeIsoMonthCodeParts,
  isoMonthsInYear,
} from './isoMath'
import { refineOverflowOptions } from './optionsFieldRefine'
import { Overflow, OverflowOptions } from './optionsModel'
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
  epochMilliToIsoDateTime,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
  nanoToTimeAndDay,
  timeFieldsToNano,
} from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { givenFieldsToBigNano } from './unitMath'
import { Unit, milliInDay } from './units'
import { clampEntity } from './utils'

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
  const timeZoneImpl = queryTimeZone(zonedDateTimeSlots.timeZoneId)

  return {
    ...zonedDateTimeSlots, // retain timeZone/calendar, order
    ...moveZonedEpochs(
      timeZoneImpl,
      zonedDateTimeSlots.calendarId,
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
  const { calendarId } = plainDateTimeSlots
  const isoDateTime = moveDateTime(
    calendarId,
    plainDateTimeSlots,
    doSubtract ? negateDurationFields(durationSlots) : durationSlots,
    options,
  )
  return createPlainDateTimeSlots(isoDateTime, calendarId)
}

export function movePlainDate(
  doSubtract: boolean,
  plainDateSlots: PlainDateSlots,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots {
  const { calendarId } = plainDateSlots
  return createPlainDateSlots(
    moveDate(
      calendarId,
      plainDateSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
    calendarId,
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

  const calendarId = plainYearMonthSlots.calendarId
  const getDay = (isoDate: CalendarDateFields) =>
    queryCalendarDay(calendarId, isoDate)

  // The first-of-month must be representable, this check in-bounds
  const isoDateFields: CalendarDateFields = checkIsoDateInBounds(
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
timeZoneImpl must be derived from zonedEpochSlots.timeZoneId
*/
export function moveZonedEpochs(
  timeZoneImpl: TimeZoneImpl,
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
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZoneImpl)
    const movedIsoDateFields = moveDate(
      calendarId,
      isoDateTime,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // ZERO-OUT time parts
      },
      options,
    )
    epochNano = addBigNanos(
      getSingleInstantFor(
        timeZoneImpl,
        combineDateAndTime(movedIsoDateFields, isoDateTime),
      ),
      timeOnlyNano,
    )
  }

  return {
    epochNanoseconds: checkEpochNanoInBounds(epochNano),
  }
}

export function moveDateTime(
  calendarId: string,
  isoDateTimeFields: CalendarDateTimeFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): CalendarDateTimeFields {
  // could have over 24 hours in certain zones
  const [movedTimeFields, dayDelta] = moveTime(
    isoDateTimeFields,
    durationFields,
  )

  const movedIsoDateFields = moveDate(
    calendarId,
    isoDateTimeFields,
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    options,
  )

  const movedIsoDateTimeFields = combineDateAndTime(
    movedIsoDateFields,
    movedTimeFields,
  )
  checkIsoDateTimeInBounds(movedIsoDateTimeFields)
  return movedIsoDateTimeFields
}

/*
Skips calendar if moving days only
*/
export function moveDate(
  calendarId: string,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): CalendarDateFields {
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
export function moveToDayOfMonthUnsafe<F extends CalendarDateFields>(
  getDay: (isoDate: CalendarDateFields) => number,
  isoDate: F,
  dayOfMonth = 1,
): CalendarDateFields {
  return moveByDays(isoDate, dayOfMonth - getDay(isoDate))
}

function moveTime(
  timeFields: TimeFields,
  durationFields: DurationFields,
): [TimeFields, number] {
  const [durDays, durTimeNano] = durationFieldsToBigNano(
    durationFields,
    Unit.Hour,
  )
  const [newTimeFields, overflowDays] = nanoToTimeAndDay(
    timeFieldsToNano(timeFields) + durTimeNano,
  )

  return [newTimeFields, durDays + overflowDays]
}

export function moveByDays(
  isoDate: CalendarDateFields,
  days: number,
): CalendarDateFields {
  if (days) {
    return pickDateFields(
      epochMilliToIsoDateTime(
        isoDateToEpochMilli(isoDate)! + days * milliInDay,
      ),
    )
  }
  return pickDateFields(isoDate)
}

export function dateAdd(
  calendarId: string,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): CalendarDateFields {
  return dateAddWithOverflow(
    calendarId,
    isoDateFields,
    durationFields,
    refineOverflowOptions(options),
  )
}

export function dateAddWithOverflow(
  calendarId: string,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): CalendarDateFields {
  const externalCalendar = isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId)
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  days += givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )[0]

  if (years || months) {
    epochMilli = addDateMonths(
      calendarId,
      isoDateFields,
      years,
      months,
      overflow,
      externalCalendar,
    )
  } else if (weeks || days) {
    epochMilli = isoDateToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  if (epochMilli === undefined) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  epochMilli += (weeks * 7 + days) * milliInDay

  const isoDate = epochMilliToIsoDateTime(epochMilli)
  return pickDateFields(checkIsoDateInBounds(isoDate))
}

function pickDateFields(isoDate: CalendarDateFields): CalendarDateFields {
  return {
    year: isoDate.year,
    month: isoDate.month,
    day: isoDate.day,
  }
}

export function addCalendarMonths(
  calendarId: string,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  return isCoreCalendarId(calendarId)
    ? addIsoMonths(year, month, monthDelta)
    : getExternalCalendar(calendarId).addMonths(year, month, monthDelta)
}

export function addCalendarDateMonths(
  calendarId: string,
  isoDate: Parameters<typeof addDateMonths>[1],
  years: Parameters<typeof addDateMonths>[2],
  months: Parameters<typeof addDateMonths>[3],
  overflow: Parameters<typeof addDateMonths>[4],
): ReturnType<typeof addDateMonths> {
  return addDateMonths(calendarId, isoDate, years, months, overflow)
}

export function addDateMonths(
  calendarId: string,
  isoDateFields: CalendarDateFields,
  years: number,
  months: number,
  overflow: Overflow,
  externalCalendar = isCoreCalendarId(calendarId)
    ? undefined
    : getExternalCalendar(calendarId),
): number {
  const dateParts = externalCalendar
    ? externalCalendar.computeDateFields(isoDateFields)
    : computeIsoDateFields(isoDateFields)
  let { year, month, day } = dateParts

  if (years) {
    const [monthCodeNumber, isLeapMonth] = externalCalendar
      ? externalCalendar.computeMonthCodeParts(year, month)
      : computeIsoMonthCodeParts(month)
    year += years
    month = computeYearMovedMonth(
      externalCalendar,
      monthCodeNumber,
      isLeapMonth,
      externalCalendar ? externalCalendar.computeLeapMonth(year) : undefined,
      overflow,
    )
    month = clampEntity(
      'month',
      month,
      1,
      externalCalendar
        ? externalCalendar.computeMonthsInYear(year)
        : isoMonthsInYear,
      overflow,
    )
  }

  if (months) {
    const yearMonthParts = externalCalendar
      ? externalCalendar.addMonths(year, month, months)
      : addIsoMonths(year, month, months)
    ;({ year, month } = yearMonthParts)
  }

  day = clampEntity(
    'day',
    day,
    1,
    externalCalendar
      ? externalCalendar.computeDaysInMonth(year, month)
      : computeIsoDaysInMonth(year, month),
    overflow,
  )

  return externalCalendar
    ? externalCalendar.computeEpochMilli(year, month, day)
    : isoArgsToEpochMilli(year, month, day)!
}

export function computeYearMovedMonth(
  externalCalendar: ExternalCalendar | undefined,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  targetLeapMonth: number | undefined,
  overflow: Overflow,
): number {
  if (isLeapMonth) {
    const leapMonthMeta = externalCalendar
      ? getCalendarLeapMonthMeta(externalCalendar.id)
      : undefined

    // Year arithmetic preserves the source monthCode. If the exact leap-month
    // code exists in the target year, use that ordinal month directly.
    if (
      targetLeapMonth !== undefined &&
      (leapMonthMeta! < 0 || targetLeapMonth === monthCodeNumber + 1)
    ) {
      return targetLeapMonth
    }

    // If the target year cannot represent the source leap month, reject mode
    // must fail instead of silently sliding to a neighboring ordinal month.
    if (overflow === Overflow.Reject) {
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // Chinese/Dangi-style calendars constrain MxxL to the matching common Mxx.
    // Hebrew has a fixed Adar I leap slot; constraining it lands in common Adar.
    return leapMonthMeta! < 0 ? -leapMonthMeta! : monthCodeNumber
  }

  return monthCodeNumberToMonth(monthCodeNumber, false, targetLeapMonth)
}
