import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  attachDebugString,
  defineTemporalClass,
} from '../../apiHelpers/classStyle'
import { dateFieldGetters, timeGetters } from '../../apiHelpers/nativeMixins'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign, bindArgs } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { DateTimeFormatLike, NativeDiffFunc } from '../commonTypes'
import { PlainDateTimeRecordBranding } from '../recordBranding'
import type * as RecordTypes from '../recordTypes'
import { normalizeRoundToOptions } from '../roundToUtils'
import {
  getPlainDateTimeSlots,
  setPlainDateTimeSlots,
} from '../temporalRecords'
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
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'
import {
  NativePlainTimeRecord,
  createNativePlainTimeRecord,
  getNativePlainTime,
} from './plainTime'
import { createRoundToOptions } from './roundUtils'
import {
  NativeZonedDateTimeRecord,
  createNativeZonedDateTimeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<NativePlainDateTimeRecord>

export const getNativePlainDateTime: (
  record: unknown,
) => Temporal.PlainDateTime = getPlainDateTimeSlots

export type NativePlainDateTimeRecord = InstanceType<
  typeof NativePlainDateTimeRecord
> &
  RecordTypes.PlainDateTimeRecord
export const NativePlainDateTimeRecord = defineTemporalClass(
  PlainDateTimeRecordBranding,
  class {
    get calendarId() {
      return getNativePlainDateTime(this).calendarId
    }

    toJSON() {
      return getNativePlainDateTime(this).toJSON()
    }

    valueOf(): never {
      return getNativePlainDateTime(this).valueOf()
    }
  },
  getNativePlainDateTime,
  dateFieldGetters,
  timeGetters,
)

export function createNativePlainDateTimeRecord(
  native: Temporal.PlainDateTime,
): NativePlainDateTimeRecord {
  const instance = Object.create(NativePlainDateTimeRecord.prototype)
  setPlainDateTimeSlots(instance, native)
  attachDebugString(instance)
  return instance
}

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
  calendar?: CalendarRecord,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    new NativeTemporal!.PlainDateTime(
      isoYear,
      isoMonth,
      isoDay,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      refineNativeCalendarArgMaybe(calendar),
    ),
  )
}

export function fromFields(
  fields: Partial<DateTimeFields & { calendar: CalendarRecord }>,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const calendar = refineNativeCalendarArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.PlainDateTime.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createNativePlainDateTimeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
): NativePlainDateTimeRecord {
  const resNative = NativeTemporal!.PlainDateTime.from(s)
  runNativeCalendarResolver(resNative.calendarId, getCalendarRecord)
  return createNativePlainDateTimeRecord(resNative)
}

export function withCalendar(
  record: NativePlainDateTimeRecord,
  calendarRecord: CalendarRecord,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const calendarId = getValidatedCalendarId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createNativePlainDateTimeRecord(resNative)
}

export function withFields(
  record: NativePlainDateTimeRecord,
  mod: Partial<DateTimeFields>,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const resNative = native.with(mod, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function withPlainTime(
  record: NativePlainDateTimeRecord,
  plainTimeRecord?: NativePlainTimeRecord,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getNativePlainTime(plainTimeRecord)
  const resNative = native.withPlainTime(plainTimeNative)
  return createNativePlainDateTimeRecord(resNative)
}

export function dayOfWeek(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).dayOfWeek
}

export function daysInWeek(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).daysInWeek
}

export function weekOfYear(
  record: NativePlainDateTimeRecord,
): number | undefined {
  return getNativePlainDateTime(record).weekOfYear
}

export function yearOfWeek(
  record: NativePlainDateTimeRecord,
): number | undefined {
  return getNativePlainDateTime(record).yearOfWeek
}

export function dayOfYear(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).dayOfYear
}

export function daysInMonth(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).daysInMonth
}

export function daysInYear(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).daysInYear
}

export function monthsInYear(record: NativePlainDateTimeRecord): number {
  return getNativePlainDateTime(record).monthsInYear
}

export function inLeapYear(record: NativePlainDateTimeRecord): boolean {
  return getNativePlainDateTime(record).inLeapYear
}

export function add(
  record: NativePlainDateTimeRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.add(durationNative, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function subtract(
  record: NativePlainDateTimeRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.subtract(durationNative, options)
  return createNativePlainDateTimeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativePlainDateTimeRecord,
  otherRecord: NativePlainDateTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): NativeDurationRecord {
  const native = getNativePlainDateTime(record)
  const otherNative = getNativePlainDateTime(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

function round(
  record: NativePlainDateTimeRecord,
  options: Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
): NativePlainDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const resNative = native.round(options)
  return createNativePlainDateTimeRecord(resNative)
}

export function equals(
  record: NativePlainDateTimeRecord,
  otherRecord: NativePlainDateTimeRecord,
): boolean {
  const native = getNativePlainDateTime(record)
  const otherNative = getNativePlainDateTime(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativePlainDateTimeRecord,
  otherRecord: NativePlainDateTimeRecord,
): NumberSign {
  const native = getNativePlainDateTime(record)
  const otherNative = getNativePlainDateTime(otherRecord)
  return NativeTemporal!.PlainDateTime.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
}

export function toZonedDateTime(
  record: NativePlainDateTimeRecord,
  timeZoneId: string,
  options?: Temporal.DisambiguationOptions,
): NativeZonedDateTimeRecord {
  const native = getNativePlainDateTime(record)
  const resNative = native.toZonedDateTime(timeZoneId, options)
  return createNativeZonedDateTimeRecord(resNative)
}

export function toPlainDate(
  record: NativePlainDateTimeRecord,
): NativePlainDateRecord {
  const resNative = getNativePlainDateTime(record).toPlainDate()
  return createNativePlainDateRecord(resNative)
}

export function toPlainTime(
  record: NativePlainDateTimeRecord,
): NativePlainTimeRecord {
  const resNative = getNativePlainDateTime(record).toPlainTime()
  return createNativePlainTimeRecord(resNative)
}

export const createFormat: (
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
) => Format = createNativeDateTimeFormatFactory(getNativePlainDateTime)

export function toLocaleString(
  record: NativePlainDateTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativePlainDateTime(record).toLocaleString(locales, options)
}

export function toString(
  record: NativePlainDateTimeRecord,
  options?: Temporal.PlainDateTimeToStringOptions,
): string {
  return getNativePlainDateTime(record).toString(options)
}

export function toBasicString(record: NativePlainDateTimeRecord): string {
  return getNativePlainDateTime(record).toString()
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: NativePlainDateTimeRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.withDayOfYear(
      getNativePlainDateTime(record),
      dayOfYear,
      options,
    ),
  )
}

export function withDayOfMonth(
  record: NativePlainDateTimeRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).with(
    { day: dayOfMonth },
    options,
  )
  return createNativePlainDateTimeRecord(resNative)
}

export function withDayOfWeek(
  record: NativePlainDateTimeRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.withDayOfWeek(
      getNativePlainDateTime(record),
      dayOfWeek,
      options,
    ),
  )
}

export function withWeekOfYear(
  record: NativePlainDateTimeRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.withWeekOfYear(
      getNativePlainDateTime(record),
      weekOfYear,
      options,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: NativePlainDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ years }, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function addMonths(
  record: NativePlainDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ months }, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function addWeeks(
  record: NativePlainDateTimeRecord,
  weeks: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ weeks })
  return createNativePlainDateTimeRecord(resNative)
}

export function addDays(
  record: NativePlainDateTimeRecord,
  days: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ days })
  return createNativePlainDateTimeRecord(resNative)
}

export function addHours(
  record: NativePlainDateTimeRecord,
  hours: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ hours })
  return createNativePlainDateTimeRecord(resNative)
}

export function addMinutes(
  record: NativePlainDateTimeRecord,
  minutes: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ minutes })
  return createNativePlainDateTimeRecord(resNative)
}

export function addSeconds(
  record: NativePlainDateTimeRecord,
  seconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ seconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function addMilliseconds(
  record: NativePlainDateTimeRecord,
  milliseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ milliseconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function addMicroseconds(
  record: NativePlainDateTimeRecord,
  microseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ microseconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function addNanoseconds(
  record: NativePlainDateTimeRecord,
  nanoseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).add({ nanoseconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractYears(
  record: NativePlainDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ years }, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractMonths(
  record: NativePlainDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ months }, options)
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractWeeks(
  record: NativePlainDateTimeRecord,
  weeks: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ weeks })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractDays(
  record: NativePlainDateTimeRecord,
  days: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ days })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractHours(
  record: NativePlainDateTimeRecord,
  hours: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ hours })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractMinutes(
  record: NativePlainDateTimeRecord,
  minutes: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ minutes })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractSeconds(
  record: NativePlainDateTimeRecord,
  seconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ seconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractMilliseconds(
  record: NativePlainDateTimeRecord,
  milliseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ milliseconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractMicroseconds(
  record: NativePlainDateTimeRecord,
  microseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ microseconds })
  return createNativePlainDateTimeRecord(resNative)
}

export function subtractNanoseconds(
  record: NativePlainDateTimeRecord,
  nanoseconds: number,
): NativePlainDateTimeRecord {
  const resNative = getNativePlainDateTime(record).subtract({ nanoseconds })
  return createNativePlainDateTimeRecord(resNative)
}

// Non-standard: Round / Start / End
// -----------------------------------------------------------------------------

export function roundToYear(
  record: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.roundToYear(
      getNativePlainDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}

export function roundToMonth(
  record: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.roundToMonth(
      getNativePlainDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}

export function roundToWeek(
  record: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateTimeRecord {
  return createNativePlainDateTimeRecord(
    TemporalUtils.roundToWeek(
      getNativePlainDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}

function roundToDayTimeUnit(
  smallestUnit: Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>,
  record: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativePlainDateTimeRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

export const roundToDay = bindArgs(roundToDayTimeUnit, 'day')
export const roundToHour = bindArgs(roundToDayTimeUnit, 'hour')
export const roundToMinute = bindArgs(roundToDayTimeUnit, 'minute')
export const roundToSecond = bindArgs(roundToDayTimeUnit, 'second')
export const roundToMillisecond = bindArgs(roundToDayTimeUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToDayTimeUnit, 'microsecond')

export function startOfYear(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfYear(getNativePlainDateTime(record)),
  )
}
export function startOfMonth(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfMonth(getNativePlainDateTime(record)),
  )
}
export function startOfWeek(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfWeek(getNativePlainDateTime(record)),
  )
}
export function startOfDay(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfDay(getNativePlainDateTime(record)),
  )
}
export function startOfHour(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfHour(getNativePlainDateTime(record)),
  )
}
export function startOfMinute(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfMinute(getNativePlainDateTime(record)),
  )
}
export function startOfSecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfSecond(getNativePlainDateTime(record)),
  )
}
export function startOfMillisecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfMillisecond(getNativePlainDateTime(record)),
  )
}
export function startOfMicrosecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.startOfMicrosecond(getNativePlainDateTime(record)),
  )
}

export function endOfYear(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfYear(getNativePlainDateTime(record)),
  )
}
export function endOfMonth(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfMonth(getNativePlainDateTime(record)),
  )
}
export function endOfWeek(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfWeek(getNativePlainDateTime(record)),
  )
}
export function endOfDay(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfDay(getNativePlainDateTime(record)),
  )
}
export function endOfHour(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfHour(getNativePlainDateTime(record)),
  )
}
export function endOfMinute(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfMinute(getNativePlainDateTime(record)),
  )
}
export function endOfSecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfSecond(getNativePlainDateTime(record)),
  )
}
export function endOfMillisecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfMillisecond(getNativePlainDateTime(record)),
  )
}
export function endOfMicrosecond(record: NativePlainDateTimeRecord) {
  return createNativePlainDateTimeRecord(
    TemporalUtils.endOfMicrosecond(getNativePlainDateTime(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffYears as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffMonths(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMonths as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffWeeks(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffWeeks as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffDays(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffDays as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffHours(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffHours as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffMinutes(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMinutes as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffSeconds(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffSeconds as NativeDiffFunc<Temporal.PlainDateTime>)(
    getNativePlainDateTime(record0),
    getNativePlainDateTime(record1),
    options,
  )
}
export function diffMilliseconds(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffMilliseconds as NativeDiffFunc<Temporal.PlainDateTime>
  )(getNativePlainDateTime(record0), getNativePlainDateTime(record1), options)
}
export function diffMicroseconds(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffMicroseconds as NativeDiffFunc<Temporal.PlainDateTime>
  )(getNativePlainDateTime(record0), getNativePlainDateTime(record1), options)
}
export function diffNanoseconds(
  record0: NativePlainDateTimeRecord,
  record1: NativePlainDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffNanoseconds as NativeDiffFunc<Temporal.PlainDateTime>
  )(getNativePlainDateTime(record0), getNativePlainDateTime(record1), options)
}
