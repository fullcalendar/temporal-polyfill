import { CalendarArgBag, CalendarArgSimple } from './argParse/calendar'
import { CalendarDisplayMap } from './argParse/calendarDisplay'
import { DisambigMap } from './argParse/disambig'
import { OffsetDisplayMap } from './argParse/offsetDisplay'
import { OffsetHandlingMap } from './argParse/offsetHandling'
import { OverflowHandlingMap } from './argParse/overflowHandling'
import { RoundingModeMap } from './argParse/roundingMode'
import { TimeZoneDisplayMap } from './argParse/timeZoneDisplay'
import { DateUnitProper, TimeUnitProper } from './argParse/units'
import { DateISOEssentials } from './dateUtils/date'
import { DurationFields } from './dateUtils/duration'
import { TimeFields, TimeISOEssentials } from './dateUtils/time'
import { Duration } from './duration'
import { Instant } from './instant'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { ZonedDateTime } from './zonedDateTime'

// math
export type CompareResult = -1 | 0 | 1

// units
export type TimeUnit = TimeUnitProper
| /** @deprecated */ 'hours'
| /** @deprecated */ 'minutes'
| /** @deprecated */ 'seconds'
| /** @deprecated */ 'milliseconds'
| /** @deprecated */ 'microseconds'
| /** @deprecated */ 'nanoseconds'
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
export type RoundOptions<UnitType extends Unit = Unit> = {
  smallestUnit: UnitType // required
  roundingMode?: RoundingMode
  roundingIncrement?: number
}
export type TimeRoundOptions = RoundOptions<TimeUnit>
export type DateTimeRoundOptions = RoundOptions<DayTimeUnit>
// similar to diffing
export type DurationRoundOptions = DiffOptions & { relativeTo?: ZonedDateTimeArg | DateTimeArg }

// total
export type DurationTotalOptions = { unit: Unit, relativeTo?: DateTimeArg }

// diffing
export type DiffOptions<UnitType extends Unit = Unit> = {
  largestUnit?: UnitType | 'auto'
  smallestUnit?: UnitType
  roundingMode?: RoundingMode
  roundingIncrement?: number
}
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

// iso-fields
export type DateISOFields = DateISOEssentials & { calendar: CalendarProtocol }
export type TimeISOFields = TimeISOEssentials & { calendar: CalendarProtocol }
export type DateTimeISOFields = DateISOFields & TimeISOEssentials
export type ZonedDateTimeISOFields = DateTimeISOFields & { timeZone: TimeZone, offset: string }

// like-fields (for Calendar::dateFromFields, etc) (does NOT have calendar/timezone)
export type YearMonthLikeFields =
  ({ era: string, eraYear: number } | { year: number }) &
  ({ month: number } | { monthCode: string })
export type MonthDayLikeFields =
  ({ monthCode: string } | { year: number, month: number }) &
  { day: number }
export type DateLikeFields = YearMonthLikeFields & { day: number }
export type DateTimeLikeFields = DateLikeFields & Partial<TimeFields>
export type ZonedDateTimeLikeFields = DateTimeLikeFields & { offset?: string }

// like (has calendar/timezone)
export type YearMonthLike = YearMonthLikeFields & { calendar?: CalendarArg }
export type MonthDayLike = MonthDayLikeFields & { calendar?: CalendarArg }
export type DateLike = YearMonthLike & { day: number }
export type TimeLike = Partial<TimeFields>
export type DateTimeLike = DateLike & TimeLike
export type ZonedDateTimeLike = DateTimeLike & { timeZone: TimeZoneArg, offset?: string }
export type DurationLike = Partial<DurationFields>

// arg for object instantiation (can be string)
export type YearMonthArg = YearMonthLike | string
export type MonthDayArg = MonthDayLike | string
export type DateArg = DateLike | string
export type TimeArg = TimeLike | string
export type DateTimeArg = DateTimeLike | string
export type ZonedDateTimeArg = ZonedDateTimeLike | string
export type DurationArg = DurationLike | string
export type TimeZoneArg = TimeZone | string
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

// calendar protocol
export interface CalendarProtocol {
  id?: string
  calendar?: never
  era(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): string | undefined
  eraYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number | undefined
  year(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number
  month(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number
  monthCode(arg: PlainYearMonth | PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): string
  day(arg: PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): number
  dayOfWeek?(arg: DateArg | PlainDateTime | ZonedDateTime): number
  dayOfYear?(arg: DateArg | PlainDateTime | ZonedDateTime): number
  weekOfYear?(arg: DateArg | PlainDateTime | ZonedDateTime): number
  daysInWeek?(arg: DateArg | PlainDateTime | ZonedDateTime): number
  daysInMonth?(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number
  daysInYear?(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number
  monthsInYear?(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number
  inLeapYear?(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): boolean
  dateFromFields(arg: DateLikeFields, options?: OverflowOptions): PlainDate
  yearMonthFromFields(arg: YearMonthLikeFields, options?: OverflowOptions): PlainYearMonth
  monthDayFromFields(fields: MonthDayLikeFields, options?: OverflowOptions): PlainMonthDay
  dateAdd?(dateArg: DateArg, durationArg: DurationArg, options?: OverflowOptions): PlainDate
  dateUntil?(dateArg0: DateArg, dateArg1: DateArg, options?: { largestUnit?: DateUnit }): Duration
  // TODO: fields/mergeFields
  toString(): string
}
