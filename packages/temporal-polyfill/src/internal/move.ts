import { DayTimeNano, addDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  durationFieldNamesAsc,
  durationHasDateParts,
  durationTimeFieldDefaults,
  durationTimeFieldsToLargeNanoStrict,
  updateDurationFieldsSign,
  durationFieldsToDayTimeNano,
} from './durationFields'
import { IsoDateTimeFields, IsoDateFields, IsoTimeFields, isoTimeFieldNamesDesc } from './isoFields'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  epochMilliToIso,
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  moveByIsoDays,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { Overflow } from './options'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneMath'
import { Unit, givenFieldsToDayTimeNano, milliInDay } from './units'
import { clampEntity, divTrunc, modTrunc, pluckProps } from './utils'
import { isoCalendarId } from './calendarConfig'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from './timeZoneRecord'
import { NativeMoveOps, YearMonthParts, monthCodeNumberToMonth } from './calendarNative'
import { IntlCalendar, computeIntlMonthsInYear } from './calendarIntl'
import { DateAddOp, DayOp, MoveOps } from './calendarOps'

// Epoch
// -------------------------------------------------------------------------------------------------

export function moveZonedEpochNano(
  calendarOps: MoveOps,
  timeZoneRecord: {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  epochNano: DayTimeNano,
  durationFields: DurationFields,
  overflow: Overflow,
): DayTimeNano {
  const dayTimeNano = durationFieldsToDayTimeNano(durationFields, Unit.Hour) // better name: timed nano

  if (!durationHasDateParts(durationFields)) {
    epochNano = addDayTimeNanos(epochNano, dayTimeNano)
  } else {
    const isoDateTimeFields = zonedEpochNanoToIso(timeZoneRecord, epochNano)
    const movedIsoDateFields = moveDateEasy(
      calendarOps,
      isoDateTimeFields,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // time parts
      },
      overflow,
    )
    const movedIsoDateTimeFields = {
      ...movedIsoDateFields, // date parts (could be a superset)
      ...pluckProps(isoTimeFieldNamesDesc, isoDateTimeFields), // time parts
      calendar: isoCalendarId, // NOT USED but whatever
    }
    epochNano = addDayTimeNanos(
      getSingleInstantFor(timeZoneRecord, movedIsoDateTimeFields),
      dayTimeNano
    )
  }

  return checkEpochNanoInBounds(epochNano)
}

export function moveEpochNano(epochNano: DayTimeNano, durationFields: DurationFields): DayTimeNano {
  return checkEpochNanoInBounds(
    addDayTimeNanos(
      epochNano,
      durationTimeFieldsToLargeNanoStrict(durationFields),
    ),
  )
}

// Date & Time
// -------------------------------------------------------------------------------------------------

export function moveDateTime(
  calendarOps: MoveOps,
  isoDateTimeFields: IsoDateTimeFields,
  durationFields: DurationFields,
  overflow: Overflow,
): IsoDateTimeFields {
  // could have over 24 hours!!!
  const [movedIsoTimeFields, dayDelta] = moveTime(isoDateTimeFields, durationFields)

  const movedIsoDateFields = moveDateEasy(
    calendarOps,
    isoDateTimeFields, // only date parts will be used
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    overflow,
  )

  return checkIsoDateTimeInBounds({
    ...movedIsoDateFields,
    ...movedIsoTimeFields,
  })
}

export function moveDateEasy(
  calendarOps: MoveOps,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow: Overflow,
): IsoDateFields {
  if (durationFields.years || durationFields.months || durationFields.weeks) {
    return calendarOps.dateAdd(
      isoDateFields,
      updateDurationFieldsSign(durationFields),
      overflow
    )
  }

  // don't need calendar going forward...

  // TODO: DRY
  const days = durationFields.days + givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  // TODO: better utility for adding days
  if (days) {
    let epochMilli = isoToEpochMilli(isoDateFields)!
    epochMilli += days * milliInDay
    return checkIsoDateInBounds(epochMilliToIso(epochMilli!))
  }

  return isoDateFields
}

export function moveToMonthStart(
  calendarOps: { day: DayOp },
  isoFields: IsoDateFields,
): IsoDateFields {
  return moveByIsoDays(isoFields, 1 - calendarOps.day(isoFields))
}

export function nativeDateAdd(
  this: NativeMoveOps,
  isoDateFields: IsoDateFields,
  durationFields: DurationFields,
  overflow?: Overflow,
): IsoDateFields {
  let { years, months, weeks, days } = durationFields
  let epochMilli: number | undefined

  // convert time fields to days
  days += givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)[0]

  if (years || months) {
    let [year, month, day] = this.dateParts(isoDateFields)

    if (years) {
      const [monthCodeNumber, isLeapMonth] = this.monthCodeParts(year, month)
      year += years
      month = monthCodeNumberToMonth(monthCodeNumber, isLeapMonth, this.leapMonth(year))
      month = clampEntity('month', month, 1, this.monthsInYearPart(year), overflow)
    }

    if (months) {
      ([year, month] = this.monthAdd(year, month, months))
    }

    day = clampEntity('day', day, 1, this.daysInMonthParts(year, month), overflow)

    epochMilli = this.epochMilli(year, month, day)
  } else if (weeks || days) {
    epochMilli = isoToEpochMilli(isoDateFields)
  } else {
    return isoDateFields
  }

  epochMilli! += (weeks * isoDaysInWeek + days) * milliInDay

  // TODO: use epochMilli for in-bounds-ness instead?
  // TODO: inefficient that PlainDateTime will call in-bounds twice?
  return checkIsoDateInBounds(epochMilliToIso(epochMilli!))
}

export function moveTime(
  isoFields: IsoTimeFields,
  durationFields: DurationFields,
): [IsoTimeFields, number] {
  const [durDays, durTimeNano] = givenFieldsToDayTimeNano(durationFields, Unit.Hour, durationFieldNamesAsc)
  const [newIsoFields, overflowDays] = nanoToIsoTimeAndDay(isoTimeFieldsToNano(isoFields) + durTimeNano)

  return [
    newIsoFields,
    durDays + overflowDays,
  ]
}

// Calendar-related Utils
// -------------------------------------------------------------------------------------------------

export function isoMonthAdd(year: number, month: number, monthDelta: number): YearMonthParts {
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

    if (monthDelta < 0) {
      if (month < Number.MIN_SAFE_INTEGER) {
        throw new RangeError('Months out of range')
      }
      while (month < 1) {
        month += computeIntlMonthsInYear.call(this, --year)
      }
    } else {
      if (month > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Months out of range')
      }
      let monthsInYear
      while (month > (monthsInYear = computeIntlMonthsInYear.call(this, year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return [year, month]
}
