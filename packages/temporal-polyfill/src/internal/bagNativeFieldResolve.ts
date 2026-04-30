import { eraRemapsByCalendarId, normalizeEraName } from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import {
  eraYearToYear,
  getCalendarEraOrigins,
  getCalendarLeapMonthMeta,
  monthCodeNumberToMonth,
  parseMonthCode,
} from './calendarNative'
import type { MonthCodeParts } from './calendarNative'
import {
  queryNativeDaysInMonthPart,
  queryNativeLeapMonth,
  queryNativeMonthsInYearPart,
} from './calendarNativeQuery'
import { toInteger } from './cast'
import * as errorMessages from './errorMessages'
import { DateBag, DayFields, MonthFields } from './fields'
import { Overflow } from './optionsModel'
import { clampEntity, clampProp } from './utils'

/*
These helpers run after the user bag has already been read in sorted field
order. Year/eraYear numeric coercion intentionally lives here because the
from-fields algorithms need required-field and monthCode syntax checks to
happen before those deferred coercions.
*/

export function resolveYear(calendarId: string, fields: DateBag): number {
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  const eraRemaps =
    eraRemapsByCalendarId[computeCalendarIdBase(calendarId)] || {}
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

    // Ethiopic's AA era counts from an offset epoch instead of using the
    // forward/reverse year scheme used by Gregorian/ROC/Japanese eras.
    if (
      computeCalendarIdBase(calendarId) === 'ethiopic' &&
      normalizedEra === 'aa'
    ) {
      const yearByEra = eraYear - 5500
      if (year !== undefined && year !== yearByEra) {
        throw new RangeError(errorMessages.mismatchingYearAndEra)
      }

      year = yearByEra
    } else {
      if (eraOrigin === undefined) {
        throw new RangeError(errorMessages.invalidEra(era))
      }

      const yearByEra = eraYearToYear(eraYear, eraOrigin)
      if (year !== undefined && year !== yearByEra) {
        throw new RangeError(errorMessages.mismatchingYearAndEra)
      }

      year = yearByEra
    }
  } else if (year === undefined) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }

  return year
}

export function resolveMonth(
  calendarId: string,
  fields: Partial<MonthFields>,
  year: number,
  overflow: Overflow,
  monthCodeParts?: MonthCodeParts,
): number {
  let { month, monthCode } = fields

  if (monthCode !== undefined) {
    const monthByCode = resolveMonthCode(
      calendarId,
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
    queryNativeMonthsInYearPart(calendarId, year),
    overflow,
  )
}

export function resolveDay(
  calendarId: string,
  fields: DayFields,
  month: number,
  year: number,
  overflow?: Overflow,
): number {
  return clampProp(
    fields,
    'day',
    1,
    queryNativeDaysInMonthPart(calendarId, year, month),
    overflow,
  )
}

function resolveMonthCode(
  calendarId: string,
  monthCode: string,
  year: number,
  overflow: Overflow,
  monthCodeParts = parseMonthCode(monthCode),
) {
  const leapMonth = queryNativeLeapMonth(calendarId, year)
  const [monthCodeNumber, wantsLeapMonth] = monthCodeParts
  let month = monthCodeNumberToMonth(monthCodeNumber, wantsLeapMonth, leapMonth)

  if (wantsLeapMonth) {
    const leapMonthMeta = getCalendarLeapMonthMeta({ id: calendarId })

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
