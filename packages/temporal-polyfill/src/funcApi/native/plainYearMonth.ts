import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
} from '../../apiHelpers/classStyle'
import { yearMonthFieldGetters } from '../../apiHelpers/nativeMixins'
import { YearMonthFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike, NativeDiffFunc } from '../commonTypes'
import { PlainYearMonthRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import { normalizeRoundToOptions } from '../roundToUtils'
import {
  getPlainYearMonthSlots,
  setPlainYearMonthSlots,
} from '../temporalRecords'
import {
  refineNativeCalendarArgMaybe,
  runNativeCalendarResolver,
} from './calendarResolve'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import {
  NativeDurationRecord,
  createNativeDurationRecord,
  getNativeDuration,
} from './duration'
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'

type Format = DateTimeFormatLike<NativePlainYearMonthRecord>

export const getNativePlainYearMonth: (
  record: unknown,
) => Temporal.PlainYearMonth = getPlainYearMonthSlots

export type NativePlainYearMonthRecord = InstanceType<
  typeof NativePlainYearMonthRecord
> &
  RecordTypes.PlainYearMonthRecord

export const NativePlainYearMonthRecord = defineTemporalClass(
  PlainYearMonthRecordBranding,
  class {
    get calendarId() {
      return getNativePlainYearMonth(this).calendarId
    }

    toJSON() {
      return getNativePlainYearMonth(this).toJSON()
    }

    valueOf(): never {
      return getNativePlainYearMonth(this).valueOf()
    }
  },
  getNativePlainYearMonth,
  yearMonthFieldGetters,
)

export function createNativePlainYearMonthRecord(
  native: Temporal.PlainYearMonth,
): NativePlainYearMonthRecord {
  const instance = Object.create(NativePlainYearMonthRecord.prototype)
  setPlainYearMonthSlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarRecord,
  referenceIsoDay?: number,
): NativePlainYearMonthRecord {
  return createNativePlainYearMonthRecord(
    new NativeTemporal!.PlainYearMonth(
      isoYear,
      isoMonth,
      refineNativeCalendarArgMaybe(calendar),
      referenceIsoDay,
    ),
  )
}

export function fromFields(
  fields: Partial<YearMonthFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const calendar = refineNativeCalendarArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainYearMonth.from(
    { ...fields, calendar },
    options,
  )
  return createNativePlainYearMonthRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): NativePlainYearMonthRecord {
  const resNative = NativeTemporal!.PlainYearMonth.from(s)
  runNativeCalendarResolver(resNative.calendarId, getCalendarRecord)
  return createNativePlainYearMonthRecord(resNative)
}

export function daysInMonth(record: NativePlainYearMonthRecord): number {
  return getNativePlainYearMonth(record).daysInMonth
}

export function daysInYear(record: NativePlainYearMonthRecord): number {
  return getNativePlainYearMonth(record).daysInYear
}

export function monthsInYear(record: NativePlainYearMonthRecord): number {
  return getNativePlainYearMonth(record).monthsInYear
}

export function inLeapYear(record: NativePlainYearMonthRecord): boolean {
  return getNativePlainYearMonth(record).inLeapYear
}

export function withFields(
  record: NativePlainYearMonthRecord,
  mod: Partial<YearMonthFields>,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const native = getNativePlainYearMonth(record)
  const resNative = native.with(mod, options)
  return createNativePlainYearMonthRecord(resNative)
}

export function add(
  record: NativePlainYearMonthRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const native = getNativePlainYearMonth(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.add(durationNative, options)
  return createNativePlainYearMonthRecord(resNative)
}

export function subtract(
  record: NativePlainYearMonthRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const native = getNativePlainYearMonth(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.subtract(durationNative, options)
  return createNativePlainYearMonthRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativePlainYearMonthRecord,
  otherRecord: NativePlainYearMonthRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
): NativeDurationRecord {
  const native = getNativePlainYearMonth(record)
  const otherNative = getNativePlainYearMonth(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

export function equals(
  record: NativePlainYearMonthRecord,
  otherRecord: NativePlainYearMonthRecord,
): boolean {
  const native = getNativePlainYearMonth(record)
  const otherNative = getNativePlainYearMonth(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativePlainYearMonthRecord,
  otherRecord: NativePlainYearMonthRecord,
): NumberSign {
  const native = getNativePlainYearMonth(record)
  const otherNative = getNativePlainYearMonth(otherRecord)
  return NativeTemporal!.PlainYearMonth.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativePlainYearMonth)

export function toLocaleString(
  record: NativePlainYearMonthRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativePlainYearMonth(record).toLocaleString(locales, options)
}

export function toString(
  record: NativePlainYearMonthRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return getNativePlainYearMonth(record).toString(options)
}

export function toBasicString(record: NativePlainYearMonthRecord): string {
  return getNativePlainYearMonth(record).toString()
}

export function toPlainDate(
  record: NativePlainYearMonthRecord,
  fields: { day: number },
): NativePlainDateRecord {
  const native = getNativePlainYearMonth(record)
  const resNative = native.toPlainDate(fields)
  return createNativePlainDateRecord(resNative)
}

// Native PlainYearMonth keeps its reference ISO day in an internal slot.
// Returning the stored native object is the only lossless conversion here.
export const toTemporal: (
  record: NativePlainYearMonthRecord,
) => Temporal.PlainYearMonth = getNativePlainYearMonth

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: NativePlainYearMonthRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const resNative = getNativePlainYearMonth(record).add({ years }, options)
  return createNativePlainYearMonthRecord(resNative)
}

export function addMonths(
  record: NativePlainYearMonthRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const resNative = getNativePlainYearMonth(record).add({ months }, options)
  return createNativePlainYearMonthRecord(resNative)
}

export function subtractYears(
  record: NativePlainYearMonthRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const resNative = getNativePlainYearMonth(record).subtract({ years }, options)
  return createNativePlainYearMonthRecord(resNative)
}

export function subtractMonths(
  record: NativePlainYearMonthRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainYearMonthRecord {
  const resNative = getNativePlainYearMonth(record).subtract(
    { months },
    options,
  )
  return createNativePlainYearMonthRecord(resNative)
}

// Non-standard: Round
// -----------------------------------------------------------------------------

export function roundToYear(
  record: NativePlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainYearMonthRecord {
  return createNativePlainYearMonthRecord(
    TemporalUtils.roundToYear(
      getNativePlainYearMonth(record),
      normalizeRoundToOptions(options),
    ),
  )
}

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export function startOfYear(
  record: NativePlainYearMonthRecord,
): NativePlainYearMonthRecord {
  return createNativePlainYearMonthRecord(
    TemporalUtils.startOfYear(getNativePlainYearMonth(record)),
  )
}

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export function endOfYear(
  record: NativePlainYearMonthRecord,
): NativePlainYearMonthRecord {
  return createNativePlainYearMonthRecord(
    TemporalUtils.endOfYear(getNativePlainYearMonth(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: NativePlainYearMonthRecord,
  record1: NativePlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffYears as NativeDiffFunc<Temporal.PlainYearMonth>)(
    getNativePlainYearMonth(record0),
    getNativePlainYearMonth(record1),
    options,
  )
}

export function diffMonths(
  record0: NativePlainYearMonthRecord,
  record1: NativePlainYearMonthRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMonths as NativeDiffFunc<Temporal.PlainYearMonth>)(
    getNativePlainYearMonth(record0),
    getNativePlainYearMonth(record1),
    options,
  )
}
