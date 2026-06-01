import type { Temporal } from 'temporal-spec'
import { EraYearOrYear, MonthDayFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { NativeTemporal } from '../nativeSwitch'
import { DateTimeFormatLike } from './commonTypes'
import * as Native from './native/plainMonthDay'
import type {
  CalendarRecord,
  PlainDateRecord,
  PlainMonthDayRecord as Record,
} from './recordTypes'
import * as Shim from './shim/plainMonthDay'
import { isPlainMonthDayRecord } from './temporalRecords'

export type { Record }

type PlainMonthDayRecord = Record

export const create: (
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
  referenceIsoYear?: number,
) => PlainMonthDayRecord = NativeTemporal ? Native.create : Shim.create

export const isRecord = isPlainMonthDayRecord as (arg: unknown) => arg is Record

export const fromFields: (
  fields: Partial<MonthDayFields> & { calendar?: CalendarRecord },
  options?: Temporal.OverflowOptions,
) => PlainMonthDayRecord = NativeTemporal ? Native.fromFields : Shim.fromFields

export const fromString: (
  s: string,
  getCalendar: (calendarId: string) => CalendarRecord,
) => PlainMonthDayRecord = NativeTemporal ? Native.fromString : Shim.fromString

export const withFields: (
  record: PlainMonthDayRecord,
  mod: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
) => PlainMonthDayRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const equals: (
  record: PlainMonthDayRecord,
  otherRecord: PlainMonthDayRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const toPlainDate: (
  record: PlainMonthDayRecord,
  fields: EraYearOrYear,
) => PlainDateRecord = NativeTemporal ? Native.toPlainDate : Shim.toPlainDate

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => DateTimeFormatLike<PlainMonthDayRecord> = NativeTemporal
  ? Native.createFormat
  : Shim.createFormat

export const toLocaleString: (
  record: PlainMonthDayRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => string = NativeTemporal ? Native.toLocaleString : Shim.toLocaleString

export const toString: (
  record: PlainMonthDayRecord,
  options?: Temporal.PlainDateToStringOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainMonthDayRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
