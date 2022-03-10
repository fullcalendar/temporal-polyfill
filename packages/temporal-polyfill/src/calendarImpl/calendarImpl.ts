import { numSign } from '../utils/math'
import { padZeros } from '../utils/string'
import { eraOrigins } from './eraOrigins'

export interface CalendarImplFields { // like DateFields, but without monthCode
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
  day: number
}

export interface CalendarImplFieldsDumb { // like CalendarImplFields, but with month string
  era: string | undefined
  eraYear: number | undefined
  year: number,
  month: string,
  day: number
}

export abstract class CalendarImpl {
  constructor(
    public id: string,
  ) {}

  // ISO -> Calendar-dependent

  abstract computeFields(epochMilli: number): CalendarImplFields

  // Calendar-dependent computation
  // caller is responsible for constraining given values

  abstract epochMilliseconds(year: number, month: number, day: number): number
  abstract daysInMonth(year: number, month: number): number
  abstract monthsInYear(year: number): number
  abstract inLeapYear(year: number): boolean
  abstract guessYearForMonthDay(monthCode: string, day: number): number
  abstract normalizeISOYearForMonthDay(isoYear: number): number

  // month -> monthCode
  monthCode(month: number, _year: number): string {
    return 'M' + padZeros(month, 2)
  }

  // monthCode -> month
  // not responsible for constraining
  // TODO: throw error when not starting with M?
  convertMonthCode(monthCode: string, _year: number): [
    number, // month
    boolean, // unusedLeap (a valid 'L', but not used in this year)
  ] {
    // TODO: more DRY
    const monthCodeIsLeap = /L$/.test(monthCode)
    const monthCodeInt = parseInt(monthCode.substr(1)) // chop off 'M'

    if (monthCodeIsLeap) {
      throw new RangeError('Calendar system doesnt support leap months') // TODO: more DRY
    }

    return [monthCodeInt, false]
  }
}

// eraYear -> year
export function convertEraYear(
  calendarID: string,
  eraYear: number,
  era: string,
  fromDateTimeFormat?: boolean,
): number {
  let origin = eraOrigins[getCalendarIDBase(calendarID)]?.[era]

  if (origin === undefined) {
    if (fromDateTimeFormat) {
      origin = 0
    } else {
      throw new Error('Unkown era ' + era)
    }
  }

  // see the origin format in the config file
  return (origin + eraYear) * (numSign(origin) || 1)
}

// TODO: somehow combine with convertEraYear
export function hasEras(calendarID: string): boolean {
  return eraOrigins[getCalendarIDBase(calendarID)] !== undefined
}

export function getCalendarIDBase(calendarID: string): string {
  return calendarID.split('-')[0]
}
