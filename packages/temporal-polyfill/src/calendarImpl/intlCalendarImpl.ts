import { computeDaysInYear } from '../dateUtils/calendar'
import {
  addDaysMilli,
  diffDaysMilli,
  isoEpochOriginYear,
  isoToEpochMilli,
} from '../dateUtils/epoch'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import { OrigDateTimeFormat } from '../native/intlUtils'
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

const calLeapMonths: { [cal: string]: number } = {
  hebrew: 6, // consistent month
  chinese: 0, // zero implies variable month
  dangi: 0, // "
}

export class IntlCalendarImpl extends CalendarImpl {
  private format: Intl.DateTimeFormat

  // difference between iso year numbers and the calendar's at 1980
  private yearCorrection: number

  // epochMilli starting points for each month
  private monthCacheByYear: { [year: string]: MonthCache }

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
  convertMonthCode(monthCode: string, year: number): [number, boolean] {
    const leapMonth = this.queryLeapMonthByYear(year) // 0 if none

    // TODO: more DRY
    let monthCodeIsLeap = /L$/.test(monthCode)
    let monthCodeInt = parseInt(monthCode.substr(1)) // chop off 'M'
    let unusedLeap = false

    // validate the leap-month
    if (monthCodeIsLeap) {
      const presetLeapMonth = calLeapMonths[this.id] // TODO: use base ID?

      if (presetLeapMonth === undefined) {
        throw new RangeError('Calendar system doesnt support leap months')
      }

      if (presetLeapMonth) {
        if (monthCodeInt !== presetLeapMonth - 1) {
          throw new RangeError('Invalid leap-month month code')
        }
      } else { // variable leap months (HACK: hardcoded for chinese/dangi)
        if (monthCodeInt <= 1 || monthCodeInt >= 12) {
          throw new RangeError('Invalid leap-month month code')
        }
      }
    }

    if (monthCodeIsLeap && !(leapMonth && monthCodeInt === leapMonth - 1)) {
      unusedLeap = true
      monthCodeIsLeap = false // yuck
    }

    if (monthCodeIsLeap || (leapMonth && monthCodeInt >= leapMonth)) {
      monthCodeInt++
    }

    return [monthCodeInt, unusedLeap]
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
      const [month, unusedLeap] = this.convertMonthCode(monthCode, year)

      if (
        !unusedLeap &&
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

  // the month number (1-based) that the leap-month falls on
  // for example, the '3bis' leap month would fall on `4`
  // TODO: cache somehow?
  private queryLeapMonthByYear(year: number): number | undefined {
    const currentCache = this.queryMonthCache(year)
    const prevCache = this.queryMonthCache(year - 1)
    const nextCache = this.queryMonthCache(year + 1)

    // in a leap year?
    // TODO: consolidate with inLeapYear?
    if (
      currentCache[0].length > prevCache[0].length &&
      currentCache[0].length > nextCache[0].length
    ) {
      const currentMonthStrs = currentCache[1]
      const prevMonthStrs = prevCache[1]

      for (let i = 0; i < prevMonthStrs.length; i++) {
        if (prevMonthStrs[i] !== currentMonthStrs[i]) {
          return i + 1 // convert to 1-based
        }
      }
    }

    return undefined
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
    let epochMilli = isoToEpochMilli(this.guessISOYear(year), 1, 1)

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
