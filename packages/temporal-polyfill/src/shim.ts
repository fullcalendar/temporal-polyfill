/*
Exports a single function that, when called, installs the API globally
Does NOT export global types

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import {
  Calendar,
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
  extendDateTimeFormat,
  toTemporalInstant,
} from './impl'

export function ensureGlobals(): void {
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

    patchDate(globalThis.Date)

    ;(globalThis.Intl as any).DateTimeFormat = extendDateTimeFormat(globalThis.Intl.DateTimeFormat)
  }
}

export function patchDate(DateClass: typeof Date): void {
  DateClass.prototype.toTemporalInstant = function() {
    return toTemporalInstant(this) // TODO: forward arguments?
  }
}

export { extendDateTimeFormat }
