/*
Exports a single function that, when called, installs the API globally
Does NOT export global types

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import {
  Calendar,
  Duration,
  ExtendedDateTimeFormat,
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

    // wasn't possible to patch existing methods. must create subclass
    ;(globalThis.Intl as any).DateTimeFormat = ExtendedDateTimeFormat
  }
}
