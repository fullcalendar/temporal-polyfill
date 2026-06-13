import { type ExoticCalendarWithoutId } from '../../internal/calendarImpl'
import {
  type MonthCodeParts,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from '../../internal/calendarMonthCode'
import {
  epochDaysToIsoDate,
  isoDateToEpochDays,
} from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  type CalendarDateFields,
  type CalendarEraFields,
  type CalendarYearMonthFields,
} from '../../internal/fieldTypes'
import { milliInUtcDay } from '../../internal/units'
import { compareNumbers, memoize, noop, throwRangeError } from '../../internal/utils'
import { unixEpochJulianDay } from './gregoryJulianDay'

export interface ArithmeticCalendarParts extends CalendarDateFields {
  era?: string
  eraYear?: number
}

export interface ArithmeticCalendarOps {
  eraOrigins?: Record<string, number>
  leapMonthMeta?: number
  monthDayLeapMonthMaxDays?: Record<number, number>
  monthDayCommonMonthMaxDay?: number
  monthDayReferenceYear?: number
  computeYearFromEra?: ExoticCalendarWithoutId['computeYearFromEra']
  constrainPlainMonthDay?: ExoticCalendarWithoutId['constrainPlainMonthDay']
  fromJulianDay(julianDay: number): ArithmeticCalendarParts
  toJulianDay(year: number, month: number, day: number): number
  computeDaysInMonth(year: number, month: number): number
  computeDaysInYear(year: number): number
  computeMonthsInYear(year: number): number
  computeInLeapYear(year: number): boolean
  computeLeapMonth?(year: number): number | undefined
  computeMonthCodeParts?(year: number, month: number): MonthCodeParts
  computeYearMonthFieldsForMonthDay?(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): CalendarYearMonthFields | undefined
  computeEraFields?(parts: ArithmeticCalendarParts): CalendarEraFields
}

// Julian Day for ISO 1972-12-31, the package's default month-day reference.
const monthDayReferenceJulianDay = 2441683

export function createArithmeticCalendar(
  ops: ArithmeticCalendarOps,
): ExoticCalendarWithoutId {
  const monthDayReferenceDate = ops.fromJulianDay(monthDayReferenceJulianDay)

  const fromIsoDate = memoize(
    (isoDate: CalendarDateFields) =>
      ops.fromJulianDay(isoDateToEpochDays(isoDate) + unixEpochJulianDay),
    WeakMap,
  )

  function computeDefaultMonthCodeParts(
    year: number,
    month: number,
  ): MonthCodeParts {
    const leapMonth = ops.computeLeapMonth?.(year)
    return [monthToMonthCodeNumber(month, leapMonth), month === leapMonth]
  }

  function computeDefaultYearMonthFieldsForMonthDay(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ) {
    isLeapMonth = Boolean(isLeapMonth)
    let referenceYear = ops.monthDayReferenceYear || monthDayReferenceDate.year
    const [referenceMonthCodeNumber, referenceIsLeapMonth] =
      computeDefaultMonthCodeParts(
        monthDayReferenceDate.year,
        monthDayReferenceDate.month,
      )

    if (
      (compareNumbers(monthCodeNumber, referenceMonthCodeNumber) ||
        compareNumbers(Number(isLeapMonth), Number(referenceIsLeapMonth)) ||
        compareNumbers(day, monthDayReferenceDate.day)) === 1
    ) {
      referenceYear--
    }

    // Month-day reference slots need a year that can actually represent the
    // requested month-code/day. Search near the package's ISO-leap-year
    // reference so leap-only days such as Coptic M13-06 or Hebrew M05L work
    // without forcing every calendar to carry a custom table.
    for (let yearDelta = 0; yearDelta < 100; yearDelta++) {
      for (const year of [
        referenceYear - yearDelta,
        referenceYear + yearDelta,
      ]) {
        const leapMonth = ops.computeLeapMonth?.(year)
        const month = monthCodeNumberToMonth(
          monthCodeNumber,
          isLeapMonth,
          leapMonth,
        )

        if (
          month <= ops.computeMonthsInYear(year) &&
          isLeapMonth === (month === leapMonth) &&
          day <= ops.computeDaysInMonth(year, month)
        ) {
          return { year, month }
        }
      }
    }
  }

  return {
    eraOrigins: ops.eraOrigins,
    leapMonthMeta: ops.leapMonthMeta,
    monthDayLeapMonthMaxDays: ops.monthDayLeapMonthMaxDays,
    monthDayCommonMonthMaxDay: ops.monthDayCommonMonthMaxDay,
    monthDayReferenceYear: ops.monthDayReferenceYear,
    computeYearFromEra: ops.computeYearFromEra,
    constrainPlainMonthDay: ops.constrainPlainMonthDay,
    computeDateFields: fromIsoDate,
    computeIsoFieldsFromParts(year, month, day) {
      return epochDaysToIsoDate(
        ops.toJulianDay(year, month, day) - unixEpochJulianDay,
      )
    },
    computeEpochMilli(year, month = 1, day = 1) {
      return (
        (ops.toJulianDay(year, month, day) - unixEpochJulianDay) * milliInUtcDay
      )
    },
    computeMonthCodeParts(year, month) {
      return (ops.computeMonthCodeParts || computeDefaultMonthCodeParts)(
        year,
        month,
      )
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      return (
        // A computeYearMonthFieldsForMonthDay function could return undefined,
        // indicating it wants the fallback
        ops.computeYearMonthFieldsForMonthDay?.(
          monthCodeNumber,
          isLeapMonth,
          day,
        ) ||
        computeDefaultYearMonthFieldsForMonthDay(
          monthCodeNumber,
          isLeapMonth,
          day,
        )
      )
    },
    computeInLeapYear: ops.computeInLeapYear,
    computeMonthsInYear: ops.computeMonthsInYear,
    computeDaysInMonth: ops.computeDaysInMonth,
    computeDaysInYear: ops.computeDaysInYear,
    computeLeapMonth: ops.computeLeapMonth || noop,
    computeEraFields(isoDate) {
      const parts = fromIsoDate(isoDate)
      return ops.computeEraFields
        ? ops.computeEraFields(parts)
        : { era: parts.era, eraYear: parts.eraYear }
    },
    addMonths(year, month, monthDelta) {
      return addArithmeticMonths(
        ops.computeMonthsInYear,
        year,
        month,
        monthDelta,
      )
    },
    diffMonthSlots(year0, month0, year1, month1) {
      return diffArithmeticMonthSlots(
        ops.computeMonthsInYear,
        year0,
        month0,
        year1,
        month1,
      )
    },
  }
}

function addArithmeticMonths(
  computeMonthsInYear: ArithmeticCalendarOps['computeMonthsInYear'],
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throwRangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeMonthsInYear(--year)
      }
    } else {
      let monthsInYear: number
      while (month > (monthsInYear = computeMonthsInYear(year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return { year, month }
}

function diffArithmeticMonthSlots(
  computeMonthsInYear: ArithmeticCalendarOps['computeMonthsInYear'],
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  const cmp = compareNumbers(year0, year1) || compareNumbers(month0, month1)

  if (!cmp) {
    return 0
  }

  if (year0 === year1) {
    return month1 - month0
  }

  if (cmp < 0) {
    let months = computeMonthsInYear(year0) - month0 + month1
    for (let year = year0 + 1; year < year1; year++) {
      months += computeMonthsInYear(year)
    }
    return months
  }

  // Backward diffs are the negative of the same forward walk. Swapping the
  // endpoints makes the recursive call enter the cmp < 0 branch immediately,
  // so this is at most one level of recursion.
  return -diffArithmeticMonthSlots(
    computeMonthsInYear,
    year1,
    month1,
    year0,
    month0,
  )
}
