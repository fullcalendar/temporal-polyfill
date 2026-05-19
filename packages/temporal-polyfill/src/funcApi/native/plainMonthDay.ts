import { createSlotClass } from '../../classApi/slotClass'
import { MonthDayFields } from '../../internal/fieldTypes'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { PlainMonthDayRecordBranding } from '../common-branding'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'

export type PlainMonthDayNativeRecord = any & MonthDayFields

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
    new (globalThis as any).Temporal.PlainMonthDay(
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
  const resNative = (globalThis as any).Temporal.PlainMonthDay.from(
    { ...fields, calendar },
    options,
  )
  return createPlainMonthDayNativeRecord(resNative)
}

export function fromString(s: string): PlainMonthDayNativeRecord {
  const resNative = (globalThis as any).Temporal.PlainMonthDay.from(s)
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

export function toString(
  record: PlainMonthDayNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainMonthDayNative(record).toString(options)
}
