import { type ExoticCalendarWithoutId } from '../../internal/calendarImpl'
import { isoArgsToEpochDays } from '../../internal/epochMath'
import {
  type CalendarDateFields,
  type CalendarEraFields,
} from '../../internal/fieldTypes'
import {
  addIsoMonths,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoYearMonthFieldsForMonthDay,
  diffIsoMonthSlots,
  isoEpochFirstLeapYear,
  isoMonthsInYear,
} from '../../internal/isoCalendarMath'
import { milliInUtcDay } from '../../internal/units'

export interface GregoryAlignedCalendarConfig {
  isoYearOffset?: number // why would someone NOT specify this?
  eraOrigins?: Record<string, number>
  erasBeginMidYear?: boolean
  computeEraFields?(
    isoDate: CalendarDateFields,
    calendarYear: number,
  ): CalendarEraFields
}

export function createGregoryAlignedCalendar(
  config: GregoryAlignedCalendarConfig,
): ExoticCalendarWithoutId {
  const isoYearOffset = config.isoYearOffset || 0

  function calendarYearToIsoYear(year: number) {
    return year - isoYearOffset
  }

  function isoYearToCalendarYear(year: number) {
    return year + isoYearOffset
  }

  return {
    eraOrigins: config.eraOrigins,
    monthDayReferenceYear: isoEpochFirstLeapYear + isoYearOffset,
    erasBeginMidYear: config.erasBeginMidYear,
    computeDateFields(isoDate) {
      return {
        ...isoDate,
        year: isoYearToCalendarYear(isoDate.year),
      }
    },
    computeIsoFieldsFromParts(year, month, day) {
      return computeIsoFieldsFromParts(calendarYearToIsoYear(year), month, day)
    },
    computeEpochMilli(year, month, day) {
      return (
        isoArgsToEpochDays(calendarYearToIsoYear(year), month, day) *
        milliInUtcDay
      )
    },
    computeMonthCodeParts(_year, month) {
      return computeIsoMonthCodeParts(month)
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth) {
      const yearMonth = computeIsoYearMonthFieldsForMonthDay(
        monthCodeNumber,
        isLeapMonth,
      )
      return (
        yearMonth && {
          year: isoYearToCalendarYear(yearMonth.year),
          month: yearMonth.month,
        }
      )
    },
    computeInLeapYear(year) {
      return computeIsoInLeapYear(calendarYearToIsoYear(year))
    },
    computeMonthsInYear() {
      return isoMonthsInYear
    },
    computeDaysInMonth(year, month) {
      return computeIsoDaysInMonth(calendarYearToIsoYear(year), month)
    },
    computeDaysInYear(year) {
      return computeIsoDaysInYear(calendarYearToIsoYear(year))
    },
    computeLeapMonth() {
      return undefined
    },
    computeEraFields(isoDate) {
      return (
        config.computeEraFields?.(
          isoDate,
          isoYearToCalendarYear(isoDate.year),
        ) || {}
      )
    },
    addMonths(year, month, monthDelta) {
      const yearMonth = addIsoMonths(
        calendarYearToIsoYear(year),
        month,
        monthDelta,
      )
      return {
        year: isoYearToCalendarYear(yearMonth.year),
        month: yearMonth.month,
      }
    },
    diffMonthSlots(year0, month0, year1, month1) {
      return diffIsoMonthSlots(
        calendarYearToIsoYear(year0),
        month0,
        calendarYearToIsoYear(year1),
        month1,
      )
    },
  }
}
