import {
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import { type CalendarImpl, gregoryCalendarImpl } from './calendarImpl'
import type { MonthCodeParts } from './calendarMonthCode'
import { monthCodeNumberToMonth, parseMonthCode } from './calendarMonthCode'
import { toIntegerWithTrunc } from './cast'
import * as errorMessages from './errorMessages'
import { DateFields, DayFields, MonthFields } from './fieldTypes'
import { gregoryEraOrigins, normalizeEraName } from './intlCalendarConfig'
import { Overflow } from './optionsModel'
import {
  clampEntity,
  clampProp,
  throwRangeError,
  throwTypeError,
} from './utils'

export function getCalendarEraOrigins(
  calendar: CalendarImpl,
): Record<string, number> | undefined {
  return calendar === gregoryCalendarImpl
    ? gregoryEraOrigins
    : calendar
      ? calendar.eraOrigins
      : undefined
}

export function getCalendarFieldNames(
  calendar: CalendarImpl,
  fieldNames: readonly string[],
  fieldNamesWithEra: readonly string[] = fieldNames,
): readonly string[] {
  // Both inputs are caller-owned, pre-sorted lists. Calendars with eras swap in
  // the explicit era-bearing variant instead of building field order here.
  return getCalendarEraOrigins(calendar) ? fieldNamesWithEra : fieldNames
}

/*
These helpers run after the user bag has already been read in sorted field
order. Year/eraYear numeric coercion intentionally lives here because the
from-fields algorithms need required-field and monthCode syntax checks to
happen before those deferred coercions.
*/

export function resolveCalendarYear(
  calendar: CalendarImpl,
  fields: Partial<DateFields>,
): number {
  const exoticCalendar = calendar || undefined
  const eraOrigins = getCalendarEraOrigins(calendar)
  let { era, eraYear, year } = fields

  if (year !== undefined) {
    year = toIntegerWithTrunc(year as number, 'year')
  }
  if (eraYear !== undefined) {
    eraYear = toIntegerWithTrunc(eraYear as number, 'eraYear')
  }

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throwTypeError(errorMessages.mismatchingEraParts)
    }

    if (!eraOrigins) {
      throwRangeError(errorMessages.forbiddenEraParts)
    }

    const normalizedEra = normalizeEraName(era)
    const eraOrigin = eraOrigins[normalizedEra]

    if (eraOrigin === undefined) {
      throwRangeError(errorMessages.invalidEra(era))
    }

    // ISO/Gregory use the compact era-origin convention directly. External
    // calendars get the last word because a few era systems count from an
    // offset epoch instead of the usual forward/reverse origin.
    const yearByEra = exoticCalendar?.computeYearFromEra
      ? exoticCalendar.computeYearFromEra(eraYear, normalizedEra, eraOrigin)
      : eraYearToYear(eraYear, eraOrigin)

    if (year !== undefined && year !== yearByEra) {
      throwRangeError(errorMessages.mismatchingYearAndEra)
    }

    year = yearByEra
  } else if (year === undefined) {
    throwTypeError(errorMessages.missingYear(eraOrigins))
  }

  return year
}

export function resolveCalendarMonth(
  calendar: CalendarImpl,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow,
  monthCodeParts?: MonthCodeParts,
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = resolveMonthCode(
      calendar,
      monthCode,
      year,
      overflow,
      monthCodeParts,
    )

    if (month !== undefined && month !== monthByCode) {
      throwRangeError(errorMessages.mismatchingMonthAndCode)
    }

    month = monthByCode
    overflow = Overflow.Reject // monthCode parsing doesn't constrain
  } else if (month === undefined) {
    throwTypeError(errorMessages.missingMonth)
  }

  return clampEntity(
    'month',
    month,
    1,
    computeCalendarMonthsInYearForYear(calendar, year),
    overflow,
  )
}

export function resolveCalendarDay(
  calendar: CalendarImpl,
  fields: DayFields,
  month: number,
  year: number,
  overflow?: Overflow,
): number {
  return clampProp(
    fields,
    'day',
    1,
    computeCalendarDaysInMonthForYearMonth(calendar, year, month),
    overflow,
  )
}

function resolveMonthCode(
  calendar: CalendarImpl,
  monthCode: string,
  year: number,
  overflow: Overflow,
  monthCodeParts = parseMonthCode(monthCode),
) {
  const leapMonth = calendar ? calendar.computeLeapMonth(year) : undefined
  const [monthCodeNumber, wantsLeapMonth] = monthCodeParts
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = calendar ? calendar.leapMonthMeta : undefined

    // calendar does not support leap years
    if (leapMonthMeta === undefined) {
      throwRangeError(errorMessages.invalidLeapMonth)
    }

    // leap year has a maximum
    if (leapMonthMeta > 0) {
      if (month > leapMonthMeta) {
        throwRangeError(errorMessages.invalidLeapMonth)
      }

      // For variable-leap calendars (Chinese/Dangi), `leapMonth` is the
      // concrete calendar-month ordinal occupied by the requested leap
      // monthCode. A leap year can still have a *different* leap month, so the
      // leap monthCode is only available when the ordinals match exactly.
      if (leapMonth !== month) {
        if (overflow === Overflow.Reject) {
          throwRangeError(errorMessages.invalidLeapMonth)
        }
        month = monthCodeNumberToMonth(monthCodeNumber, false, leapMonth)
      }
    } else {
      // leap year is constant
      if (month !== -leapMonthMeta) {
        throwRangeError(errorMessages.invalidLeapMonth)
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throwRangeError(errorMessages.invalidLeapMonth)
        }
        // else, ex: M05L -> M06
      }
    }
  }

  return month
}

// Era origins use a signed offset convention: non-negative origins count
// forward, while negative origins count backward for "before" eras like BCE.
export function eraYearToYear(eraYear: number, eraOrigin: number): number {
  // Collapse the possible -0 result into Temporal's observable +0 year.
  return (eraOrigin + eraYear) * (Math.sign(eraOrigin) || 1) || 0
}
