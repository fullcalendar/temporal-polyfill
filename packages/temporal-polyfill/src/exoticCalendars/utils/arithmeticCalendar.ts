import {
  type MonthCodeParts,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from '../../internal/calendarMonthCode'
import { type ExoticCalendar } from '../../internal/calendarSlot'
import {
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  type CalendarDateFields,
  type CalendarEraFields,
  type CalendarYearMonthFields,
} from '../../internal/fieldTypes'
import {
  computeIsoDaysInMonth,
  isoMonthsInYear,
} from '../../internal/isoCalendarMath'
import { milliInDay } from '../../internal/units'
import { compareNumbers, memoize } from '../../internal/utils'

export interface ArithmeticCalendarParts extends CalendarDateFields {
  era?: string
  eraYear?: number
}

export interface ArithmeticCalendarOps {
  id: string
  eraOrigins?: Record<string, number>
  eraRemaps?: Record<string, string>
  leapMonthMeta?: number
  plainMonthDayLeapMonthMaxDays?: Record<number, number>
  plainMonthDayCommonMonthMaxDay?: number
  monthDayReferenceYear?: number
  computeYearFromEra?: ExoticCalendar['computeYearFromEra']
  constrainPlainMonthDay?: ExoticCalendar['constrainPlainMonthDay']
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

// Adobe's calendar algorithms use Julian Day numbers. Julian Day 2440588 is
// the civil day containing Unix epoch midnight, so the Temporal epoch-day bridge
// is exact and avoids Date.UTC year quirks.
const unixEpochJulianDay = 2440588

function epochMilliToJulianDay(epochMilli: number): number {
  return diffEpochMilliDays(0, epochMilli) + unixEpochJulianDay
}

function julianDayToEpochMilli(julianDay: number): number {
  return (julianDay - unixEpochJulianDay) * milliInDay
}

export function createArithmeticCalendar(ops: ArithmeticCalendarOps) {
  const fromEpochMilli = memoize((epochMilli: number) =>
    ops.fromJulianDay(epochMilliToJulianDay(epochMilli)),
  )

  function computeDateFieldsFromEpochMilli(epochMilli: number) {
    const { year, month, day } = fromEpochMilli(epochMilli)
    return { year, month, day }
  }

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
    const referenceDate = computeDateFieldsFromEpochMilli(
      isoArgsToEpochMilli(1972, 12, 31)!,
    )
    let referenceYear = ops.monthDayReferenceYear || referenceDate.year
    const [referenceMonthCodeNumber, referenceIsLeapMonth] =
      computeDefaultMonthCodeParts(referenceDate.year, referenceDate.month)

    if (
      (compareNumbers(monthCodeNumber, referenceMonthCodeNumber) ||
        compareNumbers(Number(isLeapMonth), Number(referenceIsLeapMonth)) ||
        compareNumbers(day, referenceDate.day)) === 1
    ) {
      referenceYear--
    }

    // PlainMonthDay reference slots need a year that can actually represent
    // the requested month-code/day. Search near the package's ISO-leap-year
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

  const calendar: ExoticCalendar = {
    id: ops.id,
    eraOrigins: ops.eraOrigins,
    eraRemaps: ops.eraRemaps,
    leapMonthMeta: ops.leapMonthMeta,
    plainMonthDayLeapMonthMaxDays: ops.plainMonthDayLeapMonthMaxDays,
    plainMonthDayCommonMonthMaxDay: ops.plainMonthDayCommonMonthMaxDay,
    monthDayReferenceYear: ops.monthDayReferenceYear,
    computeYearFromEra: ops.computeYearFromEra,
    constrainPlainMonthDay: ops.constrainPlainMonthDay,
    computeDateFields(isoDate) {
      return computeDateFieldsFromEpochMilli(isoDateToEpochMilli(isoDate)!)
    },
    computeIsoFieldsFromParts(year, month, day) {
      const isoDate = epochMilliToIsoDateTime(
        calendar.computeEpochMilli(year, month, day),
      )

      if (
        isoDate.month < 1 ||
        isoDate.month > isoMonthsInYear ||
        isoDate.day < 1 ||
        isoDate.day > computeIsoDaysInMonth(isoDate.year, isoDate.month)
      ) {
        throw new RangeError(errorMessages.outOfBoundsDate)
      }

      return isoDate
    },
    computeEpochMilli(year, month = 1, day = 1) {
      return julianDayToEpochMilli(ops.toJulianDay(year, month, day))
    },
    computeMonthCodeParts(year, month) {
      return ops.computeMonthCodeParts
        ? ops.computeMonthCodeParts(year, month)
        : computeDefaultMonthCodeParts(year, month)
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      return (
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
    computeLeapMonth(year) {
      return ops.computeLeapMonth?.(year)
    },
    computeEraFields(isoDate) {
      const parts = fromEpochMilli(isoDateToEpochMilli(isoDate)!)
      return ops.computeEraFields
        ? ops.computeEraFields(parts)
        : { era: parts.era, eraYear: parts.eraYear }
    },
    addMonths(year, month, monthDelta) {
      return addArithmeticMonths(calendar, year, month, monthDelta)
    },
    diffMonthSlots(year0, month0, year1, month1) {
      return diffArithmeticMonthSlots(calendar, year0, month0, year1, month1)
    },
    isConstrainedFinalIntercalaryMonthDiff(
      sign,
      year0,
      month0,
      day0,
      year1,
      month1,
      day1,
    ) {
      return isConstrainedFinalIntercalaryMonthDiff(
        calendar,
        sign,
        year0,
        month0,
        day0,
        year1,
        month1,
        day1,
      )
    },
  }

  return calendar
}

function addArithmeticMonths(
  calendar: ExoticCalendar,
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
        month += calendar.computeMonthsInYear(--year)
      }
    } else {
      let monthsInYear: number
      while (month > (monthsInYear = calendar.computeMonthsInYear(year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return { year, month }
}

function diffArithmeticMonthSlots(
  calendar: ExoticCalendar,
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
    let months = calendar.computeMonthsInYear(year0) - month0 + month1
    for (let year = year0 + 1; year < year1; year++) {
      months += calendar.computeMonthsInYear(year)
    }
    return months
  }

  return -diffArithmeticMonthSlots(calendar, year1, month1, year0, month0)
}

function isConstrainedFinalIntercalaryMonthDiff(
  calendar: ExoticCalendar,
  sign: number,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): boolean {
  const monthsInYear0 = calendar.computeMonthsInYear(year0)
  const monthsInYear1 = calendar.computeMonthsInYear(year1)

  return (
    sign < 0 &&
    monthsInYear0 > isoMonthsInYear &&
    monthsInYear1 > isoMonthsInYear &&
    month0 === monthsInYear0 &&
    month1 === monthsInYear1 &&
    day0 === calendar.computeDaysInMonth(year0, month0) &&
    day1 === calendar.computeDaysInMonth(year1, month1) &&
    day0 > day1
  )
}
