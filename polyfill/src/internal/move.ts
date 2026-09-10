import { Overflow } from '../options/model'
import { bigNanoInUtcDay } from './bigNano'
import {
  computeCalendarDateFields,
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarIsoFieldsFromParts,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import { type CalendarImpl } from './calendarImpl'
import { monthCodeNumberToMonth } from './calendarMonthCode'
import { DurationFields, durationTimeFieldDefaults } from './durationFields'
import {
  computeDurationSign,
  durationHasDateParts,
  durationOnlyTimeToBigNano,
  durationTimeToBigNano,
  getMaxDurationUnit,
} from './durationMath'
import { epochDaysToIsoDate, isoDateToEpochDays } from './epochMath'
import * as errorMessages from './errorMessages'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  CalendarYearMonthFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { addIsoMonths } from './isoCalendarMath'
import { ZonedEpochNanoFields } from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
} from './temporalLimits'
import { nanoToTimeAndDay, timeFieldsToNano } from './timeFieldMath'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneMath'
import { Unit } from './units'
import { clampEntity, throwRangeError } from './utils'

// Naming throughout this file. `move<Thing>` takes a DurationFields and
// returns a moved value of the same kind. `move<Thing>By<Delta>` does the same
// but takes raw counts (years/months, weeks/days, nanoseconds) instead of a
// duration. `add*` is different in kind: numbers in, numbers out, arithmetic on
// calendar year/month coordinates rather than on a date value.

// Pre-refined value movement
// -----------------------------------------------------------------------------
// Entry points that public add/subtract paths reach after refining their
// arguments, one per value kind: YearMonth, ZonedDateTime, PlainDateTime,
// PlainTime, and Instant. Each applies the range checks its type requires.

export function moveYearMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  durationSlots: DurationFields,
  overflow: Overflow = Overflow.Constrain,
): CalendarDateFields {
  if (
    computeDurationSign(durationSlots) &&
    getMaxDurationUnit(durationSlots) < Unit.Month
  ) {
    throwRangeError(errorMessages.invalidSmallUnits)
  }

  // Overflow has already been observed before lower-unit validation above.
  const first = checkIsoDateInBounds(moveToStartOfMonth(calendar, isoDate))
  return moveToStartOfMonth(
    calendar,
    moveDate(calendar, first, durationSlots, overflow),
  )
}

// A YearMonth move starts and ends at the calendar month's first ISO date.
// Validate the intermediate dates even though the final type has month precision.
export function moveYearMonthByUnits(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  years: number,
  months: number,
  overflow: Overflow,
): CalendarDateFields {
  const first = checkIsoDateInBounds(moveToStartOfMonth(calendar, isoDate))
  const moved =
    years || months
      ? checkIsoDateInBounds(
          moveDateByCalendarUnits(calendar, first, years, months, overflow),
        )
      : first
  return moveToStartOfMonth(calendar, moved)
}

/*
Pass the original zoned slots object when possible so zonedEpochSlotsToIso's
WeakMap memoization can reuse repeated offset/ISO conversions.

Mirrors AddZonedDateTime, which range-checks twice: the intermediate ISO date
via CalendarDateAdd (the `moveDate` below) and the resulting epoch-nanoseconds
via IsValidEpochNanoseconds. Both are mandatory, so there is no unchecked
variant of this function — see MarkerMoveOps.
*/
export function moveZonedEpochSlots(
  slots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  durationFields: DurationFields,
  overflow: Overflow = Overflow.Constrain,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { calendar, epochNanoseconds: epochNano, timeZone } = slots
  const timeOnlyNano = durationTimeToBigNano(durationFields)
  let movedEpochNano = epochNano

  if (!durationHasDateParts(durationFields)) {
    movedEpochNano += timeOnlyNano
  } else {
    const isoDateTime = zonedEpochSlotsToIso(slots)
    const movedIsoDateFields = moveDate(
      calendar,
      isoDateTime,
      {
        ...durationFields, // date parts
        ...durationTimeFieldDefaults, // ZERO-OUT time parts
      },
      overflow,
    )
    movedEpochNano =
      getSingleInstantFor(
        timeZone,
        combineDateAndTime(movedIsoDateFields, isoDateTime),
      ) + timeOnlyNano
  }

  return {
    ...slots,
    epochNanoseconds: checkEpochNanoInBounds(movedEpochNano),
  }
}

/*
Mirrors AddDateTime. The date-time range check here subsumes the date-level one
moveDate already applied: same date range, plus the rejection of lower-edge
midnight that only PlainDateTime imposes.
*/
export function moveDateTime(
  calendar: CalendarImpl,
  isoDateTime: CalendarDateTimeFields,
  durationFields: DurationFields,
  overflow: Overflow = Overflow.Constrain,
): CalendarDateTimeFields {
  // could have over 24 hours in certain zones
  const [movedTimeFields, dayDelta] = moveTime(isoDateTime, durationFields)

  const movedIsoDateFields = moveDate(
    calendar,
    isoDateTime,
    {
      ...durationFields, // date parts
      ...durationTimeFieldDefaults, // time parts (zero-out so no balancing-up to days)
      days: durationFields.days + dayDelta,
    },
    overflow,
  )

  return checkIsoDateTimeInBounds(
    combineDateAndTime(movedIsoDateFields, movedTimeFields),
  )
}

// The ISO date and time are already valid. Only the combined result is checked;
// a standalone Instant check would incorrectly reject plain date-time edges.
export function moveDateTimeByNano(
  fields: CalendarDateTimeFields,
  delta: bigint,
): CalendarDateTimeFields {
  const [time, days] = moveTimeByNano(fields, delta)
  return checkIsoDateTimeInBounds(
    combineDateAndTime(moveDateByDays(fields, days), time),
  )
}

export function moveTime(
  timeFields: TimeFields,
  durationFields: DurationFields,
): [TimeFields, number] {
  return moveTimeByNano(timeFields, durationTimeToBigNano(durationFields))
}

export function moveEpochNano(
  epochNano: bigint,
  durationFields: DurationFields,
): bigint {
  return moveEpochNanoByNano(
    epochNano,
    durationOnlyTimeToBigNano(durationFields),
  )
}

// Date movement
// -----------------------------------------------------------------------------
// Move an ISO date by a duration, mirroring CalendarDateAdd. Calendar units
// route through the month arithmetic below; day/week units stay in ISO space.

/*
Mirrors CalendarDateAdd, including its ISODateWithinLimits rejection. That check
is date-level: checkIsoDateInBounds probes the date at noon, so it admits the
extra ISO day at each edge that PlainDateTime only partly allows. Relative
rounding leans on exactly that — see moveRelativeMarkerToEpochNano.

Skips the calendar if moving days only.
*/
export function moveDate(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  durationFields: DurationFields,
  overflow: Overflow = Overflow.Constrain,
): CalendarDateFields {
  let { years, months, weeks, days } = durationFields
  let movedIsoDate: CalendarDateFields

  days += Number(durationTimeToBigNano(durationFields) / bigNanoInUtcDay)

  if (years || months) {
    movedIsoDate = moveDateByCalendarUnits(
      calendar,
      isoDate,
      years,
      months,
      overflow,
    )
  } else if (weeks || days) {
    movedIsoDate = isoDate
  } else {
    return isoDate
  }

  if (weeks || days) {
    movedIsoDate = moveDateByDays(movedIsoDate, weeks * 7 + days)
  }

  return checkIsoDateInBounds(movedIsoDate)
}

// Calendar date operations
// -----------------------------------------------------------------------------
// Operations on ISO dates that need the calendar's view of months: snap to the
// first of the month, or add years/months with overflow handling.

export function moveToStartOfMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
): CalendarDateFields {
  const dayOfMonth = computeCalendarDateFields(calendar, isoDate).day
  return moveDateByDays(isoDate, 1 - dayOfMonth)
}

export function moveDateByCalendarUnits(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  years: number,
  months: number,
  overflow: Overflow,
): CalendarDateFields {
  const dateParts = computeCalendarDateFields(calendar, isoDate)
  let { year, month, day } = dateParts

  if (years) {
    const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
      calendar,
      year,
      month,
    )
    year += years
    month = resolveMonthInMovedYear(
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
    const yearMonthParts = addCalendarMonths(calendar, year, month, months)
    ;({ year, month } = yearMonthParts)
  }

  day = clampEntity(
    'day',
    day,
    1,
    computeCalendarDaysInMonthForYearMonth(calendar, year, month),
    overflow,
  )

  return computeCalendarIsoFieldsFromParts(calendar, year, month, day)
}

// Calendar coordinate helpers
// -----------------------------------------------------------------------------
// Arithmetic on calendar year/month coordinates rather than ISO dates, including
// the leap-month resolution used when a month code does not exist in the target
// year.

export function addCalendarMonths(
  calendar: CalendarImpl,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  return calendar
    ? calendar.addMonths(year, month, monthDelta)
    : addIsoMonths(year, month, monthDelta)
}

// Year arithmetic keeps the source monthCode and re-resolves it as an ordinal
// month in the destination year, which may or may not contain that leap month.
export function resolveMonthInMovedYear(
  calendar: CalendarImpl,
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
      throwRangeError(errorMessages.invalidLeapMonth)
    }

    // Chinese/Dangi-style calendars constrain MxxL to the matching common Mxx.
    // Hebrew has a fixed Adar I leap slot; constraining it lands in common Adar.
    return leapMonthMeta! < 0 ? -leapMonthMeta! : monthCodeNumber
  }

  return monthCodeNumberToMonth(monthCodeNumber, false, targetLeapMonth)
}

// Fixed day and nanosecond primitives
// -----------------------------------------------------------------------------
// Calendar-free movement: shift time fields by nanoseconds (carrying days),
// shift an epoch by nanoseconds, and shift an ISO date by whole days.

// Balance in bigint space before converting the within-day remainder to Number.
// The returned day carry is for date-time movement; PlainTime discards it.
export function moveTimeByNano(
  timeFields: TimeFields,
  durationBigNano: bigint,
): [TimeFields, number] {
  const durDays = Number(durationBigNano / bigNanoInUtcDay)
  const durTimeNano = Number(durationBigNano % bigNanoInUtcDay)
  const [newTimeFields, overflowDays] = nanoToTimeAndDay(
    timeFieldsToNano(timeFields) + durTimeNano,
  )
  return [newTimeFields, durDays + overflowDays]
}

// Exact epoch movement is shared by Instant and zoned time-unit helpers.
export function moveEpochNanoByNano(
  epochNano: bigint,
  deltaNano: bigint,
): bigint {
  return checkEpochNanoInBounds(epochNano + deltaNano)
}

export function moveDateByDays(
  isoDate: CalendarDateFields,
  days: number,
): CalendarDateFields {
  if (days) {
    return epochDaysToIsoDate(isoDateToEpochDays(isoDate) + days)
  }
  return isoDate
}
