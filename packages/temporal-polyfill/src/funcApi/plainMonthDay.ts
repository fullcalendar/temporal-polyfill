import type { Temporal } from 'temporal-spec'
import { EraYearOrYear, MonthDayFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { NativeTemporal } from '../nativeSwitch'
import type * as CalendarFns from './calendar'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainMonthDay'
import type * as PlainDateFns from './plainDate'
import type { PlainMonthDayRecord as Record } from './recordTypes'
import * as Shim from './shim/plainMonthDay'
import { isPlainMonthDayRecord } from './temporalRecords'

export type { Record }
export type Format = DateTimeFormatLike<Record>

export type FromFields = Partial<MonthDayFields> & {
  calendar?: CalendarFns.Record
}
export type WithFields = Partial<MonthDayFields>
type OverflowOptions = Temporal.OverflowOptions
type ToStringOptions = Temporal.PlainDateToStringOptions

export const create: (
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarFns.Record,
  referenceIsoYear?: number,
) => Record = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainMonthDayRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: FromFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarFns.Record,
) => Record = NativeTemporal ? Native.fromString : Shim.fromString

export const withFields: (
  record: Record,
  mod: WithFields,
  options?: OverflowOptions,
) => Record = NativeTemporal ? Native.withFields : Shim.withFields

export const equals: (record: Record, otherRecord: Record) => boolean =
  NativeTemporal ? Native.equals : Shim.equals

export const toPlainDate: (
  record: Record,
  fields: EraYearOrYear,
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
