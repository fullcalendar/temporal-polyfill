import type { Temporal } from 'temporal-spec'
import { DayFields, YearMonthFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import type * as TemporalSpecHelpers from '../internal/temporalSpecHelpers'
import { NativeTemporal } from '../nativeSwitch'
import type * as CalendarFns from './calendar'
import { DateTimeFormatLike } from './commonTypes'
import type * as DurationFns from './duration'
import * as Native from './native/plainYearMonth'
import type * as PlainDateFns from './plainDate'
import type { PlainYearMonthRecord as Record } from './recordTypes'
import * as Shim from './shim/plainYearMonth'
import { isPlainYearMonthRecord } from './temporalRecords'

export type { Record }
export type Format = DateTimeFormatLike<Record>
export type FromFields = Partial<YearMonthFields> & {
  calendar?: CalendarFns.Record
}
export type WithFields = Partial<YearMonthFields>
export type DiffOptions = Temporal.RoundingOptionsWithLargestUnit<
  'year' | 'month'
>
export type ToStringOptions = Temporal.PlainDateToStringOptions

// TODO: common types
type OverflowOptions = Temporal.OverflowOptions
type RoundingMode = TemporalSpecHelpers.RoundingMode
type RoundingMathOptions = TemporalSpecHelpers.RoundingMathOptions

export const create: (
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarFns.Record,
  referenceIsoDay?: number,
) => Record = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainYearMonthRecord as (
  arg: unknown,
) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarFns.Record,
) => Record = NativeTemporal ? Native.fromString : Shim.fromString

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

export const add: (
  record: Record,
  duration: DurationFns.Record,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.add : Shim.add

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

export const subtract: (
  record: Record,
  duration: DurationFns.Record,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.subtract : Shim.subtract

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

export const diff: (
  record: Record,
  otherRecord: Record,
  options?: DiffOptions,
) => DurationFns.Record = NativeTemporal ? Native.diff : Shim.diff

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

export const roundToYear: {
  (record: Record): Record
  (record: Record, roundingMode: RoundingMode): Record
  (record: Record, options: RoundingMathOptions): Record
} = NativeTemporal ? Native.roundToYear : Shim.roundToYear

export const startOfYear: (record: Record) => Record = NativeTemporal
  ? Native.startOfYear
  : Shim.startOfYear

export const endOfYear: (record: Record) => Record = NativeTemporal
  ? Native.endOfYear
  : Shim.endOfYear

export const equals: (record: Record, otherRecord: Record) => boolean =
  NativeTemporal ? Native.equals : Shim.equals

export const compare: (record: Record, otherRecord: Record) => number =
  NativeTemporal ? Native.compare : Shim.compare

export const toPlainDate: (
  record: Record,
  fields: DayFields,
) => PlainDateFns.Record = NativeTemporal
  ? Native.toPlainDate
  : Shim.toPlainDate

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
