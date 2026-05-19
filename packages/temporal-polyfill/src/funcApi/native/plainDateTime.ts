import { createSlotClass } from '../../classApi/slotClass'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
} from '../../internal/optionsModel'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { PlainDateTimeRecordBranding } from '../common-branding'
import { DateTimeFormatLike } from '../dateTimeFormat'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  PlainTimeNativeRecord,
  createPlainTimeNativeRecord,
  getPlainTimeNative,
} from './plainTime'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

export type PlainDateTimeNativeRecord = DateTimeFields
type Format = DateTimeFormatLike<PlainDateTimeNativeRecord>

export const [
  PlainDateTimeNativeRecord,
  createPlainDateTimeNativeRecord,
  getPlainDateTimeNative,
] = createSlotClass(
  PlainDateTimeRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
    calendar?: CalendarNativeRecord,
  ) =>
    new (globalThis as any).Temporal.PlainDateTime(
      isoYear,
      isoMonth,
      isoDay,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      calendar === undefined ? undefined : getCalendarNativeRecordId(calendar),
    ),
  (native) => native.toString(),
  {
    calendarId: (native: any) => native.calendarId,
    year: (native: any) => native.year,
    month: (native: any) => native.month,
    monthCode: (native: any) => native.monthCode,
    day: (native: any) => native.day,
    hour: (native: any) => native.hour,
    minute: (native: any) => native.minute,
    second: (native: any) => native.second,
    millisecond: (native: any) => native.millisecond,
    microsecond: (native: any) => native.microsecond,
    nanosecond: (native: any) => native.nanosecond,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
  microsecond?: number,
  nanosecond?: number,
  calendar?: CalendarNativeRecord,
): PlainDateTimeNativeRecord {
  return new PlainDateTimeNativeRecord(
    isoYear,
    isoMonth,
    isoDay,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
    calendar,
  )
}

export function fromFields(
  fields: Partial<DateTimeFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = (globalThis as any).Temporal.PlainDateTime.from(
    { ...fields, calendar },
    options,
  )
  return createPlainDateTimeNativeRecord(resNative)
}

export function fromString(s: string): PlainDateTimeNativeRecord {
  const resNative = (globalThis as any).Temporal.PlainDateTime.from(s)
  return createPlainDateTimeNativeRecord(resNative)
}

export function withCalendar(
  record: PlainDateTimeNativeRecord,
  calendarRecord: CalendarNativeRecord,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const calendarId = getCalendarNativeRecordId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createPlainDateTimeNativeRecord(resNative)
}

export function withFields(
  record: PlainDateTimeNativeRecord,
  mod: Partial<DateTimeFields>,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const resNative = native.with(mod, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function withPlainTime(
  record: PlainDateTimeNativeRecord,
  plainTimeRecord?: PlainTimeNativeRecord,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getPlainTimeNative(plainTimeRecord)
  const resNative = native.withPlainTime(plainTimeNative)
  return createPlainDateTimeNativeRecord(resNative)
}

export function dayOfWeek(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).dayOfWeek
}

export function daysInWeek(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).daysInWeek
}

export function weekOfYear(
  record: PlainDateTimeNativeRecord,
): number | undefined {
  return getPlainDateTimeNative(record).weekOfYear
}

export function yearOfWeek(
  record: PlainDateTimeNativeRecord,
): number | undefined {
  return getPlainDateTimeNative(record).yearOfWeek
}

export function dayOfYear(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).dayOfYear
}

export function daysInMonth(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).daysInMonth
}

export function daysInYear(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).daysInYear
}

export function monthsInYear(record: PlainDateTimeNativeRecord): number {
  return getPlainDateTimeNative(record).monthsInYear
}

export function inLeapYear(record: PlainDateTimeNativeRecord): boolean {
  return getPlainDateTimeNative(record).inLeapYear
}

export function add(
  record: PlainDateTimeNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtract(
  record: PlainDateTimeNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function until(
  record: PlainDateTimeNativeRecord,
  otherRecord: PlainDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getPlainDateTimeNative(record)
  const otherNative = getPlainDateTimeNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function since(
  record: PlainDateTimeNativeRecord,
  otherRecord: PlainDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getPlainDateTimeNative(record)
  const otherNative = getPlainDateTimeNative(otherRecord)
  const resNative = native.since(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: PlainDateTimeNativeRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const resNative = native.round(options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function equals(
  record: PlainDateTimeNativeRecord,
  otherRecord: PlainDateTimeNativeRecord,
): boolean {
  const native = getPlainDateTimeNative(record)
  const otherNative = getPlainDateTimeNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: PlainDateTimeNativeRecord,
  otherRecord: PlainDateTimeNativeRecord,
): NumberSign {
  const native = getPlainDateTimeNative(record)
  const otherNative = getPlainDateTimeNative(otherRecord)
  return (globalThis as any).Temporal.PlainDateTime.compare(native, otherNative)
}

export function toZonedDateTime(
  record: PlainDateTimeNativeRecord,
  timeZoneId: string,
  options?: EpochDisambigOptions,
): ZonedDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const resNative = native.toZonedDateTime(timeZoneId, options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function toPlainDate(
  record: PlainDateTimeNativeRecord,
): PlainDateNativeRecord {
  const resNative = getPlainDateTimeNative(record).toPlainDate()
  return createPlainDateNativeRecord(resNative)
}

export function toPlainTime(
  record: PlainDateTimeNativeRecord,
): PlainTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).toPlainTime()
  return createPlainTimeNativeRecord(resNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainDateTimeNative, locales, options)
}

export function toLocaleString(
  record: PlainDateTimeNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainDateTimeNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainDateTimeNativeRecord,
  options?: DateTimeDisplayOptions,
): string {
  return getPlainDateTimeNative(record).toString(options)
}
