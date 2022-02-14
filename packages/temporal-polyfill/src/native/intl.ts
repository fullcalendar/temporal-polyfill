import { isoFieldsToEpochMilli } from '../dateUtils/isoMath'
import { Instant } from '../public/instant'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainTime } from '../public/plainTime'
import { PlainYearMonth } from '../public/plainYearMonth'
import { ZonedDateTime } from '../public/zonedDateTime'

// standard built-in functionality
// TODO: move to separate package

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
