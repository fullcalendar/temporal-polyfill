/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/*
Defines global types, installs the API globally

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import * as TemporalImpl from './impl'
import { DateTemporalMethods, DateTimeFormatArg, DateTimeFormatRangePart } from './impl'
import { ensureGlobals } from './shim'

declare global {
  export interface Date extends DateTemporalMethods {}

  export namespace Intl {
    /*
    SPECIAL NOTE:
    Must keep in sync with ./native/intl.ts
    */
    interface DateTimeFormat {
      format(dateArg?: DateTimeFormatArg): string
      formatToParts(dateArg?: DateTimeFormatArg): Intl.DateTimeFormatPart[]
      formatRange(startArg: DateTimeFormatArg, endArg: DateTimeFormatArg): string
      formatRangeToParts(
        startArg: DateTimeFormatArg,
        endArg: DateTimeFormatArg
      ): DateTimeFormatRangePart[]
    }
  }

  export namespace Temporal {
    export import PlainYearMonth = TemporalImpl.PlainYearMonth
    export import PlainMonthDay = TemporalImpl.PlainMonthDay
    export import PlainDate = TemporalImpl.PlainDate
    export import PlainTime = TemporalImpl.PlainTime
    export import PlainDateTime = TemporalImpl.PlainDateTime
    export import ZonedDateTime = TemporalImpl.ZonedDateTime
    export import Instant = TemporalImpl.Instant
    export import Calendar = TemporalImpl.Calendar
    export import TimeZone = TemporalImpl.TimeZone
    export import Duration = TemporalImpl.Duration
    export import Now = TemporalImpl.Now
  }
}

ensureGlobals()
