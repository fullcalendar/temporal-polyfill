import type { Temporal } from 'temporal-spec'
import { DayFields, YearMonthFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainYearMonth'
import type {
  CalendarRecord,
  DurationRecord,
  PlainDateRecord,
  PlainYearMonthRecord as Record,
} from './recordTypes'
import * as Shim from './shim/plainYearMonth'
import { isPlainYearMonthRecord } from './temporalRecords'

export type { Record }

export type FromFields = Partial<YearMonthFields> & {
  calendar?: CalendarRecord
}
export type WithFields = Partial<YearMonthFields>
type OverflowOptions = Temporal.OverflowOptions
type ToStringOptions = Temporal.PlainDateToStringOptions
export type DiffOptions = Temporal.RoundingOptionsWithLargestUnit<
  'year' | 'month'
>
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions
type RoundingMode = TemporalSpecHelpers.RoundingMode

type PlainYearMonthRecord = Record

export const create: (
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarRecord,
  referenceIsoDay?: number,
) => PlainYearMonthRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainYearMonthRecord as (
  arg: unknown,
) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarRecord,
) => PlainYearMonthRecord = NativeTemporal ? Native.fromString : Shim.fromString

export const daysInMonth: (record: PlainYearMonthRecord) => number =
  NativeTemporal ? Native.daysInMonth : Shim.daysInMonth

export const daysInYear: (record: PlainYearMonthRecord) => number =
  NativeTemporal ? Native.daysInYear : Shim.daysInYear

export const monthsInYear: (record: PlainYearMonthRecord) => number =
  NativeTemporal ? Native.monthsInYear : Shim.monthsInYear

export const inLeapYear: (record: PlainYearMonthRecord) => boolean =
  NativeTemporal ? Native.inLeapYear : Shim.inLeapYear

export const withFields: (
  record: PlainYearMonthRecord,
  mod: WithFields,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const add: (
  record: PlainYearMonthRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.add : Shim.add

export const addYears: (
  record: PlainYearMonthRecord,
  years: number,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.addYears : Shim.addYears

export const addMonths: (
  record: PlainYearMonthRecord,
  months: number,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.addMonths : Shim.addMonths

export const subtract: (
  record: PlainYearMonthRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const subtractYears: (
  record: PlainYearMonthRecord,
  years: number,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal
  ? Native.subtractYears
  : Shim.subtractYears

export const subtractMonths: (
  record: PlainYearMonthRecord,
  months: number,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal
  ? Native.subtractMonths
  : Shim.subtractMonths

export const diff: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
  options?: DiffOptions,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const diffYears: (
  record0: PlainYearMonthRecord,
  record1: PlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
) => number = NativeTemporal ? Native.diffYears : Shim.diffYears

export const diffMonths: (
  record0: PlainYearMonthRecord,
  record1: PlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
) => number = NativeTemporal ? Native.diffMonths : Shim.diffMonths

export const roundToYear: (
  record: PlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
) => PlainYearMonthRecord = NativeTemporal
  ? Native.roundToYear
  : Shim.roundToYear

export const startOfYear: (
  record: PlainYearMonthRecord,
) => PlainYearMonthRecord = NativeTemporal
  ? Native.startOfYear
  : Shim.startOfYear

export const endOfYear: (record: PlainYearMonthRecord) => PlainYearMonthRecord =
  NativeTemporal ? Native.endOfYear : Shim.endOfYear

export const equals: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
) => number = NativeTemporal ? Native.compare : Shim.compare

export const toPlainDate: (
  record: PlainYearMonthRecord,
  fields: DayFields,
) => PlainDateRecord = NativeTemporal ? Native.toPlainDate : Shim.toPlainDate

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<PlainYearMonthRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: PlainYearMonthRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: PlainYearMonthRecord,
  options?: ToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainYearMonthRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
