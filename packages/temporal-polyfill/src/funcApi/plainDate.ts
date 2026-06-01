import type { Temporal } from 'temporal-spec'
import { DateFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import type * as CalendarFns from './calendar'
import { DateTimeFormatLike, ToZonedDateTimeOptions } from './commonTypes'
import type * as DurationFns from './duration'
import * as Native from './native/plainDate'
import type * as PlainDateTimeFns from './plainDateTime'
import type * as PlainMonthDayFns from './plainMonthDay'
import type * as PlainTimeFns from './plainTime'
import type * as PlainYearMonthFns from './plainYearMonth'
import type { PlainDateRecord as Record } from './recordTypes'
import * as Shim from './shim/plainDate'
import { isPlainDateRecord } from './temporalRecords'
import type * as ZonedDateTimeFns from './zonedDateTime'

export type { Record }

export type FromFields = Partial<DateFields> & { calendar: CalendarFns.Record }
export type WithFields = Partial<DateFields>
type OverflowOptions = Temporal.OverflowOptions
type ToStringOptions = Temporal.PlainDateToStringOptions
export type DiffOptions =
  Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions
type RoundingMode = TemporalSpecHelpers.RoundingMode

export const isRecord = isPlainDateRecord as (arg: unknown) => arg is Record

export const create: (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarFns.Record,
) => Record = NativeTemporal ? Native.create : Shim.create

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarFns.Record,
) => Record = NativeTemporal ? Native.fromString : Shim.fromString

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

export const withFields: (
  record: Record,
  mod: WithFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withFields : Shim.withFields

export const withCalendar: (
  record: Record,
  calendarRecord: CalendarFns.Record,
) => Record = NativeTemporal ? Native.withCalendar : Shim.withCalendar

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

export const toZonedDateTime: {
  (record: Record, timeZoneId: string): ZonedDateTimeFns.Record
  (
    record: Record,
    options: ToZonedDateTimeOptions<PlainTimeFns.Record>,
  ): ZonedDateTimeFns.Record
} = NativeTemporal ? Native.toZonedDateTime : Shim.toZonedDateTime

export const toPlainDateTime: (
  record: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => PlainDateTimeFns.Record = NativeTemporal
  ? (Native.toPlainDateTime as (
      record: Record,
      plainTimeRecord?: PlainTimeFns.Record,
    ) => PlainDateTimeFns.Record)
  : (Shim.toPlainDateTime as (
      record: Record,
      plainTimeRecord?: PlainTimeFns.Record,
    ) => PlainDateTimeFns.Record)

export const toPlainYearMonth: (record: Record) => PlainYearMonthFns.Record =
  NativeTemporal ? Native.toPlainYearMonth : Shim.toPlainYearMonth

export const toPlainMonthDay: (record: Record) => PlainMonthDayFns.Record =
  NativeTemporal ? Native.toPlainMonthDay : Shim.toPlainMonthDay

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<Record> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

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

export const subtractYears: (
  record: Record,
  units: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractYears : Shim.subtractYears

export const subtractMonths: (
  record: Record,
  units: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractMonths : Shim.subtractMonths

export const subtractWeeks: (
  record: Record,
  units: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractWeeks : Shim.subtractWeeks

export const subtractDays: (
  record: Record,
  units: number,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtractDays : Shim.subtractDays

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

export const startOfYear: (record: Record) => Record = NativeTemporal
  ? Native.startOfYear
  : Shim.startOfYear

export const startOfMonth: (record: Record) => Record = NativeTemporal
  ? Native.startOfMonth
  : Shim.startOfMonth

export const startOfWeek: (record: Record) => Record = NativeTemporal
  ? Native.startOfWeek
  : Shim.startOfWeek

export const endOfYear: (record: Record) => Record = NativeTemporal
  ? Native.endOfYear
  : Shim.endOfYear

export const endOfMonth: (record: Record) => Record = NativeTemporal
  ? Native.endOfMonth
  : Shim.endOfMonth

export const endOfWeek: (record: Record) => Record = NativeTemporal
  ? Native.endOfWeek
  : Shim.endOfWeek

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
