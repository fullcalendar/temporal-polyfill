import { createSlotClass } from '../../classApi/slotClass'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../../internal/optionsModel'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { ZonedDateTimeRecordBranding } from '../common-branding'
import { CalendarNativeRecord, getCalendarNativeRecordId } from './calendar'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { InstantNativeRecord, createInstantNativeRecord } from './instant'
import {
  PlainDateNativeRecord,
  createPlainDateNativeRecord,
  getPlainDateNative,
} from './plainDate'
import {
  PlainDateTimeNativeRecord,
  createPlainDateTimeNativeRecord,
} from './plainDateTime'
import {
  PlainMonthDayNativeRecord,
  createPlainMonthDayNativeRecord,
} from './plainMonthDay'
import {
  PlainTimeNativeRecord,
  createPlainTimeNativeRecord,
  getPlainTimeNative,
} from './plainTime'
import {
  PlainYearMonthNativeRecord,
  createPlainYearMonthNativeRecord,
} from './plainYearMonth'

type ZonedDateTimeNativeFields = Partial<DateTimeFields> & {
  calendar?: CalendarNativeRecord
  offset?: string
  timeZone: string
}

export type ZonedDateTimeNativeRecord = any

export const [
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
  getZonedDateTimeNative,
] = createSlotClass(
  ZonedDateTimeRecordBranding,
  (
    epochNanoseconds: bigint,
    timeZoneId: string,
    calendar?: CalendarNativeRecord,
  ) =>
    new (globalThis as any).Temporal.ZonedDateTime(
      epochNanoseconds,
      timeZoneId,
      calendar === undefined ? undefined : getCalendarNativeRecordId(calendar),
    ),
  (native) => native.toString(),
  {
    calendarId: (native: any) => native.calendarId,
    epochMilliseconds: (native: any) => native.epochMilliseconds,
    epochNanoseconds: (native: any) => native.epochNanoseconds,
    timeZoneId: (native: any) => native.timeZoneId,
  },
  {},
  {},
)

export function create(
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarNativeRecord,
): ZonedDateTimeNativeRecord {
  return new ZonedDateTimeNativeRecord(epochNanoseconds, timeZoneId, calendar)
}

export function fromFields(
  fields: ZonedDateTimeNativeFields,
  options?: ZonedFieldOptions,
): ZonedDateTimeNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = (globalThis as any).Temporal.ZonedDateTime.from(
    { ...fields, calendar },
    options,
  )
  return createZonedDateTimeNativeRecord(resNative)
}

export function fromString(
  s: string,
  options?: ZonedFieldOptions,
): ZonedDateTimeNativeRecord {
  const resNative = (globalThis as any).Temporal.ZonedDateTime.from(s, options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function withFields(
  record: ZonedDateTimeNativeRecord,
  mod: Partial<DateTimeFields>,
  options?: ZonedFieldOptions,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const resNative = native.with(mod, options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function withCalendar(
  record: ZonedDateTimeNativeRecord,
  calendarRecord: CalendarNativeRecord,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const calendarId = getCalendarNativeRecordId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createZonedDateTimeNativeRecord(resNative)
}

export function withTimeZone(
  record: ZonedDateTimeNativeRecord,
  timeZoneId: string,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const resNative = native.withTimeZone(timeZoneId)
  return createZonedDateTimeNativeRecord(resNative)
}

export function withPlainDate(
  record: ZonedDateTimeNativeRecord,
  plainDateRecord: PlainDateNativeRecord,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const plainDateNative = getPlainDateNative(plainDateRecord)
  const resNative = native.withPlainDate(plainDateNative)
  return createZonedDateTimeNativeRecord(resNative)
}

export function withPlainTime(
  record: ZonedDateTimeNativeRecord,
  plainTimeRecord?: PlainTimeNativeRecord,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getPlainTimeNative(plainTimeRecord)
  const resNative = native.withPlainTime(plainTimeNative)
  return createZonedDateTimeNativeRecord(resNative)
}

export function offsetNanoseconds(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).offsetNanoseconds
}

export function offset(record: ZonedDateTimeNativeRecord): string {
  return getZonedDateTimeNative(record).offset
}

export function dayOfWeek(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).dayOfWeek
}

export function daysInWeek(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).daysInWeek
}

export function weekOfYear(
  record: ZonedDateTimeNativeRecord,
): number | undefined {
  return getZonedDateTimeNative(record).weekOfYear
}

export function yearOfWeek(
  record: ZonedDateTimeNativeRecord,
): number | undefined {
  return getZonedDateTimeNative(record).yearOfWeek
}

export function dayOfYear(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).dayOfYear
}

export function daysInMonth(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).daysInMonth
}

export function daysInYear(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).daysInYear
}

export function monthsInYear(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).monthsInYear
}

export function inLeapYear(record: ZonedDateTimeNativeRecord): boolean {
  return getZonedDateTimeNative(record).inLeapYear
}

export function hoursInDay(record: ZonedDateTimeNativeRecord): number {
  return getZonedDateTimeNative(record).hoursInDay
}

export function toString(
  record: ZonedDateTimeNativeRecord,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return getZonedDateTimeNative(record).toString(options)
}

export function add(
  record: ZonedDateTimeNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function subtract(
  record: ZonedDateTimeNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function until(
  record: ZonedDateTimeNativeRecord,
  otherRecord: ZonedDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getZonedDateTimeNative(record)
  const otherNative = getZonedDateTimeNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function since(
  record: ZonedDateTimeNativeRecord,
  otherRecord: ZonedDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getZonedDateTimeNative(record)
  const otherNative = getZonedDateTimeNative(otherRecord)
  const resNative = native.since(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: ZonedDateTimeNativeRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const resNative = native.round(options)
  return createZonedDateTimeNativeRecord(resNative)
}

export function startOfDay(
  record: ZonedDateTimeNativeRecord,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const resNative = native.startOfDay()
  return createZonedDateTimeNativeRecord(resNative)
}

export function getTimeZoneTransition(
  record: ZonedDateTimeNativeRecord,
  options: DirectionOptions | DirectionName,
): ZonedDateTimeNativeRecord | null {
  const native = getZonedDateTimeNative(record)
  const resNative = native.getTimeZoneTransition(options)
  return resNative ? createZonedDateTimeNativeRecord(resNative) : null
}

export function equals(
  record: ZonedDateTimeNativeRecord,
  otherRecord: ZonedDateTimeNativeRecord,
): boolean {
  const native = getZonedDateTimeNative(record)
  const otherNative = getZonedDateTimeNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: ZonedDateTimeNativeRecord,
  otherRecord: ZonedDateTimeNativeRecord,
): NumberSign {
  const native = getZonedDateTimeNative(record)
  const otherNative = getZonedDateTimeNative(otherRecord)
  return (globalThis as any).Temporal.ZonedDateTime.compare(native, otherNative)
}

export function toInstant(
  record: ZonedDateTimeNativeRecord,
): InstantNativeRecord {
  const resNative = getZonedDateTimeNative(record).toInstant()
  return createInstantNativeRecord(resNative)
}

export function toPlainDateTime(
  record: ZonedDateTimeNativeRecord,
): PlainDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).toPlainDateTime()
  return createPlainDateTimeNativeRecord(resNative)
}

export function toPlainDate(
  record: ZonedDateTimeNativeRecord,
): PlainDateNativeRecord {
  const resNative = getZonedDateTimeNative(record).toPlainDate()
  return createPlainDateNativeRecord(resNative)
}

export function toPlainTime(
  record: ZonedDateTimeNativeRecord,
): PlainTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).toPlainTime()
  return createPlainTimeNativeRecord(resNative)
}

export function toPlainYearMonth(
  record: ZonedDateTimeNativeRecord,
): PlainYearMonthNativeRecord {
  const resNative = getZonedDateTimeNative(record).toPlainYearMonth()
  return createPlainYearMonthNativeRecord(resNative)
}

export function toPlainMonthDay(
  record: ZonedDateTimeNativeRecord,
): PlainMonthDayNativeRecord {
  const resNative = getZonedDateTimeNative(record).toPlainMonthDay()
  return createPlainMonthDayNativeRecord(resNative)
}

export function toLocaleString(
  record: ZonedDateTimeNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getZonedDateTimeNative(record).toLocaleString(locales, options)
}
