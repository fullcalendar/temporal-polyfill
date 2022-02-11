import { numSign } from '../utils/math'
import { padZeros } from '../utils/string'
import { eraOrigins } from './eraOrigins'

export abstract class CalendarImpl {
  constructor(
    public id: string,
  ) {}

  era(_isoYear: number, _isoMonth: number, _isoDay: number): string | undefined {
    return undefined
  }

  eraYear(_isoYear: number, _isoMonth: number, _isoDay: number): number | undefined {
    return undefined
  }

  // ISO -> Calendar-dependent

  abstract year(isoYear: number, isoMonth: number, isoDay: number): number
  abstract month(isoYear: number, isoMonth: number, isoDay: number): number
  abstract day(isoYear: number, isoMonth: number, isoDay: number): number

  // Calendar-dependent computation
  // caller is responsible for constraining given values

  abstract epochMilliseconds(year: number, month: number, day: number): number
  abstract daysInMonth(year: number, month: number): number
  abstract monthsInYear(year: number): number
  abstract inLeapYear(year: number): boolean
  abstract normalizeYearFromMonthCode(year: number | undefined, monthCode: string, day: number): number
  abstract normalizeYearFromMonth(year: number, month: number, day: number): number

  // month -> monthCode
  monthCode(month: number, _year: number): string {
    return 'M' + padZeros(month, 2)
  }

  // monthCode -> month
  // not responsible for constraining
  convertMonthCode(monthCode: string, _year: number): number {
    return parseInt(monthCode.substr(1)) // chop off 'M'
  }

  // eraYear -> year
  convertEraYear(eraYear: number, era: string, errorUnknownEra?: boolean): number {
    let origin = eraOrigins[this.id]?.[era]

    if (origin === undefined) {
      if (errorUnknownEra) {
        throw new Error('Unkown era ' + era)
      } else {
        origin = 0
      }
    }

    // see the origin format in the config file
    return (origin + eraYear) * (numSign(origin) || 1)
  }
}
