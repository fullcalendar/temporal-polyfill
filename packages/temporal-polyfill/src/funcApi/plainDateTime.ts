import type { Temporal } from 'temporal-spec'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import type * as CalendarFns from './calendar'
import { DateTimeFormatLike } from './commonTypes'
import type * as DurationFns from './duration'
import * as Native from './native/plainDateTime'
import type * as PlainDateFns from './plainDate'
import type * as PlainTimeFns from './plainTime'
import type { PlainDateTimeRecord as Record } from './recordTypes'
import * as Shim from './shim/plainDateTime'
import { isPlainDateTimeRecord } from './temporalRecords'
import type * as ZonedDateTimeFns from './zonedDateTime'

export type { Record }
export type Format = DateTimeFormatLike<Record>

// centralized types
export type FromFields = Partial<DateTimeFields> & {
  calendar: CalendarFns.Record
}
export type WithFields = Partial<DateTimeFields>
export type DiffOptions = Temporal.RoundingOptionsWithLargestUnit<
  Temporal.DateUnit | Temporal.TimeUnit
>
type OverflowOptions = Temporal.OverflowOptions
type DisambiguationOptions = Temporal.DisambiguationOptions
type ToStringOptions = Temporal.PlainDateTimeToStringOptions
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions
type RoundingMode = TemporalSpecHelpers.RoundingMode

export const create: (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
  calendar?: CalendarFns.Record,
) => Record = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainDateTimeRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarFns.Record,
) => Record = NativeTemporal ? Native.fromString : Shim.fromString

export const withCalendar: (
  record: Record,
  calendarRecord: CalendarFns.Record,
) => Record = NativeTemporal ? Native.withCalendar : Shim.withCalendar

export const withFields: (
  record: Record,
  mod: WithFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withFields : Shim.withFields

export const withPlainTime: (
  record: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => Record = NativeTemporal ? Native.withPlainTime : Shim.withPlainTime

export const dayOfWeek: (record: Record) => number = NativeTemporal
  ? Native.dayOfWeek
  : Shim.dayOfWeek

export const daysInWeek: (record: Record) => number = NativeTemporal
  ? Native.daysInWeek
  : Shim.daysInWeek

export const weekOfYear: (record: Record) => number | undefined = NativeTemporal
  ? Native.weekOfYear
  : Shim.weekOfYear

export const yearOfWeek: (record: Record) => number | undefined = NativeTemporal
  ? Native.yearOfWeek
  : Shim.yearOfWeek

export const dayOfYear: (record: Record) => number = NativeTemporal
  ? Native.dayOfYear
  : Shim.dayOfYear

export const daysInMonth: (record: Record) => number = NativeTemporal
  ? Native.daysInMonth
  : Shim.daysInMonth

export const daysInYear: (record: Record) => number = NativeTemporal
  ? Native.daysInYear
  : Shim.daysInYear

export const monthsInYear: (record: Record) => number = NativeTemporal
  ? Native.monthsInYear
  : Shim.monthsInYear

export const inLeapYear: (record: Record) => boolean = NativeTemporal
  ? Native.inLeapYear
  : Shim.inLeapYear

export const add: (
  record: Record,
  duration: DurationFns.Record,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: Record,
  duration: DurationFns.Record,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: Record,
  otherRecord: Record,
  options?: DiffOptions,
) => DurationFns.Record = NativeTemporal ? Native.diff : Shim.diff

export const equals: (record: Record, otherRecord: Record) => boolean =
  NativeTemporal ? Native.equals : Shim.equals

export const compare: (record: Record, otherRecord: Record) => number =
  NativeTemporal ? Native.compare : Shim.compare

export const toZonedDateTime: (
  record: Record,
  timeZoneId: string,
  options?: DisambiguationOptions,
) => ZonedDateTimeFns.Record = NativeTemporal
  ? Native.toZonedDateTime
  : Shim.toZonedDateTime

export const toPlainDate: (record: Record) => PlainDateFns.Record =
  NativeTemporal ? Native.toPlainDate : Shim.toPlainDate

export const toPlainTime: (record: Record) => PlainTimeFns.Record =
  NativeTemporal ? Native.toPlainTime : Shim.toPlainTime

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = NativeTemporal ? Native.createFormat : Shim.createFormat

export const toLocaleString: (
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (record: Record, options?: ToStringOptions) => string =
  NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: Record) => string = NativeTemporal
  ? Native.toSimpleString
  : Shim.toSimpleString

export const withDayOfYear: (
  record: Record,
  dayOfYear: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withDayOfYear : Shim.withDayOfYear

export const withDayOfMonth: (
  record: Record,
  dayOfMonth: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withDayOfMonth : Shim.withDayOfMonth

export const withDayOfWeek: (
  record: Record,
  dayOfWeek: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withDayOfWeek : Shim.withDayOfWeek

export const withWeekOfYear: (
  record: Record,
  weekOfYear: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withWeekOfYear : Shim.withWeekOfYear

export const addYears: (
  record: Record,
  years: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.addYears : Shim.addYears

export const addMonths: (
  record: Record,
  months: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.addMonths : Shim.addMonths

export const addWeeks: (record: Record, weeks: number) => Record =
  NativeTemporal ? Native.addWeeks : Shim.addWeeks

export const addDays: (record: Record, days: number) => Record = NativeTemporal
  ? Native.addDays
  : Shim.addDays

export const addHours: (record: Record, hours: number) => Record =
  NativeTemporal ? Native.addHours : Shim.addHours

export const addMinutes: (record: Record, minutes: number) => Record =
  NativeTemporal ? Native.addMinutes : Shim.addMinutes

export const addSeconds: (record: Record, seconds: number) => Record =
  NativeTemporal ? Native.addSeconds : Shim.addSeconds

export const addMilliseconds: (record: Record, milliseconds: number) => Record =
  NativeTemporal ? Native.addMilliseconds : Shim.addMilliseconds

export const addMicroseconds: (record: Record, microseconds: number) => Record =
  NativeTemporal ? Native.addMicroseconds : Shim.addMicroseconds

export const addNanoseconds: (record: Record, nanoseconds: number) => Record =
  NativeTemporal ? Native.addNanoseconds : Shim.addNanoseconds

export const subtractYears: (
  record: Record,
  years: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractYears : Shim.subtractYears

export const subtractMonths: (
  record: Record,
  months: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractMonths : Shim.subtractMonths

export const subtractWeeks: (record: Record, weeks: number) => Record =
  NativeTemporal ? Native.subtractWeeks : Shim.subtractWeeks

export const subtractDays: (record: Record, days: number) => Record =
  NativeTemporal ? Native.subtractDays : Shim.subtractDays

export const subtractHours: (record: Record, hours: number) => Record =
  NativeTemporal ? Native.subtractHours : Shim.subtractHours

export const subtractMinutes: (record: Record, minutes: number) => Record =
  NativeTemporal ? Native.subtractMinutes : Shim.subtractMinutes

export const subtractSeconds: (record: Record, seconds: number) => Record =
  NativeTemporal ? Native.subtractSeconds : Shim.subtractSeconds

export const subtractMilliseconds: (
  record: Record,
  milliseconds: number,
) => Record = NativeTemporal
  ? Native.subtractMilliseconds
  : Shim.subtractMilliseconds

export const subtractMicroseconds: (
  record: Record,
  microseconds: number,
) => Record = NativeTemporal
  ? Native.subtractMicroseconds
  : Shim.subtractMicroseconds

export const subtractNanoseconds: (
  record: Record,
  nanoseconds: number,
) => Record = NativeTemporal
  ? Native.subtractNanoseconds
  : Shim.subtractNanoseconds

export const roundToYear: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToYear : Shim.roundToYear

export const roundToMonth: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMonth : Shim.roundToMonth

export const roundToWeek: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToWeek : Shim.roundToWeek

export const roundToDay: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToDay : Shim.roundToDay

export const roundToHour: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToHour : Shim.roundToHour

export const roundToMinute: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMinute : Shim.roundToMinute

export const roundToSecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToSecond : Shim.roundToSecond

export const roundToMillisecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMillisecond : Shim.roundToMillisecond

export const roundToMicrosecond: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToMicrosecond : Shim.roundToMicrosecond

export const startOfYear: (record: Record) => Record = NativeTemporal
  ? Native.startOfYear
  : Shim.startOfYear

export const startOfMonth: (record: Record) => Record = NativeTemporal
  ? Native.startOfMonth
  : Shim.startOfMonth

export const startOfWeek: (record: Record) => Record = NativeTemporal
  ? Native.startOfWeek
  : Shim.startOfWeek

export const startOfDay: (record: Record) => Record = NativeTemporal
  ? Native.startOfDay
  : Shim.startOfDay

export const startOfHour: (record: Record) => Record = NativeTemporal
  ? Native.startOfHour
  : Shim.startOfHour

export const startOfMinute: (record: Record) => Record = NativeTemporal
  ? Native.startOfMinute
  : Shim.startOfMinute

export const startOfSecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfSecond
  : Shim.startOfSecond

export const startOfMillisecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfMillisecond
  : Shim.startOfMillisecond

export const startOfMicrosecond: (record: Record) => Record = NativeTemporal
  ? Native.startOfMicrosecond
  : Shim.startOfMicrosecond

export const endOfYear: (record: Record) => Record = NativeTemporal
  ? Native.endOfYear
  : Shim.endOfYear

export const endOfMonth: (record: Record) => Record = NativeTemporal
  ? Native.endOfMonth
  : Shim.endOfMonth

export const endOfWeek: (record: Record) => Record = NativeTemporal
  ? Native.endOfWeek
  : Shim.endOfWeek

export const endOfDay: (record: Record) => Record = NativeTemporal
  ? Native.endOfDay
  : Shim.endOfDay

export const endOfHour: (record: Record) => Record = NativeTemporal
  ? Native.endOfHour
  : Shim.endOfHour

export const endOfMinute: (record: Record) => Record = NativeTemporal
  ? Native.endOfMinute
  : Shim.endOfMinute

export const endOfSecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfSecond
  : Shim.endOfSecond

export const endOfMillisecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfMillisecond
  : Shim.endOfMillisecond

export const endOfMicrosecond: (record: Record) => Record = NativeTemporal
  ? Native.endOfMicrosecond
  : Shim.endOfMicrosecond

export const diffYears: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffYears : Shim.diffYears

export const diffMonths: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMonths : Shim.diffMonths

export const diffWeeks: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks

export const diffDays: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffDays : Shim.diffDays

export const diffHours: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffHours : Shim.diffHours

export const diffMinutes: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMinutes : Shim.diffMinutes

export const diffSeconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffSeconds : Shim.diffSeconds

export const diffMilliseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMilliseconds : Shim.diffMilliseconds

export const diffMicroseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffMicroseconds : Shim.diffMicroseconds

export const diffNanoseconds: {
  (record0: Record, record1: Record): number
  (record0: Record, record1: Record, roundingMode: RoundingMode): number
  (record0: Record, record1: Record, options: RoundingMathOptions): number
} = NativeTemporal ? Native.diffNanoseconds : Shim.diffNanoseconds
