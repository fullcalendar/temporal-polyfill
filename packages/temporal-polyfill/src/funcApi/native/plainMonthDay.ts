import type { Temporal } from 'temporal-spec'
import { MonthDayFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainMonthDaySlots,
  setPlainMonthDaySlots,
} from '../temporalRecords'
import {
  refineCalendarNativeArgMaybe,
  runCalendarNativeResolver,
} from './calendarResolve'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'

type PlainMonthDayRecord = RecordTypes.PlainMonthDayRecord

type Format = DateTimeFormatLike<PlainMonthDayNativeRecord>

export const getPlainMonthDayNative: (
  record: unknown,
) => Temporal.PlainMonthDay = getPlainMonthDaySlots

class _PlainMonthDayNativeRecord
  implements Pick<MonthDayFields, 'monthCode' | 'day'>, PlainMonthDayRecord
{
  declare readonly [RecordTypes.PlainMonthDayRecordBrand]: undefined

  get calendarId() {
    return getPlainMonthDayNative(this).calendarId
  }

  get monthCode() {
    return getPlainMonthDayNative(this).monthCode
  }

  get day() {
    return getPlainMonthDayNative(this).day
  }

  toJSON() {
    return getPlainMonthDayNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

export function createPlainMonthDayNativeRecord(
  native: Temporal.PlainMonthDay,
): PlainMonthDayNativeRecord {
  const instance = Object.create(PlainMonthDayNativeRecord.prototype)
  setPlainMonthDaySlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
  return instance
}

export type PlainMonthDayNativeRecord = _PlainMonthDayNativeRecord
export const PlainMonthDayNativeRecord = defineTemporalClass(
  _PlainMonthDayNativeRecord,
  'PlainMonthDay',
)

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
  referenceIsoYear?: number,
): PlainMonthDayNativeRecord {
  return createPlainMonthDayNativeRecord(
    new NativeTemporal!.PlainMonthDay(
      isoMonth,
      isoDay,
      refineCalendarNativeArgMaybe(calendar),
      referenceIsoYear,
    ),
  )
}

export function fromFields(
  fields: Partial<MonthDayFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): PlainMonthDayNativeRecord {
  const calendar = refineCalendarNativeArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainMonthDay.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createPlainMonthDayNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): PlainMonthDayNativeRecord {
  const resNative = NativeTemporal!.PlainMonthDay.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendarRecord)
  return createPlainMonthDayNativeRecord(resNative)
}

export function withFields(
  record: PlainMonthDayNativeRecord,
  mod: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): PlainMonthDayNativeRecord {
  const native = getPlainMonthDayNative(record)
  const resNative = native.with(mod, options)
  return createPlainMonthDayNativeRecord(resNative)
}

export function equals(
  record: PlainMonthDayNativeRecord,
  otherRecord: PlainMonthDayNativeRecord,
): boolean {
  const native = getPlainMonthDayNative(record)
  const otherNative = getPlainMonthDayNative(otherRecord)
  return native.equals(otherNative)
}

export function toPlainDate(
  record: PlainMonthDayNativeRecord,
  fields: { era?: string; eraYear?: number; year?: number },
): PlainDateNativeRecord {
  const native = getPlainMonthDayNative(record)
  const resNative = native.toPlainDate(fields)
  return createPlainDateNativeRecord(resNative)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getPlainMonthDayNative)

export function toLocaleString(
  record: PlainMonthDayNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainMonthDayNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainMonthDayNativeRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return getPlainMonthDayNative(record).toString(options)
}

export function toBasicString(record: PlainMonthDayNativeRecord): string {
  return getPlainMonthDayNative(record).toString()
}
