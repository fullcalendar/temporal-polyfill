import { createSlotClass } from '../../apiHelpers/slotClass'
import { MonthDayFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { DateTimeFormatLike } from '../commonTypes'
import { Temporal } from '../nativeSwitch'
import { PlainMonthDayRecordBranding } from '../recordBranding'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'

export type PlainMonthDayNativeRecord = any & MonthDayFields
type Format = DateTimeFormatLike<PlainMonthDayNativeRecord>

export const [
  PlainMonthDayNativeRecord,
  createPlainMonthDayNativeRecord,
  getPlainMonthDayNative,
] = createSlotClass(
  PlainMonthDayRecordBranding,
  (
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarNativeRecord,
    referenceIsoYear?: number,
  ) =>
    new Temporal!.PlainMonthDay(
      isoMonth,
      isoDay,
      calendar === undefined ? undefined : getCalendarNativeRecordId(calendar),
      referenceIsoYear,
    ),
  (native) => native.toString(),
  {
    calendarId: (native: any) => native.calendarId,
    monthCode: (native: any) => native.monthCode,
    day: (native: any) => native.day,
  },
  {},
  {},
)

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarNativeRecord,
  referenceIsoYear?: number,
): PlainMonthDayNativeRecord {
  return new PlainMonthDayNativeRecord(
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromFields(
  fields: Partial<MonthDayFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainMonthDayNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = Temporal!.PlainMonthDay.from(
    { ...fields, calendar },
    options,
  )
  return createPlainMonthDayNativeRecord(resNative)
}

export function fromString(s: string): PlainMonthDayNativeRecord {
  const resNative = Temporal!.PlainMonthDay.from(s)
  return createPlainMonthDayNativeRecord(resNative)
}

export function withFields(
  record: PlainMonthDayNativeRecord,
  mod: Partial<MonthDayFields>,
  options?: OverflowOptions,
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

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainMonthDayNative, locales, options)
}

export function toLocaleString(
  record: PlainMonthDayNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainMonthDayNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainMonthDayNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainMonthDayNative(record).toString(options)
}
