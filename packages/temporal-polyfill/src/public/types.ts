import { CalendarArgBag, CalendarArgSimple } from '../argParse/calendar'
import { CalendarDisplayMap } from '../argParse/calendarDisplay'
import { DisambigMap } from '../argParse/disambig'
import { OffsetDisplayMap } from '../argParse/offsetDisplay'
import { OffsetHandlingMap } from '../argParse/offsetHandling'
import { OverflowHandlingMap } from '../argParse/overflowHandling'
import { RoundingModeMap } from '../argParse/roundingMode'
import { TimeZoneArgBag, TimeZoneArgSimple } from '../argParse/timeZone'
import { TimeZoneDisplayMap } from '../argParse/timeZoneDisplay'
import { DateUnitProper, TimeUnitProper, YearMonthUnitProper } from '../argParse/unitStr'
import {
  DurationFields,
  ISODateFields,
  ISOTimeFields,
  LocalTimeFields,
} from '../dateUtils/typesPrivate'
import { Temporal } from '../spec'
import { Instant } from './instant'

/*
SPECIAL NOTE:
Must keep in sync with global.ts
*/

// math
export type CompareResult = -1 | 0 | 1

// units
// TODO: more DRY way to define deprecated units
export type TimeUnit = TimeUnitProper
| /** @deprecated */ 'hours'
| /** @deprecated */ 'minutes'
| /** @deprecated */ 'seconds'
| /** @deprecated */ 'milliseconds'
| /** @deprecated */ 'microseconds'
| /** @deprecated */ 'nanoseconds'
export type YearMonthUnit = YearMonthUnitProper
| /** @deprecated */ 'years'
| /** @deprecated */ 'months'
export type DateUnit = DateUnitProper
| /** @deprecated */ 'years'
| /** @deprecated */ 'months'
| /** @deprecated */ 'weeks'
| /** @deprecated */ 'days'
export type Unit = TimeUnit | DateUnit
export type DayTimeUnit = TimeUnit | 'day'
| /** @deprecated */ 'days'

// rounding
export type RoundingMode = keyof RoundingModeMap
export type RoundingOptions<UnitType extends DayTimeUnit = DayTimeUnit> = {
  smallestUnit: UnitType // required
  roundingMode?: RoundingMode
  roundingIncrement?: number
}
export type DateTimeRoundingOptions = RoundingOptions // uuhhh
export type TimeRoundingOptions = RoundingOptions<TimeUnit>
// similar to diffing
export type DurationRoundingOptions = DiffOptions & { relativeTo?: ZonedDateTimeArg | DateTimeArg }

// total
export type DurationTotalOptions = { unit: Unit, relativeTo?: DateTimeArg }

// diffing
export type DiffOptions<UnitType extends Unit = Unit> = {
  largestUnit?: UnitType | 'auto'
  smallestUnit?: UnitType
  roundingMode?: RoundingMode
  roundingIncrement?: number
}
export type YearMonthDiffOptions = DiffOptions<YearMonthUnit>
export type DateDiffOptions = DiffOptions<DateUnit>
export type TimeDiffOptions = DiffOptions<TimeUnit>

// toString
export type CalendarDisplay = keyof CalendarDisplayMap
export type TimeZoneDisplay = keyof TimeZoneDisplayMap
export type OffsetDisplay = keyof OffsetDisplayMap
export type FractionalSecondDigits = 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type DurationToStringUnit = 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
| /** @deprecated */ 'seconds'
| /** @deprecated */ 'milliseconds'
| /** @deprecated */ 'microseconds'
| /** @deprecated */ 'nanoseconds'
export type TimeToStringUnit = 'minute' | DurationToStringUnit
| /** @deprecated */ 'minutes'
export type DateToStringOptions = { calendarName?: CalendarDisplay }
export type TimeToStringOptions<UnitType extends TimeUnit = TimeToStringUnit> = {
  fractionalSecondDigits?: FractionalSecondDigits
  smallestUnit?: UnitType
  roundingMode?: RoundingMode
}
export type DateTimeToStringOptions = DateToStringOptions & TimeToStringOptions
export type DurationToStringOptions = TimeToStringOptions<DurationToStringUnit>
export type InstantToStringOptions = TimeToStringOptions & { timeZone?: TimeZoneArg }
export type ZonedDateTimeToStringOptions = DateTimeToStringOptions & {
  timeZoneName?: TimeZoneDisplay
  offset?: OffsetDisplay
}

// iso-fields (TODO: change back to CalendarProtocol!!!)
export type DateISOFields = ISODateFields & { calendar: Temporal.CalendarProtocol }
export type TimeISOFields = ISOTimeFields & { calendar: Temporal.Calendar } // strict
export type DateTimeISOFields = DateISOFields & ISOTimeFields
export type ZonedDateTimeISOFields = DateTimeISOFields & {
  timeZone: Temporal.TimeZoneProtocol
  offset: string
}

// like-fields (for Calendar::dateFromFields, etc) (does NOT have calendar/timezone)
export type YearMonthLikeFields =
  ({ era: string, eraYear: number } | { year: number }) &
  ({ month: number } | { monthCode: string })
export type MonthDayLikeFields =
  ({ monthCode: string }
  | (({ year: number } | { era: string, eraYear: number }) & { month: number })) &
  { day: number }
export type DateLikeFields = YearMonthLikeFields & { day: number }
export type DateTimeLikeFields = DateLikeFields & Partial<LocalTimeFields>
export type ZonedDateTimeLikeFields = DateTimeLikeFields & { offset?: string }

// like (has calendar/timezone)
export type YearMonthLike = YearMonthLikeFields & { calendar?: CalendarArgSimple }
export type MonthDayLike =
  { monthCode: string, calendar?: CalendarArgSimple } |
  { year: number, month: number, calendar?: CalendarArgSimple } |
  { era: string, eraYear: number, month: number, calendar: CalendarArgSimple } |
  { month: number, day: number, calendar?: never } // lack of a calendar implies ISO
export type DateLike = YearMonthLike & { day: number }
export type TimeLike = Partial<LocalTimeFields>
export type DateTimeLike = DateLike & TimeLike
export type ZonedDateTimeLike = DateTimeLike & { timeZone: TimeZoneArgSimple, offset?: string }
export type DurationLike = Partial<DurationFields>

// arg for object instantiation (can be string)
export type YearMonthArg = YearMonthLike | string
export type MonthDayArg = MonthDayLike | string
export type DateArg = DateLike | string
export type TimeArg = TimeLike | string
export type DateTimeArg = DateTimeLike | string
export type ZonedDateTimeArg = ZonedDateTimeLike | string
export type DurationArg = DurationLike | string
export type TimeZoneArg = TimeZoneArgSimple | TimeZoneArgBag
export type CalendarArg = CalendarArgSimple | CalendarArgBag
// can pass-in nearly any date-like object to Instant, because parses toString()
export type InstantArg = Instant | string | { toString(): string }
export type LocalesArg = string | string[]

// override-fields
// (instead of TimeOverrides, use TimeLike)
export type YearMonthOverrides = Partial<YearMonthLikeFields>
export type MonthDayOverrides = Partial<MonthDayLikeFields>
export type DateOverrides = Partial<DateLikeFields>
export type DateTimeOverrides = Partial<DateTimeLikeFields>
export type ZonedDateTimeOverrides = Partial<ZonedDateTimeLikeFields>

// setting/overriding options
export type OverflowHandling = keyof OverflowHandlingMap
export type OverflowOptions = { overflow?: OverflowHandling }

// zone-related
export type Disambiguation = keyof DisambigMap
export type OffsetHandling = keyof OffsetHandlingMap
export type ZonedDateTimeOptions = {
  overflow?: OverflowHandling
  disambiguation?: Disambiguation
  offset?: OffsetHandling
}
