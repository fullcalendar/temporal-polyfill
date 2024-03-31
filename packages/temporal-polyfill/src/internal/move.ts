import { BigNano, addBigNanos } from './bigNano'
import {
  NativeMoveOps,
  YearMonthParts,
  monthCodeNumberToMonth,
} from './calendarNative'
import { DayOps, MoveOps, YearMonthMoveOps } from './calendarOps'
import {
  DurationFields,
  durationFieldDefaults,
  durationFieldNamesAsc,
  durationTimeFieldDefaults,
} from './durationFields'
import {
  durationFieldsToBigNano,
  durationHasDateParts,
  durationTimeFieldsToLargeNanoStrict,
  negateDuration,
  negateDurationFields,
} from './durationMath'
import * as errorMessages from './errorMessages'
import { IntlCalendar, computeIntlMonthsInYear } from './intlMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoTimeFieldNamesAsc,
} from './isoFields'
import { isoMonthsInYear } from './isoMath'
import { OverflowOptions, refineOverflowOptions } from './optionsRefine'
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
import {
  TimeZoneOps,
  getSingleInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'
import { Unit, givenFieldsToBigNano, milliInDay } from './units'
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

export function moveZonedDateTime<C, T>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  doSubtract: boolean,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): ZonedDateTimeSlots<C, T> {
  const timeZoneOps = getTimeZoneOps(zonedDateTimeSlots.timeZone)
  const calendarOps = getCalendarOps(zonedDateTimeSlots.calendar)

  return {
    ...zonedDateTimeSlots, // retain timeZone/calendar, order
    ...moveZonedEpochs(
      calendarOps,
      timeZoneOps,
      zonedDateTimeSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
  }
}

export function movePlainDateTime<C>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  doSubtract: boolean,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): PlainDateTimeSlots<C> {
  const { calendar } = plainDateTimeSlots
  return createPlainDateTimeSlots(
    moveDateTime(
      getCalendarOps(calendar),
      plainDateTimeSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
    calendar,
  )
}

export function movePlainDate<C>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  doSubtract: boolean,
  plainDateSlots: PlainDateSlots<C>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const { calendar } = plainDateSlots
  return createPlainDateSlots(
    moveDate(
      getCalendarOps(calendar),
      plainDateSlots,
      doSubtract ? negateDurationFields(durationSlots) : durationSlots,
      options,
    ),
    calendar,
  )
}

export function movePlainYearMonth<C>(
  getCalendarOps: (calendar: C) => YearMonthMoveOps,
  doSubtract: boolean,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationSlots: DurationSlots,
  options: OverflowOptions = Object.create(null), // b/c CalendarProtocol likes empty object,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)
  let isoDateFields: IsoDateFields = moveToDayOfMonthUnsafe(
    calendarOps,
    plainYearMonthSlots,
  )

  if (doSubtract) {
    durationSlots = negateDuration(durationSlots)
  }

  // if moving backwards in time, set to last day of month
  if (durationSlots.sign < 0) {
    isoDateFields = calendarOps.dateAdd(isoDateFields, {
      ...durationFieldDefaults,
      months: 1,
    })
    isoDateFields = moveByDays(isoDateFields, -1)
  }

  const movedIsoDateFields = calendarOps.dateAdd(
    isoDateFields,
    durationSlots,
    options,
  )

  return createPlainYearMonthSlots(
    moveToDayOfMonthUnsafe(calendarOps, movedIsoDateFields),
    calendarSlot,
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
    addBigNanos(epochNano, durationTimeFieldsToLargeNanoStrict(durationFields)),
  )
}

/*
timeZoneOps must be derived from zonedEpochSlots.timeZone
*/
export function moveZonedEpochs(
  calendarOps: MoveOps,
  timeZoneOps: TimeZoneOps,
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
    const isoDateTimeFields = zonedEpochSlotsToIso(slots, timeZoneOps)
    const movedIsoDateFields = moveDate(
      calendarOps,
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
      getSingleInstantFor(timeZoneOps, movedIsoDateTimeFields),
      timeOnlyNano,
    )
  }

  return {
    epochNanoseconds: checkEpochNanoInBounds(epochNano),
  }
}

export function moveDateTime(
  calendarOps: MoveOps,
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
    calendarOps,
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
  calendarOps: MoveOps,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateFields {
  if (durationFields.years || durationFields.months || durationFields.weeks) {
    return calendarOps.dateAdd(isoDateFields, durationFields, options)
  }

  refineOverflowOptions(options) // for validation only

  const days =
    durationFields.days +
    givenFieldsToBigNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  if (days) {
    return checkIsoDateInBounds(moveByDays(isoDateFields, days))
  }

  return isoDateFields
}

/*
Callers should ensure in-bounds
*/
export function moveToDayOfMonthUnsafe<F extends IsoDateFields>(
  calendarOps: DayOps,
  isoFields: F,
  dayOfMonth = 1,
): F {
  return moveByDays(isoFields, dayOfMonth - calendarOps.day(isoFields))
}

function moveTime(
  isoFields: IsoTimeFields,
  durationFields: DurationFields,
): [IsoTimeFields, number] {
  const [durDays, durTimeNano] = givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )
  const [newIsoFields, overflowDays] = nanoToIsoTimeAndDay(
    isoTimeFieldsToNano(isoFields) + durTimeNano,
  )

  return [newIsoFields, durDays + overflowDays]
}

// Native
// -----------------------------------------------------------------------------

export function nativeDateAdd(
  this: NativeMoveOps,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  options?: OverflowOptions,
): IsoDateFields {
  const overflow = refineOverflowOptions(options)
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  // convert time fields to days
  days += givenFieldsToBigNano(
    durationFields,
    Unit.Hour,
    durationFieldNamesAsc,
  )[0]

  if (years || months) {
    let [year, month, day] = this.dateParts(isoDateFields)

    if (years) {
      const [monthCodeNumber, isLeapMonth] = this.monthCodeParts(year, month)
      year += years
      month = monthCodeNumberToMonth(
        monthCodeNumber,
        isLeapMonth,
        this.leapMonth(year),
      )
      month = clampEntity(
        'month',
        month,
        1,
        this.monthsInYearPart(year),
        overflow,
      )
    }

    if (months) {
      ;[year, month] = this.monthAdd(year, month, months)
    }

    day = clampEntity(
      'day',
      day,
      1,
      this.daysInMonthParts(year, month),
      overflow,
    )

    epochMilli = this.epochMilli(year, month, day)
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  epochMilli! += (weeks * 7 + days) * milliInDay

  return checkIsoDateInBounds(epochMilliToIso(epochMilli!))
}

// ISO / Intl Utils
// -----------------------------------------------------------------------------

export function isoMonthAdd(
  year: number,
  month: number,
  monthDelta: number,
): YearMonthParts {
  year += divTrunc(monthDelta, isoMonthsInYear)
  month += modTrunc(monthDelta, isoMonthsInYear)

  if (month < 1) {
    year--
    month += isoMonthsInYear
  } else if (month > isoMonthsInYear) {
    year++
    month -= isoMonthsInYear
  }

  return [year, month]
}

export function intlMonthAdd(
  this: IntlCalendar,
  year: number,
  month: number,
  monthDelta: number,
): YearMonthParts {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throw new RangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeIntlMonthsInYear.call(this, --year)
      }
    } else {
      let monthsInYear: number
      while (
        month > (monthsInYear = computeIntlMonthsInYear.call(this, year))
      ) {
        month -= monthsInYear
        year++
      }
    }
  }

  return [year, month]
}

export function moveByDays<F extends IsoDateFields>(
  isoFields: F,
  days: number,
): F {
  if (days) {
    return {
      ...isoFields,
      ...epochMilliToIso(isoToEpochMilli(isoFields)! + days * milliInDay),
    }
  }
  return isoFields
}
