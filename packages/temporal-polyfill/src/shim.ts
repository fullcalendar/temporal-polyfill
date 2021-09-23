/*
Exports a single function that, when called, installs the API globally
Does NOT export global types

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import {
  Calendar,
  DateTemporalMethods,
  DateTimeFormatArg,
  DateTimeFormatRangePart,
  DateTimeFormatTemporalMethods,
  DateWithTemporal,
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
  intlFormat,
  intlFormatRange,
  intlFormatRangeToParts,
  intlFormatToParts,
} from './impl'

const TemporalNative = globalThis.Temporal

export function shimTemporal(): void {
  if (!TemporalNative) {
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
    patchDateClass(Date)
    patchDateTimeFormatClass(Intl.DateTimeFormat)
  }
}

function patchDateClass(DateClass: { prototype: Date }): void {
  (DateClass.prototype as DateWithTemporal).toTemporalInstant = function() {
    return dateToTemporalInstant(this)
  }
}

function patchDateTimeFormatClass(DateTimeFormatClass: { prototype: Intl.DateTimeFormat }): void {
  Object.assign(DateTimeFormatClass.prototype, {
    format(
      this: Intl.DateTimeFormat,
      dateArg?: DateTimeFormatArg,
    ): string {
      return intlFormat(this, dateArg)
    },
    formatToParts(
      this: Intl.DateTimeFormat,
      dateArg?: DateTimeFormatArg,
    ): Intl.DateTimeFormatPart[] {
      return intlFormatToParts(this, dateArg)
    },
    formatRange(
      this: Intl.DateTimeFormat,
      startArg: DateTimeFormatArg,
      endArg: DateTimeFormatArg,
    ): string {
      return intlFormatRange(this, startArg, endArg)
    },
    formatRangeToParts(
      this: Intl.DateTimeFormat,
      startArg: DateTimeFormatArg,
      endArg: DateTimeFormatArg,
    ): DateTimeFormatRangePart[] {
      return intlFormatRangeToParts(this, startArg, endArg)
    },
  } as DateTimeFormatTemporalMethods)
}

// additional public API for manually extending classes

export function extendDateClass<DateObj extends Date>(
  DateClass: { new(...args: any[]): DateObj, prototype: DateObj },
): typeof Date & { prototype: (DateObj & DateTemporalMethods) } {
  if (!TemporalNative) {
    class DateExtended extends DateClass {}
    patchDateClass(DateExtended)
    DateClass = DateExtended
  }
  return DateClass as any
}

export function extendDateTimeClass<DateTimeFormatObj extends Intl.DateTimeFormat>(
  DateTimeFormatClass: { new(...args: any[]): DateTimeFormatObj, prototype: DateTimeFormatObj },
): typeof Intl.DateTimeFormat & { prototype: (DateTimeFormatObj & DateTimeFormatTemporalMethods) } {
  if (!TemporalNative) {
    class DateTimeFormatExtended extends DateTimeFormatClass {}
    patchDateTimeFormatClass(DateTimeFormatExtended)
    DateTimeFormatClass = DateTimeFormatExtended
  }
  return DateTimeFormatClass as any
}
