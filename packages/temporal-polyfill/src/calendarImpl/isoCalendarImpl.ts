import { diffDaysMilli, isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/isoMath'
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

  daysInMonth(year: number, month: number): number {
    return diffDaysMilli(
      isoToEpochMilli(year, month),
      isoToEpochMilli(year, month + 1),
    )
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
