import { createSlotClass } from '../../classApi/slotClass'
import { DateFields } from '../../internal/fieldTypes'
import { DiffOptions, OverflowOptions } from '../../internal/optionsModel'
import { DateUnitName } from '../../internal/units'
import { PlainDateRecordBranding } from '../common-branding'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNativeRecordSlots,
} from './duration'

export type PlainDateNativeRecord = DateFields

export const [
  PlainDateNativeRecord,
  createPlainDateNativeRecord,
  getPlainDateNativeRecordSlots,
] = createSlotClass(
  PlainDateRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarNativeRecord,
  ) =>
    new (globalThis as any).Temporal.PlainDate(
      isoYear,
      isoMonth,
      isoDay,
      calendar === undefined
        ? undefined
        : getCalendarNativeRecordId(calendar),
    ),
  (native) => native.toString(),
  {
    calendarId: (native: any) => native.calendarId,
    year: (native: any) => native.year,
    month: (native: any) => native.month,
    monthCode: (native: any) => native.monthCode,
    day: (native: any) => native.day,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarNativeRecord,
): PlainDateNativeRecord {
  return new PlainDateNativeRecord(isoYear, isoMonth, isoDay, calendar)
}

export function withFields(
  record: PlainDateNativeRecord,
  mod: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const resNative = native.with(mod, options)
  return createPlainDateNativeRecord(resNative)
}

export function withCalendar(
  record: PlainDateNativeRecord,
  calendarRecord: CalendarNativeRecord,
): PlainDateNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const calendarId = getCalendarNativeRecordId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createPlainDateNativeRecord(resNative)
}

export function add(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const durationNative = getDurationNativeRecordSlots(duration).native
  const resNative = native.add(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

export function subtract(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const durationNative = getDurationNativeRecordSlots(duration).native
  const resNative = native.subtract(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

export function until(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
  options?: DiffOptions<DateUnitName>,
): DurationNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const otherNative = getPlainDateNativeRecordSlots(otherRecord).native
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function since(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
  options?: DiffOptions<DateUnitName>,
): DurationNativeRecord {
  const native = getPlainDateNativeRecordSlots(record).native
  const otherNative = getPlainDateNativeRecordSlots(otherRecord).native
  const resNative = native.since(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function equals(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
): boolean {
  const native = getPlainDateNativeRecordSlots(record).native
  const otherNative = getPlainDateNativeRecordSlots(otherRecord).native
  return native.equals(otherNative)
}
