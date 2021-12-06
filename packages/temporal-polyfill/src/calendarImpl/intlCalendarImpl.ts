import { computeDaysInYear } from '../dateUtils/calendar'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import {
  addDaysMilli,
  diffDaysMilli,
  isoEpochOriginYear,
  isoToEpochMilli,
} from '../dateUtils/isoMath'
import { CalendarImpl } from './calendarImpl'

export class IntlCalendarImpl extends CalendarImpl {
  private format: Intl.DateTimeFormat

  // difference between iso year numbers and the calendar's
  private yearCorrection: number

  // epochMilli starting points for each month
  private yearMonthCache: { [year: string]: number[] }

  constructor(id: string) {
    const format = buildFormat(id)
    if (id !== format.resolvedOptions().calendar) {
      throw new Error('Invalid calendar: ' + id)
    }
    super(id)
    this.format = format
    this.yearCorrection = this.computeFields(0).year - isoEpochOriginYear
    this.yearMonthCache = {}
  }

  era(isoYear: number, isoMonth: number, isoDay: number): string | undefined {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return this.computeFields(epochMilli).era
  }

  eraYear(isoYear: number, isoMonth: number, isoDay: number): number | undefined {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return this.computeFields(epochMilli).eraYear
  }

  year(isoYear: number, isoMonth: number, isoDay: number): number {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return this.computeFields(epochMilli).year
  }

  month(isoYear: number, isoMonth: number, isoDay: number): number {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return this.computeFields(epochMilli).month
  }

  day(isoYear: number, isoMonth: number, isoDay: number): number {
    const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
    return this.computeFields(epochMilli).day
  }

  epochMilliseconds(year: number, month: number, day: number): number {
    this.ensureYear(year)

    // will be start-of-month
    const marker = this.yearMonthCache[year][month - 1]

    // move to correct day-of-month
    return addDaysMilli(marker, day - 1)
  }

  daysInMonth(year: number, month: number): number {
    const { yearMonthCache } = this
    this.ensureYear(year)

    const monthCache = yearMonthCache[year]
    const startMarker = monthCache[month - 1]

    // The `month` variable, which is 1-based, should now be considered an index for `monthCache`
    // It is +1 from the previous index, used to compute the `endMarker`
    if (month >= monthCache.length) {
      year++
      month = 0
    }

    // In the case month was incremented above,
    // `ensureCacheForYear` guarantees the next year is at least partially populated
    const endMarker = yearMonthCache[year][month]

    return diffDaysMilli(startMarker, endMarker)
  }

  monthsInYear(year: number): number {
    this.ensureYear(year)
    return this.yearMonthCache[year].length
  }

  inLeapYear(year: number): boolean {
    const days = computeDaysInYear(this, year)
    return days > computeDaysInYear(this, year - 1) &&
      days > computeDaysInYear(this, year + 1)
  }

  monthYear(monthCode: string | undefined, day: number | undefined): number {
    if (monthCode === undefined || day === undefined) {
      throw new Error('To guess reference year, must specify monthCode and day')
    }

    let year = isoEpochOriginYear + this.yearCorrection
    const endYear = year + 100
    for (; year < endYear; year++) {
      const month = this.convertMonthCode(monthCode, year)
      if (
        month <= this.monthsInYear(year) &&
        day <= this.daysInMonth(year, month)
      ) {
        return year
      }
    }

    throw new Error('Could not guess year')
  }

  private ensureYear(year: number): void {
    const { yearMonthCache, yearCorrection } = this

    // since the yearCache is guaranteed to populate an entire year and extra month(s) into the
    // next year, if two consecutive years are filled, the first year is guaranteed to be populated.
    if (!yearMonthCache[year] || !yearMonthCache[year + 1]) {
      // either part-way through the desired year or very slighly before
      let epochMilli = isoToEpochMilli(year - yearCorrection)

      // ensure marker is in year+1
      epochMilli = addDaysMilli(epochMilli, 400)

      // will populate the downward until (and including) year
      this.ensureDown(epochMilli, year)
    }
  }

  // guarantees cache is populated all the way down (and including) to floorYear
  private ensureDown(epochMilli: number, floorYear: number) {
    const { yearMonthCache } = this
    let fields = this.computeFields(epochMilli)

    for (let y = fields.year; y >= floorYear; y--) {
      const monthCache = yearMonthCache[y] || (yearMonthCache[y] = [])
      const floorMonth = monthCache.length + 1

      // as we move down to lower months, don't recompute months we already computed (floorMonth)
      for (let m = fields.month; m >= floorMonth; m--) {
        // move to start-of-month
        epochMilli = addDaysMilli(epochMilli, 1 - fields.day)
        monthCache[m - 1] = epochMilli

        // move to last day of previous month
        epochMilli = addDaysMilli(epochMilli, -1)
        fields = this.computeFields(epochMilli)
      }
    }
  }

  protected computeFields(epochMilli: number): {
    era: string | undefined,
    eraYear: number | undefined,
    year: number,
    month: number,
    day: number
  } {
    const partHash = hashIntlFormatParts(this.format, epochMilli)
    let era: string | undefined
    let eraYear: number | undefined
    let year = parseInt(partHash.year)

    if (partHash.era) {
      era = normalizeShortEra(partHash.era)
      eraYear = year
      year = this.convertEraYear(eraYear, era)
    }

    return {
      era,
      eraYear,
      year,
      month: this.parseMonth(partHash.month, year),
      day: parseInt(partHash.day),
    }
  }

  protected parseMonth(monthStr: string, _year: number): number {
    return parseInt(monthStr)
  }
}

// Exposed Internals, for subclasses

export function buildFormat(calendarID: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    calendar: calendarID,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
