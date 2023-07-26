import { epochMilliToISOFields, isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/epoch'
import { CalendarImpl, CalendarImplFields } from './calendarImpl'

export class ISOCalendarImpl extends CalendarImpl {
  computeFields(epochMilli: number): CalendarImplFields {
    const fields = epochMilliToISOFields(epochMilli)
    return {
      era: undefined,
      eraYear: undefined,
      year: fields.isoYear,
      month: fields.isoMonth,
      day: fields.isoDay,
    }
  }

  epochMilliseconds(year: number, month: number, day: number): number {
    return isoToEpochMilli(year, month, day)
  }

  // will work for any year, not just years within valid Date range
  daysInMonth(year: number, month: number): number {
    if (month === 2) {
      return this.inLeapYear(year) ? 29 : 28
    }
    if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30
    }
    return 31
  }

  monthsInYear(): number {
    return 12
  }

  inLeapYear(year: number): boolean {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  }

  guessYearForMonthDay(): number {
    return isoEpochLeapYear
  }

  normalizeISOYearForMonthDay(): number {
    return isoEpochLeapYear
  }
}

export const isoCalendarID = 'iso8601'
export const isoCalendarImpl = new ISOCalendarImpl(isoCalendarID)
