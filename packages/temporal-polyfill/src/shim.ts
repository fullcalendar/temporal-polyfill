/*
Exports a single function that, when called, installs the API globally
Does NOT export global types

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import {
  OrigDateTimeFormat,
  normalizeIntlDateArg,
  normalizeIntlOptionalDateArg,
} from './native/intl'
import {
  Calendar,
  DateTimeFormatArg,
  DateTimeFormatRangePart,
  Duration,
  Instant,
  Now,
  PlainDate,
  PlainDateTime,
  PlainMonthDay,
  PlainTime,
  PlainYearMonth,
  TimeZone,
  ZonedDateTime,
  dateToTemporalInstant,
} from './impl'

export function shimTemporal(): void {
  if (!globalThis.Temporal) {
    globalThis.Temporal = {
      PlainYearMonth,
      PlainMonthDay,
      PlainDate,
      PlainTime,
      PlainDateTime,
      ZonedDateTime,
      Instant,
      Calendar,
      TimeZone,
      Duration,
      Now,
    }

    globalThis.Date.prototype.toTemporalInstant = function() {
      return dateToTemporalInstant(this)
    }

    class ExtendedDateTimeFormat extends OrigDateTimeFormat {
      // TODO: methods should have defaults that mirror what objects do for toLocaleString

      format(dateArg?: DateTimeFormatArg): string {
        return super.format(normalizeIntlOptionalDateArg(dateArg))
      }

      formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[] {
        return super.formatToParts(normalizeIntlOptionalDateArg(dateArg))
      }

      formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string {
        return super.formatRange(normalizeIntlDateArg(startArg), normalizeIntlDateArg(endArg))
      }

      formatRangeToParts(
        startArg: DateTimeFormatArg,
        endArg: DateTimeFormatArg,
      ): DateTimeFormatRangePart[] {
        return super.formatRangeToParts(
          normalizeIntlDateArg(startArg),
          normalizeIntlDateArg(endArg),
        )
      }
    }

    // wasn't possible to patch existing methods. must create subclass
    (globalThis.Intl as any).DateTimeFormat = ExtendedDateTimeFormat // HACK
  }
}
