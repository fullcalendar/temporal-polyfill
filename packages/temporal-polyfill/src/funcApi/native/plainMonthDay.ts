import type { Temporal } from 'temporal-spec'
import {
  attachDebugString,
  defineTemporalClass,
} from '../../apiHelpers/classStyle'
import { MonthDayFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike } from '../commonTypes'
import { PlainMonthDayRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainMonthDaySlots,
  setPlainMonthDaySlots,
} from '../temporalRecords'
import {
  refineNativeCalendarArgMaybe,
  runNativeCalendarResolver,
} from './calendarResolve'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import { monthCodeDayFieldGetters } from './mixins'
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'

type Format = DateTimeFormatLike<NativePlainMonthDayRecord>

export const getNativePlainMonthDay: (
  record: unknown,
) => Temporal.PlainMonthDay = getPlainMonthDaySlots

export type NativePlainMonthDayRecord = InstanceType<
  typeof NativePlainMonthDayRecord
> &
  RecordTypes.PlainMonthDayRecord
export const NativePlainMonthDayRecord = defineTemporalClass(
  PlainMonthDayRecordBranding,
  class {
    get calendarId() {
      return getNativePlainMonthDay(this).calendarId
    }

    toJSON() {
      return getNativePlainMonthDay(this).toJSON()
    }

    valueOf(): never {
      return getNativePlainMonthDay(this).valueOf()
    }
  },
  getNativePlainMonthDay,
  monthCodeDayFieldGetters,
)

export function createNativePlainMonthDayRecord(
  native: Temporal.PlainMonthDay,
): NativePlainMonthDayRecord {
  const instance = Object.create(NativePlainMonthDayRecord.prototype)
  setPlainMonthDaySlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
  referenceIsoYear?: number,
): NativePlainMonthDayRecord {
  return createNativePlainMonthDayRecord(
    new NativeTemporal!.PlainMonthDay(
      isoMonth,
      isoDay,
      refineNativeCalendarArgMaybe(calendar),
      referenceIsoYear,
    ),
  )
}

export function fromFields(
  fields: Partial<MonthDayFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): NativePlainMonthDayRecord {
  const calendar = refineNativeCalendarArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainMonthDay.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createNativePlainMonthDayRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): NativePlainMonthDayRecord {
  const resNative = NativeTemporal!.PlainMonthDay.from(s)
  runNativeCalendarResolver(resNative.calendarId, getCalendarRecord)
  return createNativePlainMonthDayRecord(resNative)
}

export function withFields(
  record: NativePlainMonthDayRecord,
  mod: Partial<MonthDayFields>,
  options?: Temporal.OverflowOptions,
): NativePlainMonthDayRecord {
  const native = getNativePlainMonthDay(record)
  const resNative = native.with(mod, options)
  return createNativePlainMonthDayRecord(resNative)
}

export function equals(
  record: NativePlainMonthDayRecord,
  otherRecord: NativePlainMonthDayRecord,
): boolean {
  const native = getNativePlainMonthDay(record)
  const otherNative = getNativePlainMonthDay(otherRecord)
  return native.equals(otherNative)
}

export function toPlainDate(
  record: NativePlainMonthDayRecord,
  fields: { era?: string; eraYear?: number; year?: number },
): NativePlainDateRecord {
  const native = getNativePlainMonthDay(record)
  const resNative = native.toPlainDate(fields)
  return createNativePlainDateRecord(resNative)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativePlainMonthDay)

export function toLocaleString(
  record: NativePlainMonthDayRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativePlainMonthDay(record).toLocaleString(locales, options)
}

export function toString(
  record: NativePlainMonthDayRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return getNativePlainMonthDay(record).toString(options)
}

export function toBasicString(record: NativePlainMonthDayRecord): string {
  return getNativePlainMonthDay(record).toString()
}
