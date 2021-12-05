/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/*
Defines global types, installs the API globally

SPECIAL NOTE:
Imports from non-top-level files are not allowed
*/
import * as TemporalImpl from './impl'
import { DateTemporalMethods, DateTimeFormatArg, DateTimeFormatRangePart } from './impl'
import { shimTemporal } from './shim'

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

    /*
    SPECIAL NOTE:
    Must keep in sync with ./public/types.ts
    */
    export import CompareResult = TemporalImpl.CompareResult
    export import TimeUnit = TemporalImpl.TimeUnit
    export import YearMonthUnit = TemporalImpl.YearMonthUnit
    export import DateUnit = TemporalImpl.DateUnit
    export import Unit = TemporalImpl.Unit
    export import DayTimeUnit = TemporalImpl.DayTimeUnit
    export import RoundingMode = TemporalImpl.RoundingMode
    export import RoundOptions = TemporalImpl.RoundingOptions
    export import TimeRoundOptions = TemporalImpl.TimeRoundingOptions
    export import DateTimeRoundOptions = TemporalImpl.DateTimeRoundingOptions
    export import DurationRoundOptions = TemporalImpl.DurationRoundingOptions
    export import DurationTotalOptions = TemporalImpl.DurationTotalOptions
    export import DiffOptions = TemporalImpl.DiffOptions
    export import YearMonthDiffOptions = TemporalImpl.YearMonthDiffOptions
    export import DateDiffOptions = TemporalImpl.DateDiffOptions
    export import TimeDiffOptions = TemporalImpl.TimeDiffOptions
    export import CalendarDisplay = TemporalImpl.CalendarDisplay
    export import TimeZoneDisplay = TemporalImpl.TimeZoneDisplay
    export import OffsetDisplay = TemporalImpl.OffsetDisplay
    export import FractionalSecondDigits = TemporalImpl.FractionalSecondDigits
    export import DurationToStringUnit = TemporalImpl.DurationToStringUnit
    export import TimeToStringUnit = TemporalImpl.TimeToStringUnit
    export import DateToStringOptions = TemporalImpl.DateToStringOptions
    export import TimeToStringOptions = TemporalImpl.TimeToStringOptions
    export import DateTimeToStringOptions = TemporalImpl.DateTimeToStringOptions
    export import DurationToStringOptions = TemporalImpl.DurationToStringOptions
    export import InstantToStringOptions = TemporalImpl.InstantToStringOptions
    export import ZonedDateTimeToStringOptions = TemporalImpl.ZonedDateTimeToStringOptions
    export import DateISOFields = TemporalImpl.DateISOFields
    export import TimeISOFields = TemporalImpl.TimeISOFields
    export import DateTimeISOFields = TemporalImpl.DateTimeISOFields
    export import ZonedDateTimeISOFields = TemporalImpl.ZonedDateTimeISOFields
    export import YearMonthLikeFields = TemporalImpl.YearMonthLikeFields
    export import MonthDayLikeFields = TemporalImpl.MonthDayLikeFields
    export import DateLikeFields = TemporalImpl.DateLikeFields
    export import DateTimeLikeFields = TemporalImpl.DateTimeLikeFields
    export import ZonedDateTimeLikeFields = TemporalImpl.ZonedDateTimeLikeFields
    export import YearMonthLike = TemporalImpl.YearMonthLike
    export import MonthDayLike = TemporalImpl.MonthDayLike
    export import DateLike = TemporalImpl.DateLike
    export import TimeLike = TemporalImpl.TimeLike
    export import DateTimeLike = TemporalImpl.DateTimeLike
    export import ZonedDateTimeLike = TemporalImpl.ZonedDateTimeLike
    export import DurationLike = TemporalImpl.DurationLike
    export import YearMonthArg = TemporalImpl.YearMonthArg
    export import MonthDayArg = TemporalImpl.MonthDayArg
    export import DateArg = TemporalImpl.DateArg
    export import TimeArg = TemporalImpl.TimeArg
    export import DateTimeArg = TemporalImpl.DateTimeArg
    export import ZonedDateTimeArg = TemporalImpl.ZonedDateTimeArg
    export import DurationArg = TemporalImpl.DurationArg
    export import TimeZoneArg = TemporalImpl.TimeZoneArg
    export import CalendarArg = TemporalImpl.CalendarArg
    export import InstantArg = TemporalImpl.InstantArg
    export import LocalesArg = TemporalImpl.LocalesArg
    export import YearMonthOverrides = TemporalImpl.YearMonthOverrides
    export import MonthDayOverrides = TemporalImpl.MonthDayOverrides
    export import DateOverrides = TemporalImpl.DateOverrides
    export import DateTimeOverrides = TemporalImpl.DateTimeOverrides
    export import ZonedDateTimeOverrides = TemporalImpl.ZonedDateTimeOverrides
    export import OverflowHandling = TemporalImpl.OverflowHandling
    export import OverflowOptions = TemporalImpl.OverflowOptions
    export import Disambiguation = TemporalImpl.Disambiguation
    export import OffsetHandling = TemporalImpl.OffsetHandling
    export import ZonedDateTimeOptions = TemporalImpl.ZonedDateTimeOptions
    export import CalendarProtocol = TemporalImpl.CalendarProtocol
    export import TimeZoneProtocol = TemporalImpl.TimeZoneProtocol
  }
}

shimTemporal()
