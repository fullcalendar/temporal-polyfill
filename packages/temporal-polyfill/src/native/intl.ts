import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { createDateTime } from '../dateUtils/dateTime'
import { isoFieldsToEpochMilli } from '../dateUtils/isoMath'
import { zeroTimeISOFields } from '../dateUtils/zonedDateTime'
import { Instant } from '../public/instant'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainTime } from '../public/plainTime'
import { PlainYearMonth } from '../public/plainYearMonth'
import { TimeZone } from '../public/timeZone'
import { DateISOFields, LocalesArg } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'

// TODO: rethink if everything belongs in this 'native' file

export interface DateTimeFormatRangePart extends Intl.DateTimeFormatPart {
  source: 'startDate' | 'endDate'
}

export interface DateTimeFormatRangeMethods {
  formatRange(startDate: number | Date, endDate: number | Date): string
  formatRangeToParts(startDate: number | Date, endDate: number | Date): DateTimeFormatRangePart[]
}

export type DateTimeFormatWithRange = Intl.DateTimeFormat & DateTimeFormatRangeMethods

// adding Temporal

export type DateTimeFormatArg =
  number |
  Date |
  Instant |
  ZonedDateTime |
  PlainDateTime |
  PlainDate |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

/*
SPECIAL NOTE:
Must keep in sync with global.ts
Was impossible to extend a global object similar to DateTemporalMethods
TODO: file bug with TypeScript
*/
export interface DateTimeFormatTemporalMethods {
  format(dateArg?: DateTimeFormatArg): string
  formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[]
  formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string
  formatRangeToParts(
    startArg: DateTimeFormatArg,
    endArg: DateTimeFormatArg
  ): DateTimeFormatRangePart[]
}

export type DateTimeFormatWithTemporal = Intl.DateTimeFormat & DateTimeFormatTemporalMethods

// TODO: unify this as a class/const, to just export DateTimeFormat,
// and have whole src reference it only, not Intl.DateTimeFormat
export const OrigDateTimeFormat = Intl.DateTimeFormat

export function normalizeIntlOptionalDateArg(
  dateArg: DateTimeFormatArg | undefined,
): undefined | number | Date {
  return dateArg === undefined ? dateArg : normalizeIntlDateArg(dateArg)
}

export function normalizeIntlDateArg(dateArg: DateTimeFormatArg): number | Date {
  return typeof dateArg === 'number'
    ? dateArg
    : dateArg instanceof Date
      ? dateArg
      : (dateArg instanceof Instant || dateArg instanceof ZonedDateTime)
          ? dateArg.epochMilliseconds
          : isoFieldsToEpochMilli(dateArg.getISOFields())
}

export function formatZoned(
  zdt: ZonedDateTime,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const fields = zdt.getISOFields()
  const defaultCalendarID = fields.calendar.id!
  const defaultTimeZoneID = fields.timeZone.id
  const { timeZone } = options

  if (timeZone !== undefined && timeZone !== defaultTimeZoneID) {
    throw new RangeError('Given timeZone must agree')
  }

  return formatGeneric(zdt.epochMilliseconds, defaultCalendarID, locales, {
    timeZone: defaultTimeZoneID,
    timeZoneName: 'short',
    ...options,
  })
}

export function formatUnzoned<ISOFields extends DateISOFields>(
  date: { getISOFields: () => ISOFields },
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  strictCalendar?: boolean,
): string {
  const fields = date.getISOFields()
  const defaultCalendarID = fields.calendar.id!
  let { timeZone } = options
  let milli: number

  if (timeZone !== undefined) {
    const timeZoneObj = new TimeZone(timeZone)
    const plainDateTime = createDateTime({
      ...zeroTimeISOFields,
      ...date.getISOFields(),
    })
    milli = timeZoneObj.getInstantFor(plainDateTime).epochMilliseconds
  } else {
    milli = isoFieldsToEpochMilli(fields)
    timeZone = 'UTC'
  }

  return formatGeneric(milli, defaultCalendarID, locales, {
    ...options,
    timeZone,
    timeZoneName: undefined, // never show timeZone name
  }, strictCalendar)
}

function formatGeneric(
  milli: number,
  defaultCalendarID: string,
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions,
  strictCalendar?: boolean,
) {
  const dtf = new OrigDateTimeFormat(locales, {
    calendar: hasUnicodeCalendar(locales)
      ? undefined // let the locale-specified calendar take effect
      : defaultCalendarID,
    ...options,
  })

  if (
    (strictCalendar || defaultCalendarID !== isoCalendarID) &&
    defaultCalendarID !== dtf.resolvedOptions().calendar
  ) {
    throw new RangeError('Non-iso calendar mismatch')
  }

  return dtf.format(milli)
}

function hasUnicodeCalendar(locales: LocalesArg | undefined): boolean {
  const localesArray = ([] as string[]).concat(locales || [])

  for (const locale of localesArray) {
    if (locale.indexOf('-u-ca-') !== -1) {
      return true
    }
  }

  return false
}
