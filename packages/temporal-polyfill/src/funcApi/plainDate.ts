import type { Temporal } from 'temporal-spec'
import { DateFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike, ToZonedDateTimeOptions } from './commonTypes'
import * as Native from './native/plainDate'
import type {
  CalendarRecord,
  DurationRecord,
  PlainDateRecord as Record,
  PlainDateTimeRecord,
  PlainMonthDayRecord,
  PlainTimeRecord,
  PlainYearMonthRecord,
  ZonedDateTimeRecord,
} from './recordTypes'
import * as Shim from './shim/plainDate'
import { isPlainDateRecord } from './temporalRecords'

export type { Record }

export type FromFields = Partial<DateFields> & { calendar: CalendarRecord }
export type WithFields = Partial<DateFields>
type OverflowOptions = Temporal.OverflowOptions
type ToStringOptions = Temporal.PlainDateToStringOptions
export type DiffOptions =
  Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions
type RoundingMode = TemporalSpecHelpers.RoundingMode

type PlainDateRecord = Record

export const isRecord = isPlainDateRecord as (arg: unknown) => arg is Record

export const create: (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
) => PlainDateRecord = NativeTemporal ? Native.create : Shim.create

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarRecord,
) => PlainDateRecord = NativeTemporal ? Native.fromString : Shim.fromString

export const dayOfWeek: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.dayOfWeek
  : Shim.dayOfWeek

export const daysInWeek: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.daysInWeek
  : Shim.daysInWeek

export const weekOfYear: (record: PlainDateRecord) => number | undefined =
  NativeTemporal ? Native.weekOfYear : Shim.weekOfYear

export const yearOfWeek: (record: PlainDateRecord) => number | undefined =
  NativeTemporal ? Native.yearOfWeek : Shim.yearOfWeek

export const dayOfYear: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.dayOfYear
  : Shim.dayOfYear

export const daysInMonth: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.daysInMonth
  : Shim.daysInMonth

export const daysInYear: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.daysInYear
  : Shim.daysInYear

export const monthsInYear: (record: PlainDateRecord) => number = NativeTemporal
  ? Native.monthsInYear
  : Shim.monthsInYear

export const inLeapYear: (record: PlainDateRecord) => boolean = NativeTemporal
  ? Native.inLeapYear
  : Shim.inLeapYear

export const withFields: (
  record: PlainDateRecord,
  mod: WithFields,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const withCalendar: (
  record: PlainDateRecord,
  calendarRecord: CalendarRecord,
) => PlainDateRecord = NativeTemporal ? Native.withCalendar : Shim.withCalendar

export const add: (
  record: PlainDateRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: PlainDateRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: PlainDateRecord,
  otherRecord: PlainDateRecord,
  options?: DiffOptions,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const equals: (
  record: PlainDateRecord,
  otherRecord: PlainDateRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: PlainDateRecord,
  otherRecord: PlainDateRecord,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toZonedDateTime: {
  (record: PlainDateRecord, timeZoneId: string): ZonedDateTimeRecord
  (
    record: PlainDateRecord,
    options: ToZonedDateTimeOptions<PlainTimeRecord>,
  ): ZonedDateTimeRecord
} = NativeTemporal ? Native.toZonedDateTime : Shim.toZonedDateTime

export const toPlainDateTime: (
  record: PlainDateRecord,
  plainTimeRecord?: PlainTimeRecord,
) => PlainDateTimeRecord = NativeTemporal
  ? (Native.toPlainDateTime as (
      record: PlainDateRecord,
      plainTimeRecord?: PlainTimeRecord,
    ) => PlainDateTimeRecord)
  : (Shim.toPlainDateTime as (
      record: PlainDateRecord,
      plainTimeRecord?: PlainTimeRecord,
    ) => PlainDateTimeRecord)

export const toPlainYearMonth: (
  record: PlainDateRecord,
) => PlainYearMonthRecord = NativeTemporal
  ? Native.toPlainYearMonth
  : Shim.toPlainYearMonth

export const toPlainMonthDay: (record: PlainDateRecord) => PlainMonthDayRecord =
  NativeTemporal ? Native.toPlainMonthDay : Shim.toPlainMonthDay

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<PlainDateRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: PlainDateRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: PlainDateRecord,
  options?: ToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainDateRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString

export const withDayOfYear: (
  record: PlainDateRecord,
  dayOfYear: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.withDayOfYear
  : Shim.withDayOfYear

export const withDayOfMonth: (
  record: PlainDateRecord,
  dayOfMonth: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.withDayOfMonth
  : Shim.withDayOfMonth

export const withDayOfWeek: (
  record: PlainDateRecord,
  dayOfWeek: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.withDayOfWeek
  : Shim.withDayOfWeek

export const withWeekOfYear: (
  record: PlainDateRecord,
  weekOfYear: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.withWeekOfYear
  : Shim.withWeekOfYear

export const addYears: (
  record: PlainDateRecord,
  years: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.addYears : Shim.addYears

export const addMonths: (
  record: PlainDateRecord,
  months: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.addMonths : Shim.addMonths

export const addWeeks: (
  record: PlainDateRecord,
  weeks: number,
) => PlainDateRecord = NativeTemporal ? Native.addWeeks : Shim.addWeeks

export const addDays: (
  record: PlainDateRecord,
  days: number,
) => PlainDateRecord = NativeTemporal ? Native.addDays : Shim.addDays

export const subtractYears: (
  record: PlainDateRecord,
  units: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.subtractYears
  : Shim.subtractYears

export const subtractMonths: (
  record: PlainDateRecord,
  units: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.subtractMonths
  : Shim.subtractMonths

export const subtractWeeks: (
  record: PlainDateRecord,
  units: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal
  ? Native.subtractWeeks
  : Shim.subtractWeeks

export const subtractDays: (
  record: PlainDateRecord,
  units: number,
  options?: OverflowOptions,
) => PlainDateRecord = NativeTemporal ? Native.subtractDays : Shim.subtractDays

export const roundToYear: {
  (record: PlainDateRecord): PlainDateRecord
  (record: PlainDateRecord, roundingMode: RoundingMode): PlainDateRecord
  (record: PlainDateRecord, options: RoundingMathOptions): PlainDateRecord
} = NativeTemporal ? Native.roundToYear : Shim.roundToYear

export const roundToMonth: {
  (record: PlainDateRecord): PlainDateRecord
  (record: PlainDateRecord, roundingMode: RoundingMode): PlainDateRecord
  (record: PlainDateRecord, options: RoundingMathOptions): PlainDateRecord
} = NativeTemporal ? Native.roundToMonth : Shim.roundToMonth

export const roundToWeek: {
  (record: PlainDateRecord): PlainDateRecord
  (record: PlainDateRecord, roundingMode: RoundingMode): PlainDateRecord
  (record: PlainDateRecord, options: RoundingMathOptions): PlainDateRecord
} = NativeTemporal ? Native.roundToWeek : Shim.roundToWeek

export const startOfYear: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.startOfYear : Shim.startOfYear

export const startOfMonth: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.startOfMonth : Shim.startOfMonth

export const startOfWeek: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.startOfWeek : Shim.startOfWeek

export const endOfYear: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.endOfYear : Shim.endOfYear

export const endOfMonth: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.endOfMonth : Shim.endOfMonth

export const endOfWeek: (record: PlainDateRecord) => PlainDateRecord =
  NativeTemporal ? Native.endOfWeek : Shim.endOfWeek

export const diffYears: {
  (record0: PlainDateRecord, record1: PlainDateRecord): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    roundingMode: RoundingMode,
  ): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    options: RoundingMathOptions,
  ): number
} = NativeTemporal ? Native.diffYears : Shim.diffYears

export const diffMonths: {
  (record0: PlainDateRecord, record1: PlainDateRecord): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    roundingMode: RoundingMode,
  ): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    options: RoundingMathOptions,
  ): number
} = NativeTemporal ? Native.diffMonths : Shim.diffMonths

export const diffWeeks: {
  (record0: PlainDateRecord, record1: PlainDateRecord): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    roundingMode: RoundingMode,
  ): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    options: RoundingMathOptions,
  ): number
} = NativeTemporal ? Native.diffWeeks : Shim.diffWeeks

export const diffDays: {
  (record0: PlainDateRecord, record1: PlainDateRecord): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    roundingMode: RoundingMode,
  ): number
  (
    record0: PlainDateRecord,
    record1: PlainDateRecord,
    options: RoundingMathOptions,
  ): number
} = NativeTemporal ? Native.diffDays : Shim.diffDays
