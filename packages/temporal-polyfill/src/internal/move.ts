import type { Temporal } from 'temporal-spec'
import { bigNanoInUtcDay } from './bigNano'
import {
  computeCalendarDateFields,
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarEpochMilli,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import { monthCodeNumberToMonth } from './calendarMonthCode'
import { type CalendarSlot } from './calendarSlot'
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
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  CalendarYearMonthFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { addIsoMonths } from './isoCalendarMath'
import { refineOverflowOptions } from './optionsFieldRefine'
import { Overflow } from './optionsModel'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
} from './temporalLimits'
import { nanoToTimeAndDay, timeFieldsToNano } from './timeFieldMath'
import { TimeZone } from './timeZone'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { givenFieldsToBigNano } from './unitMath'
import { Unit, milliInDay } from './units'
import { NumberSign, clampEntity } from './utils'

// High-Level
// -----------------------------------------------------------------------------

export function moveInstant(
  doSubtract: boolean,
  instantSlots: EpochNanoFields,
  durationSlots: DurationFields,
): EpochNanoFields {
  return createEpochNanoSlots(
    moveEpochNano(
      instantSlots.epochNanoseconds,
      signedDurationFields(doSubtract, durationSlots),
    ),
  )
}

export function moveZonedDateTime(
  doSubtract: boolean,
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  durationSlots: DurationFields,
  options: Temporal.OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
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
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: CalendarSlot },
  durationSlots: DurationFields,
  options: Temporal.OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): CalendarDateTimeFields & { calendar: CalendarSlot } {
  const { calendar } = plainDateTimeSlots
  return createDateTimeSlots(
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
  plainDateSlots: CalendarDateFields & { calendar: CalendarSlot },
  durationSlots: DurationFields,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const { calendar } = plainDateSlots
  return createDateSlots(
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
  plainYearMonthSlots: CalendarDateFields & { calendar: CalendarSlot },
  durationSlots: DurationFields & { sign: NumberSign },
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
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

  return createDateSlots(
    moveToDayOfMonthUnsafe(getDay, movedIsoDateFields),
    calendar,
  )
}

export function movePlainTime(
  doSubtract: boolean,
  slots: TimeFields,
  durationSlots: DurationFields,
): TimeFields {
  return createTimeSlots(
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
  epochNano: bigint,
  durationFields: DurationFields,
): bigint {
  return checkEpochNanoInBounds(
    epochNano + durationTimeFieldsToBigNanoStrict(durationFields),
  )
}

/*
timeZone must be the same object carried by the zoned slots. Passing it
through keeps repeated offset/transition work on one memoized implementation.
*/
export function moveZonedEpochs(
  timeZone: TimeZone,
  calendar: CalendarSlot,
  slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  durationFields: DurationFields,
  options?: Temporal.OverflowOptions,
): EpochNanoFields {
  const timeOnlyNano = durationFieldsToBigNano(durationFields, Unit.Hour)
  let epochNano = slots.epochNanoseconds

  if (!durationHasDateParts(durationFields)) {
    epochNano += timeOnlyNano
    refineOverflowOptions(options) // for validation only
  } else {
    const isoDateTime = zonedEpochSlotsToIso(slots, timeZone)
    const movedIsoDateFields = moveDate(
      calendar,
      isoDateTime,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // ZERO-OUT time parts
      },
      options,
    )
    epochNano =
      getSingleInstantFor(
        timeZone,
        combineDateAndTime(movedIsoDateFields, isoDateTime),
      ) + timeOnlyNano
  }

  return {
    epochNanoseconds: checkEpochNanoInBounds(epochNano),
  }
}

export function moveDateTime(
  calendar: CalendarSlot,
  isoDateTimeFields: CalendarDateTimeFields,
  durationFields: DurationFields,
  options?: Temporal.OverflowOptions,
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
  calendar: CalendarSlot,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  options?: Temporal.OverflowOptions,
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
    durationFields.days +
    Number(durationFieldsToBigNano(durationFields, Unit.Hour) / bigNanoInUtcDay)

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
  const durationBigNano = durationFieldsToBigNano(durationFields, Unit.Hour)
  const durDays = Number(durationBigNano / bigNanoInUtcDay)
  const durTimeNano = Number(durationBigNano % bigNanoInUtcDay)
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
  calendar: CalendarSlot,
  isoDateFields: CalendarDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): CalendarDateFields {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  days += Number(
    givenFieldsToBigNano(durationFields, Unit.Hour, durationFieldNamesAsc) /
      bigNanoInUtcDay,
  )

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
  calendar: CalendarSlot,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  return calendar
    ? calendar.addMonths(year, month, monthDelta)
    : addIsoMonths(year, month, monthDelta)
}

export function addDateMonths(
  calendar: CalendarSlot,
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
  calendar: CalendarSlot,
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
