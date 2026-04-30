import { BigNano, addBigNanos } from './bigNano'
import { monthCodeNumberToMonth } from './calendarMonthCode'
import {
  getCalendarLeapMonthMeta,
  isIsoBasedCalendarId,
  queryCalendarDay,
  queryIntlCalendarMaybe,
  queryIsoYearOffset,
} from './calendarQuery'
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
import type { CalendarYearMonthFields } from './fieldTypes'
import {
  IntlCalendar,
  computeIntlDateFields,
  computeIntlDaysInMonth,
  computeIntlEpochMilli,
  computeIntlLeapMonth,
  computeIntlMonthCodeParts,
  computeIntlMonthsInYear,
  queryIntlCalendar,
} from './intlCalendar'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldNamesAsc,
} from './isoFields'
import {
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
  epochMilliToIso,
  isoArgsToEpochMilli,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  nanoToIsoTimeAndDay,
} from './timeMath'
import { TimeZoneImpl, queryTimeZone } from './timeZoneImpl'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { givenFieldsToBigNano } from './unitMath'
import { Unit, milliInDay } from './units'
import { clampEntity, divTrunc, modTrunc, pluckProps } from './utils'

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
  const timeZoneImpl = queryTimeZone(zonedDateTimeSlots.timeZone)

  return {
    ...zonedDateTimeSlots, // retain timeZone/calendar, order
    ...moveZonedEpochs(
      timeZoneImpl,
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
    queryCalendarDay(calendarId, isoFields)

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
timeZoneImpl must be derived from zonedEpochSlots.timeZone
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
    const isoDateTimeFields = zonedEpochSlotsToIso(slots, timeZoneImpl)
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
      getSingleInstantFor(timeZoneImpl, movedIsoDateTimeFields),
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

export function dateAdd(
  calendarId: string,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateFields {
  return dateAddWithOverflow(
    calendarId,
    isoDateFields,
    durationFields,
    refineOverflowOptions(options),
  )
}

export function dateAddWithOverflow(
  calendarId: string,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): IsoDateFields {
  const intlCalendar = queryIntlCalendarMaybe(calendarId)
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
      intlCalendar,
    )
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  if (epochMilli === undefined) {
    throw new RangeError(errorMessages.outOfBoundsDate)
  }

  epochMilli += (weeks * 7 + days) * milliInDay

  return checkIsoDateInBounds(epochMilliToIso(epochMilli))
}

export function addCalendarMonths(
  calendarId: string,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  const isoYearOffset = queryIsoYearOffset(calendarId)
  if (isoYearOffset !== undefined) {
    const res = addIsoMonths(year - isoYearOffset, month, monthDelta)
    return { year: res.year + isoYearOffset, month: res.month }
  }

  return isIsoBasedCalendarId(calendarId)
    ? addIsoMonths(year, month, monthDelta)
    : addIntlMonths(queryIntlCalendar(calendarId), year, month, monthDelta)
}

export function addCalendarDateMonths(
  calendarId: string,
  isoFields: Parameters<typeof addDateMonths>[1],
  years: Parameters<typeof addDateMonths>[2],
  months: Parameters<typeof addDateMonths>[3],
  overflow: Parameters<typeof addDateMonths>[4],
): ReturnType<typeof addDateMonths> {
  return addDateMonths(calendarId, isoFields, years, months, overflow)
}

export function addDateMonths(
  calendarId: string,
  isoDateFields: IsoDateFields,
  years: number,
  months: number,
  overflow: Overflow,
  intlCalendar = queryIntlCalendarMaybe(calendarId),
): number {
  const dateParts = intlCalendar
    ? computeIntlDateFields(intlCalendar, isoDateFields)
    : computeIsoDateFields(isoDateFields)
  let { year, month, day } = dateParts

  if (years) {
    const [monthCodeNumber, isLeapMonth] = intlCalendar
      ? computeIntlMonthCodeParts(intlCalendar, year, month)
      : computeIsoMonthCodeParts(month)
    year += years
    month = computeYearMovedMonth(
      intlCalendar,
      monthCodeNumber,
      isLeapMonth,
      intlCalendar ? computeIntlLeapMonth(intlCalendar, year) : undefined,
      overflow,
    )
    month = clampEntity(
      'month',
      month,
      1,
      intlCalendar
        ? computeIntlMonthsInYear(intlCalendar, year)
        : isoMonthsInYear,
      overflow,
    )
  }

  if (months) {
    const yearMonthParts = intlCalendar
      ? addIntlMonths(intlCalendar, year, month, months)
      : addIsoMonths(year, month, months)
    ;({ year, month } = yearMonthParts)
  }

  day = clampEntity(
    'day',
    day,
    1,
    intlCalendar
      ? computeIntlDaysInMonth(intlCalendar, year, month)
      : computeIsoDaysInMonth(year, month),
    overflow,
  )

  return intlCalendar
    ? computeIntlEpochMilli(intlCalendar, year, month, day)
    : isoArgsToEpochMilli(year, month, day)!
}

export function computeYearMovedMonth(
  intlCalendar: IntlCalendar | undefined,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  targetLeapMonth: number | undefined,
  overflow: Overflow,
): number {
  if (isLeapMonth) {
    const leapMonthMeta = intlCalendar
      ? getCalendarLeapMonthMeta(intlCalendar.id)
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

export function addIsoMonths(
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  year += divTrunc(monthDelta, isoMonthsInYear)
  month += modTrunc(monthDelta, isoMonthsInYear)

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return { year, month }
}

export function addIntlMonths(
  intlCalendar: IntlCalendar,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throw new RangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeIntlMonthsInYear(intlCalendar, --year)
      }
    } else {
      let monthsInYear: number
      while (
        month > (monthsInYear = computeIntlMonthsInYear(intlCalendar, year))
      ) {
        month -= monthsInYear
        year++
      }
    }
  }

  return { year, month }
}
