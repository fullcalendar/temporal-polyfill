import { computeDaysInYear } from '../dateUtils/calendar'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import {
  addDaysMilli,
  diffDaysMilli,
  isoEpochOriginYear,
  isoToEpochMilli,
} from '../dateUtils/isoMath'
import { OrigDateTimeFormat } from '../native/intl'
import {
  CalendarImpl,
  CalendarImplFields,
  CalendarImplFieldsDumb,
  convertEraYear,
  getCalendarIDBase,
  hasEras,
} from './calendarImpl'

type MonthCache = [
  number[], // epochMillis
  string[], // monthStrs
  { [monthStr: string]: number }, // monthStrToNum (value is 1-based)
]

type LeapMonthInfo = [
  number, // month
  number, // totalMonths (in a leap year)
]

export class IntlCalendarImpl extends CalendarImpl {
  private format: Intl.DateTimeFormat

  // difference between iso year numbers and the calendar's at 1980
  private yearCorrection: number

  // epochMilli starting points for each month
  private monthCacheByYear: { [year: string]: MonthCache }

  private leapMonthInfo: LeapMonthInfo | false | undefined

  constructor(id: string) {
    const format = buildFormat(id)

    if (!isRelatedCalendar(id, format.resolvedOptions().calendar)) {
      throw new RangeError('Invalid calendar: ' + id)
    }

    super(id)
    this.format = format
    this.yearCorrection = this.computeFieldsDumb(0).year - isoEpochOriginYear
    this.monthCacheByYear = {}
  }

  epochMilliseconds(year: number, month: number, day: number): number {
    const epochMillis = this.queryMonthCache(year)[0]
    const marker = epochMillis[month - 1]

    // move to correct day-of-month
    return addDaysMilli(marker, day - 1)
  }

  daysInMonth(year: number, month: number): number {
    const epochMillis = this.queryMonthCache(year)[0]
    const startMarker = epochMillis[month - 1]

    // The `month` variable, which is 1-based, should now be considered an index for `monthCache`
    // It is +1 from the previous index, used to compute the `endMarker`
    if (month >= epochMillis.length) {
      year++
      month = 0
    }

    const endMarker = this.queryMonthCache(year)[0][month]
    return diffDaysMilli(startMarker, endMarker)
  }

  monthsInYear(year: number): number {
    const epochMillis = this.queryMonthCache(year)[0]
    return epochMillis.length
  }

  // month -> monthCode
  monthCode(month: number, year: number): string {
    const leapMonth = this.queryLeapMonthByYear(year)

    if (!leapMonth || month < leapMonth) {
      return super.monthCode(month, year)
    }

    return super.monthCode(month - 1, year) +
      (month === leapMonth ? 'L' : '')
  }

  // monthCode -> month
  convertMonthCode(monthCode: string, year: number): number {
    const leapMonthInfo = this.queryLeapMonthInfo()
    const monthCodeIsLeap = /L$/.test(monthCode)
    const monthCodeInt = parseInt(monthCode.substr(1)) // chop off 'M' // TODO: more DRY

    if (monthCodeIsLeap) {
      if (!leapMonthInfo) {
        throw new RangeError('Calendar system does not have leap months')
      }

      const monthStrs = this.queryMonthCache(year)[1]

      if (monthStrs.length !== leapMonthInfo[1]) {
        throw new RangeError('Particular year does not have leap month') // TODO: overflow
      }

      const leapMonth = leapMonthInfo[0]

      if (monthCodeInt !== leapMonth - 1) {
        throw new RangeError('Invalid leap-month month code')
      }

      if (monthCodeInt >= leapMonth) {
        return monthCodeInt + 1
      }
    }

    /*
    TODO:
    if year is really a leap year, and the #L doesn't match, always throw an error
    if year is NOT a leap year, and an L is given,
      if constraing (the default),
        put at end of previous month (how???)
      if reject,
        throw an error
    */

    return monthCodeInt
  }

  // TODO: look at number of months too?
  inLeapYear(year: number): boolean {
    const days = computeDaysInYear(this, year)
    return days > computeDaysInYear(this, year - 1) &&
      days > computeDaysInYear(this, year + 1)
  }

  guessYearForMonthDay(monthCode: string, day: number): number {
    let year = isoEpochOriginYear + this.yearCorrection
    const maxYear = year + 100

    for (; year < maxYear; year++) {
      const month = this.convertMonthCode(monthCode, year)
      if (
        month <= this.monthsInYear(year) &&
        day <= this.daysInMonth(year, month)
      ) {
        return year
      }
    }

    throw new Error('Could not guess year') // TODO: better error
  }

  normalizeISOYearForMonthDay(isoYear: number): number {
    return isoYear
  }

  computeFields(epochMilli: number): CalendarImplFields {
    const dumbFields = this.computeFieldsDumb(epochMilli)
    const monthStrToNum = this.queryMonthCache(dumbFields.year)[2]

    return {
      ...dumbFields,
      month: monthStrToNum[dumbFields.month],
    }
  }

  // returns a *string* month, not numeric
  private computeFieldsDumb(epochMilli: number): CalendarImplFieldsDumb {
    const partHash = hashIntlFormatParts(this.format, epochMilli)
    let era: string | undefined
    let eraYear: number | undefined
    let year = parseInt(partHash.relatedYear || partHash.year)

    if (partHash.era && hasEras(this.id)) {
      era = normalizeShortEra(partHash.era)
      eraYear = year
      year = convertEraYear(this.id, eraYear, era, true) // fromDateTimeFormat=true
    }

    return {
      era,
      eraYear,
      year,
      month: partHash.month,
      day: parseInt(partHash.day),
    }
  }

  // returns 0 if no leap month in year
  private queryLeapMonthByYear(year: number): number {
    const leapMonthInfo = this.queryLeapMonthInfo()
    const monthStrs = this.queryMonthCache(year)[1]

    if (leapMonthInfo && monthStrs.length === leapMonthInfo[1]) {
      return leapMonthInfo[0]
    }

    return 0
  }

  private queryLeapMonthInfo(): LeapMonthInfo | false {
    return this.leapMonthInfo ?? (this.leapMonthInfo = this.buildLeapMonthInfo())
  }

  private buildLeapMonthInfo(): LeapMonthInfo | false {
    for (let year = 2020; year < 2030; year++) {
      const prevMonthStrs = this.queryMonthCache(year - 1)[1]
      const currentMonthStrs = this.queryMonthCache(year)[1]

      if (currentMonthStrs.length > prevMonthStrs.length) {
        for (let i = 0; i < prevMonthStrs.length; i++) {
          if (prevMonthStrs[i] !== currentMonthStrs[i]) {
            return [
              i + 1, // month (1-based)
              currentMonthStrs.length, // totalMonths (in year)
            ]
          }
        }
      }
    }

    return false
  }

  private queryMonthCache(year: number): MonthCache {
    const { monthCacheByYear } = this

    return monthCacheByYear[year] ||
      (monthCacheByYear[year] = this.buildMonthCache(year))
  }

  private buildMonthCache(year: number): MonthCache {
    const epochMillis: number[] = []
    const monthStrs: string[] = []
    const monthStrToNum: { [monthStr: string]: number } = {}

    // either part-way through the desired year or very slightly before
    let epochMilli = isoToEpochMilli(this.guessISOYear(year))

    // ensure marker is in year+1
    epochMilli = addDaysMilli(epochMilli, 400)

    // move epochMilli into past through each month
    while (true) {
      const fields = this.computeFieldsDumb(epochMilli)

      // stop if month went too far into past
      if (fields.year < year) {
        break
      }

      // move to start-of-month
      epochMilli = addDaysMilli(epochMilli, 1 - fields.day)

      // only record the epochMilli if NOT in future year
      if (fields.year === year) {
        epochMillis.unshift(epochMilli)
        monthStrs.unshift(fields.month)
      }

      // move to last day of previous month
      epochMilli = addDaysMilli(epochMilli, -1)
    }

    for (let i = 0; i < monthStrs.length; i++) {
      monthStrToNum[monthStrs[i]] = i + 1
    }

    return [epochMillis, monthStrs, monthStrToNum]
  }

  // subclasses that override should round UP
  protected guessISOYear(year: number): number {
    return year - this.yearCorrection
  }
}

// Exposed Internals, for subclasses

export function buildFormat(calendarID: string): Intl.DateTimeFormat {
  return new OrigDateTimeFormat('en-US', {
    calendar: calendarID,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// utils

function isRelatedCalendar(specificCalendarID: string, relatedCalendarID: string): boolean {
  return getCalendarIDBase(specificCalendarID) === getCalendarIDBase(relatedCalendarID)
}
