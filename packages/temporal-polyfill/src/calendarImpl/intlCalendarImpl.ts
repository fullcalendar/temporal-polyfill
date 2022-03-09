import { computeDaysInYear } from '../dateUtils/calendar'
import { hashIntlFormatParts, normalizeShortEra } from '../dateUtils/intlFormat'
import {
  addDaysMilli,
  diffDaysMilli,
  isoEpochOriginYear,
  isoToEpochMilli,
} from '../dateUtils/isoMath'
import { OrigDateTimeFormat } from '../native/intl'
import { CalendarImpl, CalendarImplFields, convertEraYear, hasEras } from './calendarImpl'

export class IntlCalendarImpl extends CalendarImpl {
  private format: Intl.DateTimeFormat

  // difference between iso year numbers and the calendar's
  // at 1980. might be useless
  private yearCorrection: number

  // epochMilli starting points for each month
  private yearMonthCache: { [year: string]: number[] }

  constructor(id: string) {
    const format = buildFormat(id)

    if (!isRelatedCalendar(id, format.resolvedOptions().calendar)) {
      throw new RangeError('Invalid calendar: ' + id)
    }

    super(id)
    this.format = format
    this.yearMonthCache = {}
    this.yearCorrection = this.computeFields(0).year - isoEpochOriginYear
  }

  epochMilliseconds(year: number, month: number, day: number): number {
    const monthCache = this.queryMonthCache(year)
    const marker = monthCache[month - 1]

    // move to correct day-of-month
    return addDaysMilli(marker, day - 1)
  }

  daysInMonth(year: number, month: number): number {
    const monthCache = this.queryMonthCache(year)
    const startMarker = monthCache[month - 1]

    // The `month` variable, which is 1-based, should now be considered an index for `monthCache`
    // It is +1 from the previous index, used to compute the `endMarker`
    if (month >= monthCache.length) {
      year++
      month = 0
    }

    // In the case month was incremented above,
    // `ensureCacheForYear` guarantees the next year is at least partially populated
    const endMarker = monthCache[month]

    return diffDaysMilli(startMarker, endMarker)
  }

  monthsInYear(year: number): number {
    return this.queryMonthCache(year).length
  }

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

    throw new Error('Could not guess year') // TODO: better
  }

  normalizeISOYearForMonthDay(isoYear: number): number {
    return isoYear
  }

  private queryMonthCache(year: number): number[] {
    this.ensureYear(year)

    const monthCache = this.yearMonthCache[year]
    if (monthCache === undefined) {
      throw new RangeError('Invalid date for calendar') // TODO: make DRY with intlBugs
    }

    return monthCache
  }

  private ensureYear(year: number): void {
    const { yearMonthCache } = this

    // since the yearCache is guaranteed to populate an entire year and extra month(s) into the
    // next year, if two consecutive years are filled, the first year is guaranteed to be populated.
    if (!yearMonthCache[year] || !yearMonthCache[year + 1]) {
      // either part-way through the desired year or very slighly before
      let epochMilli = isoToEpochMilli(this.guessISOYear(year))

      // ensure marker is in year+1
      epochMilli = addDaysMilli(epochMilli, 400)

      // will populate the downward until (and including) year
      this.ensureDown(epochMilli, year)
    }
  }

  // subclasses that override should round UP
  protected guessISOYear(year: number): number {
    return year - this.yearCorrection
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

  computeFields(epochMilli: number): CalendarImplFields {
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
  return new OrigDateTimeFormat('en-US', {
    calendar: calendarID,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// utils

function isRelatedCalendar(specificCalendarID: string, relatedCalendarID: string): boolean {
  const parts0 = specificCalendarID.split('-') // TODO: more DRY elsewhere
  const parts1 = relatedCalendarID.split('-')
  return parts0[0] === parts1[0]
}
