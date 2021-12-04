import { isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/isoMath'
import { CalendarImpl } from './calendarImpl'

export class ISOCalendarImpl extends CalendarImpl {
  year(isoYear: number): number {
    return isoYear
  }

  month(_isoYear: number, isoMonth: number): number {
    return isoMonth
  }

  day(_isoYear: number, _isoMonth: number, isoDay: number): number {
    return isoDay
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

  monthYear(): number {
    return isoEpochLeapYear
  }
}

export const isoCalendarID = 'iso8601'
export const isoCalendarImpl = new ISOCalendarImpl(isoCalendarID)
