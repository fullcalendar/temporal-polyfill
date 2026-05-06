import { BigNano, addBigNanos } from './bigNano'
import {
  computeCalendarDateFields,
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarEpochMilli,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import { monthCodeNumberToMonth } from './calendarMonthCode'
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
  negateDurationFields,
} from './durationMath'
import { epochMilliToIsoDateTime, isoDateToEpochMilli } from './epochMath'
import * as errorMessages from './errorMessages'
import { type InternalCalendar } from './externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  type CalendarYearMonthFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { addIsoMonths } from './isoCalendarMath'
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
} from './temporalLimits'
import { nanoToTimeAndDay, timeFieldsToNano } from './timeFieldMath'
import { TimeZoneImpl } from './timeZoneImpl'
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
      signedDurationFields(doSubtract, durationSlots),
    ),
  )
}

export function moveZonedDateTime(
  doSubtract: boolean,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): ZonedDateTimeSlots {
  return {
    ...zonedDateTimeSlots, // retain timeZone/calendar, order
    ...moveZonedEpochs(
      zonedDateTimeSlots.timeZone,
      zonedDateTimeSlots.calendar,
      zonedDateTimeSlots,
      signedDurationFields(doSubtract, durationSlots),
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
      signedDurationFields(doSubtract, durationSlots),
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
      signedDurationFields(doSubtract, durationSlots),
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
  moveDate(), so use the pre-refined entry point below to avoid reading the
  caller's options twice or fabricating an internal options bag.
  */
  const overflow = refineOverflowOptions(options)

  if (durationSlots.sign && getMaxDurationUnit(durationSlots) < Unit.Month) {
    throw new RangeError(errorMessages.invalidSmallUnits)
  }

  const { calendar } = plainYearMonthSlots
  const getDay = (isoDate: CalendarDateFields) =>
    computeCalendarDateFields(calendar, isoDate).day

  // The first-of-month must be representable, this check in-bounds
  const isoDateFields: CalendarDateFields = checkIsoDateInBounds(
    moveToDayOfMonthUnsafe(getDay, plainYearMonthSlots),
  )

  const movedIsoDateFields = dateAddWithOverflow(
    calendar,
    isoDateFields,
    signedDurationFields(doSubtract, durationSlots),
    overflow,
  )

  return createPlainYearMonthSlots(
    moveToDayOfMonthUnsafe(getDay, movedIsoDateFields),
    calendar,
  )
}

export function movePlainTime(
  doSubtract: boolean,
  slots: PlainTimeSlots,
  durationSlots: DurationFields,
): PlainTimeSlots {
  return createPlainTimeSlots(
    moveTime(slots, signedDurationFields(doSubtract, durationSlots))[0],
  )
}

function signedDurationFields(
  doSubtract: boolean,
  durationFields: DurationFields,
): DurationFields {
  return doSubtract ? negateDurationFields(durationFields) : durationFields
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
timeZoneImpl must be the same object carried by the zoned slots. Passing it
through keeps repeated offset/transition work on one memoized implementation.
*/
export function moveZonedEpochs(
  timeZoneImpl: TimeZoneImpl,
  calendar: InternalCalendar,
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
      calendar,
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
  calendar: InternalCalendar,
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
    calendar,
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
  calendar: InternalCalendar,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): CalendarDateFields {
  if (durationFields.years || durationFields.months || durationFields.weeks) {
    return dateAddWithOverflow(
      calendar,
      isoDateFields,
      durationFields,
      refineOverflowOptions(options),
    )
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
    return epochMilliToIsoDateTime(
      isoDateToEpochMilli(isoDate)! + days * milliInDay,
    )
  }
  return isoDate
}

function dateAddWithOverflow(
  calendar: InternalCalendar,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): CalendarDateFields {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  days += givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )[0]

  if (years || months) {
    epochMilli = addDateMonths(calendar, isoDateFields, years, months, overflow)
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
  return checkIsoDateInBounds(isoDate)
}

export function addCalendarMonths(
  calendar: InternalCalendar,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  return calendar
    ? calendar.addMonths(year, month, monthDelta)
    : addIsoMonths(year, month, monthDelta)
}

export function addDateMonths(
  calendar: InternalCalendar,
  isoDateFields: CalendarDateFields,
  years: number,
  months: number,
  overflow: Overflow,
): number {
  const dateParts = computeCalendarDateFields(calendar, isoDateFields)
  let { year, month, day } = dateParts

  if (years) {
    const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
      calendar,
      year,
      month,
    )
    year += years
    month = computeYearMovedMonth(
      calendar,
      monthCodeNumber,
      isLeapMonth,
      calendar ? calendar.computeLeapMonth(year) : undefined,
      overflow,
    )
    month = clampEntity(
      'month',
      month,
      1,
      computeCalendarMonthsInYearForYear(calendar, year),
      overflow,
    )
  }

  if (months) {
    const yearMonthParts = calendar
      ? calendar.addMonths(year, month, months)
      : addIsoMonths(year, month, months)
    ;({ year, month } = yearMonthParts)
  }

  day = clampEntity(
    'day',
    day,
    1,
    computeCalendarDaysInMonthForYearMonth(calendar, year, month),
    overflow,
  )

  return computeCalendarEpochMilli(calendar, year, month, day)
}

export function computeYearMovedMonth(
  calendar: InternalCalendar,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  targetLeapMonth: number | undefined,
  overflow: Overflow,
): number {
  if (isLeapMonth) {
    const leapMonthMeta = calendar ? calendar.leapMonthMeta : undefined

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
