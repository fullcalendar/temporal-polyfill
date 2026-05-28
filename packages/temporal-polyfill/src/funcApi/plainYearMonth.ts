import { DayFields, YearMonthFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsModel'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign } from '../internal/utils'
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
import { getPlainYearMonthRecordIfPresent } from './temporalRecords'

export type { Record }

type PlainYearMonthRecord = Record

export const create: (
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarRecord,
  referenceIsoDay?: number,
) => PlainYearMonthRecord = NativeTemporal ? Native.create : Shim.create

export function isRecord(arg: unknown): arg is Record {
  return !!getPlainYearMonthRecordIfPresent(arg)
}

export const fromFields: (
  fields: Partial<YearMonthFields> & { calendar?: CalendarRecord },
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
  mod: Partial<YearMonthFields>,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.withFields : Shim.withFields

export const add: (
  record: PlainYearMonthRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.add : Shim.add

export const subtract: (
  record: PlainYearMonthRecord,
  duration: DurationRecord,
  options?: OverflowOptions,
) => PlainYearMonthRecord = NativeTemporal ? Native.subtract : Shim.subtract

export const diff: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
  options?: DiffOptions<YearMonthUnitName>,
) => DurationRecord = NativeTemporal ? Native.diff : Shim.diff

export const equals: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
) => boolean = NativeTemporal ? Native.equals : Shim.equals

export const compare: (
  record: PlainYearMonthRecord,
  otherRecord: PlainYearMonthRecord,
) => NumberSign = NativeTemporal ? Native.compare : Shim.compare

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
  options?: CalendarDisplayOptions,
) => string = NativeTemporal ? Native.toString : Shim.toString

export const toSimpleString: (record: PlainYearMonthRecord) => string =
  NativeTemporal ? Native.toSimpleString : Shim.toSimpleString
