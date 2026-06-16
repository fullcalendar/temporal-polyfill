import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
} from '../../apiHelpers/classStyle'
import { dateFieldGetters } from '../../apiHelpers/nativeMixins'
import { DateFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import {
  DateTimeFormatLike,
  NativeDiffFunc,
  PlainDateToZonedDateTimeOptions,
} from '../commonTypes'
import { PlainDateRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import { normalizeRoundToOptions } from '../roundToUtils'
import { getPlainDateSlots, setPlainDateSlots } from '../temporalRecords'
import {
  getValidatedCalendarId,
  refineNativeCalendarArgMaybe,
  runNativeCalendarResolver,
} from './calendarResolve'
import { createNativeDateTimeFormatFactory } from './dateTimeFormat'
import {
  NativeDurationRecord,
  createNativeDurationRecord,
  getNativeDuration,
} from './duration'
import {
  NativePlainDateTimeRecord,
  createNativePlainDateTimeRecord,
} from './plainDateTime'
import {
  NativePlainMonthDayRecord,
  createNativePlainMonthDayRecord,
} from './plainMonthDay'
import { NativePlainTimeRecord, getNativePlainTime } from './plainTime'
import {
  NativePlainYearMonthRecord,
  createNativePlainYearMonthRecord,
} from './plainYearMonth'
import {
  NativeZonedDateTimeRecord,
  createNativeZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<NativePlainDateRecord>

export const getNativePlainDate: (record: unknown) => Temporal.PlainDate =
  getPlainDateSlots

export type NativePlainDateRecord = InstanceType<typeof NativePlainDateRecord> &
  RecordTypes.PlainDateRecord

export const NativePlainDateRecord = defineTemporalClass(
  PlainDateRecordBranding,
  class {
    get calendarId() {
      return getNativePlainDate(this).calendarId
    }

    toJSON() {
      return getNativePlainDate(this).toJSON()
    }

    valueOf(): never {
      return getNativePlainDate(this).valueOf()
    }
  },
  getNativePlainDate,
  dateFieldGetters,
)

export function createNativePlainDateRecord(
  native: Temporal.PlainDate,
): NativePlainDateRecord {
  const instance = Object.create(NativePlainDateRecord.prototype)
  setPlainDateSlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    new NativeTemporal!.PlainDate(
      isoYear,
      isoMonth,
      isoDay,
      refineNativeCalendarArgMaybe(calendar),
    ),
  )
}

export function fromFields(
  fields: Partial<DateFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const calendar = refineNativeCalendarArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainDate.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createNativePlainDateRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): NativePlainDateRecord {
  const resNative = NativeTemporal!.PlainDate.from(s)
  runNativeCalendarResolver(resNative.calendarId, getCalendarRecord)
  return createNativePlainDateRecord(resNative)
}

export function getFields(record: NativePlainDateRecord): DateFields {
  const native = getNativePlainDate(record)
  return {
    era: native.era,
    eraYear: native.eraYear,
    year: native.year,
    monthCode: native.monthCode,
    month: native.month,
    day: native.day,
  }
}

export function dayOfWeek(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).dayOfWeek
}

export function daysInWeek(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).daysInWeek
}

export function weekOfYear(record: NativePlainDateRecord): number | undefined {
  return getNativePlainDate(record).weekOfYear
}

export function yearOfWeek(record: NativePlainDateRecord): number | undefined {
  return getNativePlainDate(record).yearOfWeek
}

export function dayOfYear(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).dayOfYear
}

export function daysInMonth(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).daysInMonth
}

export function daysInYear(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).daysInYear
}

export function monthsInYear(record: NativePlainDateRecord): number {
  return getNativePlainDate(record).monthsInYear
}

export function inLeapYear(record: NativePlainDateRecord): boolean {
  return getNativePlainDate(record).inLeapYear
}

export function withFields(
  record: NativePlainDateRecord,
  mod: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const native = getNativePlainDate(record)
  const resNative = native.with(mod, options)
  return createNativePlainDateRecord(resNative)
}

export function withCalendar(
  record: NativePlainDateRecord,
  calendarRecord: CalendarRecord,
): NativePlainDateRecord {
  const native = getNativePlainDate(record)
  const calendarId = getValidatedCalendarId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createNativePlainDateRecord(resNative)
}

export function add(
  record: NativePlainDateRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const native = getNativePlainDate(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.add(durationNative, options)
  return createNativePlainDateRecord(resNative)
}

export function subtract(
  record: NativePlainDateRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const native = getNativePlainDate(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.subtract(durationNative, options)
  return createNativePlainDateRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativePlainDateRecord,
  otherRecord: NativePlainDateRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>,
): NativeDurationRecord {
  const native = getNativePlainDate(record)
  const otherNative = getNativePlainDate(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

export function equals(
  record: NativePlainDateRecord,
  otherRecord: NativePlainDateRecord,
): boolean {
  const native = getNativePlainDate(record)
  const otherNative = getNativePlainDate(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativePlainDateRecord,
  otherRecord: NativePlainDateRecord,
): NumberSign {
  const native = getNativePlainDate(record)
  const otherNative = getNativePlainDate(otherRecord)
  return NativeTemporal!.PlainDate.compare(native, otherNative) as NumberSign // !!!
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativePlainDate)

export function toLocaleString(
  record: NativePlainDateRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativePlainDate(record).toLocaleString(locales, options)
}

export function toString(
  record: NativePlainDateRecord,
  options?: Temporal.PlainDateToStringOptions,
): string {
  return getNativePlainDate(record).toString(options)
}

export function toBasicString(record: NativePlainDateRecord): string {
  return getNativePlainDate(record).toString()
}

export function toZonedDateTime(
  record: NativePlainDateRecord,
  options: string | PlainDateToZonedDateTimeOptions<NativePlainTimeRecord>,
): NativeZonedDateTimeRecord {
  const native = getNativePlainDate(record)
  const optionsObj =
    typeof options === 'string'
      ? { timeZone: options }
      : {
          ...options,
          plainTime:
            options.plainTime === undefined
              ? undefined
              : getNativePlainTime(options.plainTime),
        }
  const resNative = native.toZonedDateTime(optionsObj)
  return createNativeZonedDateTimeRecord(resNative)
}

export function toPlainDateTime(
  record: NativePlainDateRecord,
  plainTimeRecord?: NativePlainTimeRecord,
): NativePlainDateTimeRecord {
  const native = getNativePlainDate(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getNativePlainTime(plainTimeRecord)
  const resNative = native.toPlainDateTime(plainTimeNative)
  return createNativePlainDateTimeRecord(resNative)
}

export function toPlainYearMonth(
  record: NativePlainDateRecord,
): NativePlainYearMonthRecord {
  const resNative = getNativePlainDate(record).toPlainYearMonth()
  return createNativePlainYearMonthRecord(resNative)
}

export function toPlainMonthDay(
  record: NativePlainDateRecord,
): NativePlainMonthDayRecord {
  const resNative = getNativePlainDate(record).toPlainMonthDay()
  return createNativePlainMonthDayRecord(resNative)
}

export const toTemporal: (record: NativePlainDateRecord) => Temporal.PlainDate =
  getNativePlainDate

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: NativePlainDateRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = TemporalUtils.withDayOfYear(
    getNativePlainDate(record),
    dayOfYear,
    options,
  )
  return createNativePlainDateRecord(resNative)
}

export function withDayOfMonth(
  record: NativePlainDateRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).with(
    { day: dayOfMonth },
    options,
  )
  return createNativePlainDateRecord(resNative)
}

export function withDayOfWeek(
  record: NativePlainDateRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = TemporalUtils.withDayOfWeek(
    getNativePlainDate(record),
    dayOfWeek,
    options,
  )
  return createNativePlainDateRecord(resNative)
}

export function withWeekOfYear(
  record: NativePlainDateRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = TemporalUtils.withWeekOfYear(
    getNativePlainDate(record),
    weekOfYear,
    options,
  )
  return createNativePlainDateRecord(resNative)
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: NativePlainDateRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).add({ years }, options)
  return createNativePlainDateRecord(resNative)
}

export function addMonths(
  record: NativePlainDateRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).add({ months }, options)
  return createNativePlainDateRecord(resNative)
}

export function addWeeks(
  record: NativePlainDateRecord,
  weeks: number,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).add({ weeks })
  return createNativePlainDateRecord(resNative)
}

export function addDays(
  record: NativePlainDateRecord,
  days: number,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).add({ days })
  return createNativePlainDateRecord(resNative)
}

export function subtractYears(
  record: NativePlainDateRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).subtract({ years }, options)
  return createNativePlainDateRecord(resNative)
}

export function subtractMonths(
  record: NativePlainDateRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).subtract({ months }, options)
  return createNativePlainDateRecord(resNative)
}

export function subtractWeeks(
  record: NativePlainDateRecord,
  weeks: number,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).subtract({ weeks })
  return createNativePlainDateRecord(resNative)
}

export function subtractDays(
  record: NativePlainDateRecord,
  days: number,
): NativePlainDateRecord {
  const resNative = getNativePlainDate(record).subtract({ days })
  return createNativePlainDateRecord(resNative)
}

// Non-standard: Round
// -----------------------------------------------------------------------------

export function roundToYear(
  record: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.roundToYear(
      getNativePlainDate(record),
      normalizeRoundToOptions(options),
    ),
  )
}

export function roundToMonth(
  record: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.roundToMonth(
      getNativePlainDate(record),
      normalizeRoundToOptions(options),
    ),
  )
}

export function roundToWeek(
  record: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.roundToWeek(
      getNativePlainDate(record),
      normalizeRoundToOptions(options),
    ),
  )
}

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export function startOfYear(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.startOfYear(getNativePlainDate(record)),
  )
}

export function startOfMonth(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.startOfMonth(getNativePlainDate(record)),
  )
}

export function startOfWeek(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.startOfWeek(getNativePlainDate(record)),
  )
}

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export function endOfYear(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.endOfYear(getNativePlainDate(record)),
  )
}

export function endOfMonth(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.endOfMonth(getNativePlainDate(record)),
  )
}

export function endOfWeek(
  record: NativePlainDateRecord,
): NativePlainDateRecord {
  return createNativePlainDateRecord(
    TemporalUtils.endOfWeek(getNativePlainDate(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: NativePlainDateRecord,
  record1: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffYears as NativeDiffFunc<Temporal.PlainDate>)(
    getNativePlainDate(record0),
    getNativePlainDate(record1),
    options,
  )
}

export function diffMonths(
  record0: NativePlainDateRecord,
  record1: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMonths as NativeDiffFunc<Temporal.PlainDate>)(
    getNativePlainDate(record0),
    getNativePlainDate(record1),
    options,
  )
}

export function diffWeeks(
  record0: NativePlainDateRecord,
  record1: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffWeeks as NativeDiffFunc<Temporal.PlainDate>)(
    getNativePlainDate(record0),
    getNativePlainDate(record1),
    options,
  )
}

export function diffDays(
  record0: NativePlainDateRecord,
  record1: NativePlainDateRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffDays as NativeDiffFunc<Temporal.PlainDate>)(
    getNativePlainDate(record0),
    getNativePlainDate(record1),
    options,
  )
}
