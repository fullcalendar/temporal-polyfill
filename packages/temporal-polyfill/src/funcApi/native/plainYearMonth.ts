import {
  createSlotClass,
  getBrandingAndSlots,
} from '../../apiHelpers/slotClass'
import { YearMonthFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { YearMonthUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { DateTimeFormatLike } from '../commonTypes'
import { Temporal } from '../nativeSwitch'
import { PlainYearMonthRecordBranding } from '../recordBranding'
import {
  CalendarNativeRecord,
  CalendarNativeResolver,
  assertCalendarNativeStringResolved,
  getCalendarNativeRecordId,
} from './calendar'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'

export type PlainYearMonthNativeRecord = any & YearMonthFields
type Format = DateTimeFormatLike<PlainYearMonthNativeRecord>

export const [
  PlainYearMonthNativeRecord,
  createPlainYearMonthNativeRecord,
  getPlainYearMonthNative,
] = createSlotClass(
  PlainYearMonthRecordBranding,
  (
    isoYear: number,
    isoMonth: number,
    calendar?: CalendarNativeRecord,
    referenceIsoDay?: number,
  ) =>
    new Temporal!.PlainYearMonth(
      isoYear,
      isoMonth,
      calendar === undefined ? undefined : getCalendarNativeRecordId(calendar),
      referenceIsoDay,
    ),
  (native) => native.toString(),
  {
    calendarId: (native: any) => native.calendarId,
    era: (native: any) => native.era,
    eraYear: (native: any) => native.eraYear,
    year: (native: any) => native.year,
    monthCode: (native: any) => native.monthCode,
    month: (native: any) => native.month,
    daysInMonth: (native: any) => native.daysInMonth,
    daysInYear: (native: any) => native.daysInYear,
    inLeapYear: (native: any) => native.inLeapYear,
    monthsInYear: (native: any) => native.monthsInYear,
  },
  {},
  {},
)

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarNativeRecord,
  referenceIsoDay?: number,
): PlainYearMonthNativeRecord {
  return new PlainYearMonthNativeRecord(
    isoYear,
    isoMonth,
    calendar,
    referenceIsoDay,
  )
}

export function isRecord(arg: unknown): arg is PlainYearMonthNativeRecord {
  const brandingAndSlots = getBrandingAndSlots(arg)
  return brandingAndSlots?.[0] === PlainYearMonthRecordBranding
}

export function fromFields(
  fields: Partial<YearMonthFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainYearMonthNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = Temporal!.PlainYearMonth.from(
    { ...fields, calendar },
    options,
  )
  return createPlainYearMonthNativeRecord(resNative)
}

export function fromString(
  s: string,
  resolveCalendar?: CalendarNativeResolver,
): PlainYearMonthNativeRecord {
  const resNative = Temporal!.PlainYearMonth.from(s)
  assertCalendarNativeStringResolved(resNative.calendarId, resolveCalendar)
  return createPlainYearMonthNativeRecord(resNative)
}

export function daysInMonth(record: PlainYearMonthNativeRecord): number {
  return getPlainYearMonthNative(record).daysInMonth
}

export function daysInYear(record: PlainYearMonthNativeRecord): number {
  return getPlainYearMonthNative(record).daysInYear
}

export function monthsInYear(record: PlainYearMonthNativeRecord): number {
  return getPlainYearMonthNative(record).monthsInYear
}

export function inLeapYear(record: PlainYearMonthNativeRecord): boolean {
  return getPlainYearMonthNative(record).inLeapYear
}

export function withFields(
  record: PlainYearMonthNativeRecord,
  mod: Partial<YearMonthFields>,
  options?: OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const resNative = native.with(mod, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function add(
  record: PlainYearMonthNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function subtract(
  record: PlainYearMonthNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createPlainYearMonthNativeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainYearMonthNativeRecord,
  otherRecord: PlainYearMonthNativeRecord,
  options?: DiffOptions<YearMonthUnitName>,
): DurationNativeRecord {
  const native = getPlainYearMonthNative(record)
  const otherNative = getPlainYearMonthNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function equals(
  record: PlainYearMonthNativeRecord,
  otherRecord: PlainYearMonthNativeRecord,
): boolean {
  const native = getPlainYearMonthNative(record)
  const otherNative = getPlainYearMonthNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: PlainYearMonthNativeRecord,
  otherRecord: PlainYearMonthNativeRecord,
): NumberSign {
  const native = getPlainYearMonthNative(record)
  const otherNative = getPlainYearMonthNative(otherRecord)
  return Temporal!.PlainYearMonth.compare(native, otherNative)
}

export function toPlainDate(
  record: PlainYearMonthNativeRecord,
  fields: { day: number },
): PlainDateNativeRecord {
  const native = getPlainYearMonthNative(record)
  const resNative = native.toPlainDate(fields)
  return createPlainDateNativeRecord(resNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainYearMonthNative, locales, options)
}

export function toLocaleString(
  record: PlainYearMonthNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainYearMonthNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainYearMonthNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainYearMonthNative(record).toString(options)
}
