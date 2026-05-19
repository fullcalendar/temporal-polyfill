import { createSlotClass } from '../../classApi/slotClass'
import { DateFields } from '../../internal/fieldTypes'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { DateUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { PlainDateRecordBranding } from '../common-branding'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'

export type PlainDateNativeRecord = DateFields

export const [
  PlainDateNativeRecord,
  createPlainDateNativeRecord,
  getPlainDateNative,
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
      calendar === undefined ? undefined : getCalendarNativeRecordId(calendar),
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

export function fromFields(
  fields: Partial<DateFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = (globalThis as any).Temporal.PlainDate.from(
    { ...fields, calendar },
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

export function fromString(s: string): PlainDateNativeRecord {
  const resNative = (globalThis as any).Temporal.PlainDate.from(s)
  return createPlainDateNativeRecord(resNative)
}

export function getFields(record: PlainDateNativeRecord): DateFields {
  const native = getPlainDateNative(record)
  return {
    era: native.era,
    eraYear: native.eraYear,
    year: native.year,
    monthCode: native.monthCode,
    month: native.month,
    day: native.day,
  }
}

export function dayOfWeek(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).dayOfWeek
}

export function daysInWeek(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInWeek
}

export function weekOfYear(record: PlainDateNativeRecord): number | undefined {
  return getPlainDateNative(record).weekOfYear
}

export function yearOfWeek(record: PlainDateNativeRecord): number | undefined {
  return getPlainDateNative(record).yearOfWeek
}

export function dayOfYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).dayOfYear
}

export function daysInMonth(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInMonth
}

export function daysInYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInYear
}

export function monthsInYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).monthsInYear
}

export function inLeapYear(record: PlainDateNativeRecord): boolean {
  return getPlainDateNative(record).inLeapYear
}

export function withFields(
  record: PlainDateNativeRecord,
  mod: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const resNative = native.with(mod, options)
  return createPlainDateNativeRecord(resNative)
}

export function withCalendar(
  record: PlainDateNativeRecord,
  calendarRecord: CalendarNativeRecord,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const calendarId = getCalendarNativeRecordId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createPlainDateNativeRecord(resNative)
}

export function add(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

export function subtract(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

export function until(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
  options?: DiffOptions<DateUnitName>,
): DurationNativeRecord {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function since(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
  options?: DiffOptions<DateUnitName>,
): DurationNativeRecord {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  const resNative = native.since(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function equals(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
): boolean {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
): NumberSign {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  return (globalThis as any).Temporal.PlainDate.compare(native, otherNative)
}

export function toString(
  record: PlainDateNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainDateNative(record).toString(options)
}
