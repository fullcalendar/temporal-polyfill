import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { YearMonthFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike, NativeDiffFunc } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { normalizeRoundToOptions } from '../roundToUtils'
import {
  getPlainYearMonthSlots,
  setPlainYearMonthSlots,
} from '../temporalRecords'
import {
  refineCalendarNativeArgMaybe,
  runCalendarNativeResolver,
} from './calendarResolve'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'

type PlainYearMonthRecord = RecordTypes.PlainYearMonthRecord

type Format = DateTimeFormatLike<PlainYearMonthNativeRecord>

export const getPlainYearMonthNative: (
  record: unknown,
) => Temporal.PlainYearMonth = getPlainYearMonthSlots

class _PlainYearMonthNativeRecord
  implements YearMonthFields, PlainYearMonthRecord
{
  declare readonly [RecordTypes.PlainYearMonthRecordBrand]: undefined

  get calendarId() {
    return getPlainYearMonthNative(this).calendarId
  }

  get era() {
    return getPlainYearMonthNative(this).era
  }

  get eraYear() {
    return getPlainYearMonthNative(this).eraYear
  }

  get year() {
    return getPlainYearMonthNative(this).year
  }

  get monthCode() {
    return getPlainYearMonthNative(this).monthCode
  }

  get month() {
    return getPlainYearMonthNative(this).month
  }

  toJSON() {
    return getPlainYearMonthNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

export function createPlainYearMonthNativeRecord(
  native: Temporal.PlainYearMonth,
): PlainYearMonthNativeRecord {
  const instance = Object.create(PlainYearMonthNativeRecord.prototype)
  setPlainYearMonthSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
  return instance
}

export type PlainYearMonthNativeRecord = _PlainYearMonthNativeRecord
export const PlainYearMonthNativeRecord = defineTemporalClass(
  _PlainYearMonthNativeRecord,
  'PlainYearMonth',
)

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: CalendarRecord,
  referenceIsoDay?: number,
): PlainYearMonthNativeRecord {
  return createPlainYearMonthNativeRecord(
    new NativeTemporal!.PlainYearMonth(
      isoYear,
      isoMonth,
      refineCalendarNativeArgMaybe(calendar),
      referenceIsoDay,
    ),
  )
}

export function fromFields(
  fields: Partial<YearMonthFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const calendar = refineCalendarNativeArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainYearMonth.from(
    { ...fields, calendar },
    options,
  )
  return createPlainYearMonthNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): PlainYearMonthNativeRecord {
  const resNative = NativeTemporal!.PlainYearMonth.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendarRecord)
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
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const resNative = native.with(mod, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function add(
  record: PlainYearMonthNativeRecord,
  duration: DurationNativeRecord,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function addYears(
  record: PlainYearMonthNativeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const resNative = getPlainYearMonthNative(record).add({ years }, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function addMonths(
  record: PlainYearMonthNativeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const resNative = getPlainYearMonthNative(record).add({ months }, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function subtract(
  record: PlainYearMonthNativeRecord,
  duration: DurationNativeRecord,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const native = getPlainYearMonthNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function subtractYears(
  record: PlainYearMonthNativeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const resNative = getPlainYearMonthNative(record).subtract({ years }, options)
  return createPlainYearMonthNativeRecord(resNative)
}

export function subtractMonths(
  record: PlainYearMonthNativeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): PlainYearMonthNativeRecord {
  const resNative = getPlainYearMonthNative(record).subtract(
    { months },
    options,
  )
  return createPlainYearMonthNativeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainYearMonthNativeRecord,
  otherRecord: PlainYearMonthNativeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
): DurationNativeRecord {
  const native = getPlainYearMonthNative(record)
  const otherNative = getPlainYearMonthNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function diffYears(
  record0: PlainYearMonthNativeRecord,
  record1: PlainYearMonthNativeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffYears as NativeDiffFunc<Temporal.PlainYearMonth>)(
    getPlainYearMonthNative(record0),
    getPlainYearMonthNative(record1),
    options,
  )
}

export function diffMonths(
  record0: PlainYearMonthNativeRecord,
  record1: PlainYearMonthNativeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMonths as NativeDiffFunc<Temporal.PlainYearMonth>)(
    getPlainYearMonthNative(record0),
    getPlainYearMonthNative(record1),
    options,
  )
}

export function roundToYear(
  record: PlainYearMonthNativeRecord,
  options?: RoundingMathOptions | RoundingMode,
): PlainYearMonthNativeRecord {
  return createPlainYearMonthNativeRecord(
    TemporalUtils.roundToYear(
      getPlainYearMonthNative(record),
      normalizeRoundToOptions(options),
    ),
  )
}

export function startOfYear(
  record: PlainYearMonthNativeRecord,
): PlainYearMonthNativeRecord {
  return createPlainYearMonthNativeRecord(
    TemporalUtils.startOfYear(getPlainYearMonthNative(record)),
  )
}

export function endOfYear(
  record: PlainYearMonthNativeRecord,
): PlainYearMonthNativeRecord {
  return createPlainYearMonthNativeRecord(
    TemporalUtils.endOfYear(getPlainYearMonthNative(record)),
  )
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
  return NativeTemporal!.PlainYearMonth.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
}

export function toPlainDate(
  record: PlainYearMonthNativeRecord,
  fields: { day: number },
): PlainDateNativeRecord {
  const native = getPlainYearMonthNative(record)
  const resNative = native.toPlainDate(fields)
  return createPlainDateNativeRecord(resNative)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getPlainYearMonthNative)

export function toLocaleString(
  record: PlainYearMonthNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainYearMonthNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainYearMonthNativeRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return getPlainYearMonthNative(record).toString(options)
}

export function toBasicString(record: PlainYearMonthNativeRecord): string {
  return getPlainYearMonthNative(record).toString()
}
