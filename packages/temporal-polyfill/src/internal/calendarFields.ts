import {
  computeCalendarDaysInMonthForYearMonth,
  computeCalendarMonthsInYearForYear,
} from './calendarDerived'
import type { MonthCodeParts } from './calendarMonthCode'
import { monthCodeNumberToMonth, parseMonthCode } from './calendarMonthCode'
import { toInteger } from './cast'
import * as errorMessages from './errorMessages'
import { type InternalCalendar, gregoryCalendar } from './externalCalendar'
import { DateFields, DayFields, MonthFields } from './fieldTypes'
import { gregoryEraOrigins, normalizeEraName } from './intlCalendarConfig'
import { Overflow } from './optionsModel'
import { clampEntity, clampProp } from './utils'

export function getCalendarEraOrigins(
  calendar: InternalCalendar,
): Record<string, number> | undefined {
  return calendar === gregoryCalendar
    ? gregoryEraOrigins
    : calendar
      ? calendar.eraOrigins
      : undefined
}

export function getCalendarFieldNames(
  calendar: InternalCalendar,
  fieldNames: string[],
  fieldNamesWithEra: string[] = fieldNames,
): string[] {
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
  calendar: InternalCalendar,
  fields: Partial<DateFields>,
): number {
  const externalCalendar = calendar || undefined
  const eraOrigins = getCalendarEraOrigins(calendar)
  const eraRemaps = externalCalendar?.eraRemaps || {}
  let { era, eraYear, year } = fields

  if (year !== undefined) {
    year = toInteger(year as number, 'year')
  }
  if (eraYear !== undefined) {
    eraYear = toInteger(eraYear as number, 'eraYear')
  }

  if (era !== undefined || eraYear !== undefined) {
    if (era === undefined || eraYear === undefined) {
      throw new TypeError(errorMessages.mismatchingEraParts)
    }

    if (!eraOrigins) {
      throw new RangeError(errorMessages.forbiddenEraParts)
    }

    const normalizedEra =
      eraRemaps[normalizeEraName(era)] || normalizeEraName(era)
    const eraOrigin = eraOrigins[normalizedEra]

    if (eraOrigin === undefined) {
      throw new RangeError(errorMessages.invalidEra(era))
    }

    // ISO/Gregory use the compact era-origin convention directly. External
    // calendars get the last word because a few era systems count from an
    // offset epoch instead of the usual forward/reverse origin.
    const yearByEra = externalCalendar?.computeYearFromEra
      ? externalCalendar.computeYearFromEra(eraYear, normalizedEra, eraOrigin)
      : eraYearToYear(eraYear, eraOrigin)
    if (year !== undefined && year !== yearByEra) {
      throw new RangeError(errorMessages.mismatchingYearAndEra)
    }

    year = yearByEra
  } else if (year === undefined) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }

  return year
}

export function resolveCalendarMonth(
  calendar: InternalCalendar,
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
      throw new RangeError(errorMessages.mismatchingMonthAndCode)
    }

    month = monthByCode
    overflow = Overflow.Reject // monthCode parsing doesn't constrain
  } else if (month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
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
  calendar: InternalCalendar,
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
  calendar: InternalCalendar,
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
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // leap year has a maximum
    if (leapMonthMeta > 0) {
      if (month > leapMonthMeta) {
        throw new RangeError(errorMessages.invalidLeapMonth)
      }

      // For variable-leap calendars (Chinese/Dangi), `leapMonth` is the
      // concrete calendar-month ordinal occupied by the requested leap
      // monthCode. A leap year can still have a *different* leap month, so the
      // leap monthCode is only available when the ordinals match exactly.
      if (leapMonth !== month) {
        if (overflow === Overflow.Reject) {
          throw new RangeError(errorMessages.invalidLeapMonth)
        }
        month = monthCodeNumberToMonth(monthCodeNumber, false, leapMonth)
      }
    } else {
      // leap year is constant
      if (month !== -leapMonthMeta) {
        throw new RangeError(errorMessages.invalidLeapMonth)
      }
      if (leapMonth === undefined) {
        if (overflow === Overflow.Reject) {
          throw new RangeError(errorMessages.invalidLeapMonth)
        }
        // else, ex: M05L -> M06
      }
    }
  }

  return month
}

export function eraYearToYear(eraYear: number, eraOrigin: number): number {
  // Era origins use calendarConfig's signed offset convention. The `|| 0`
  // collapses the possible -0 result into Temporal's observable +0 year.
  return (eraOrigin + eraYear) * (Math.sign(eraOrigin) || 1) || 0
}
