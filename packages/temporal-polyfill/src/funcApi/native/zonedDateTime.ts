import type { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { ZonedDateTimeBranding } from '../../apiHelpers/branding'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import { NumberSign, bindArgs } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { CalendarRecord } from '../calendarRecord'
import { NativeDiffFunc, ZonedDateTimeFields } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import { normalizeRoundToOptions } from '../roundToUtils'
import {
  getZonedDateTimeSlots,
  setZonedDateTimeSlots,
} from '../temporalRecords'
import {
  getValidatedCalendarId,
  refineNativeCalendarArgMaybe,
  runNativeCalendarResolver,
} from './calendarResolve'
import {
  NativeDurationRecord,
  createNativeDurationRecord,
  getNativeDuration,
} from './duration'
import { NativeInstantRecord, createNativeInstantRecord } from './instant'
import { NativePlainDateRecord, createNativePlainDateRecord } from './plainDate'
import {
  NativePlainDateTimeRecord,
  createNativePlainDateTimeRecord,
} from './plainDateTime'
import {
  NativePlainTimeRecord,
  createNativePlainTimeRecord,
  getNativePlainTime,
} from './plainTime'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import { createRoundToOptions } from './roundUtils'

type ZonedDateTimeRecord = RecordTypes.ZonedDateTimeRecord

export const getNativeZonedDateTime: (
  record: unknown,
) => Temporal.ZonedDateTime = getZonedDateTimeSlots

export type NativeZonedDateTimeRecord = InstanceType<
  typeof NativeZonedDateTimeRecord
>
export const NativeZonedDateTimeRecord = defineTemporalClass(
  ZonedDateTimeBranding,
  class implements ZonedDateTimeRecord {
    declare readonly [RecordTypes.ZonedDateTimeRecordBrand]: undefined

    get calendarId() {
      return getNativeZonedDateTime(this).calendarId
    }

    get epochMilliseconds() {
      return getNativeZonedDateTime(this).epochMilliseconds
    }

    get epochNanoseconds() {
      return getNativeZonedDateTime(this).epochNanoseconds
    }

    get timeZoneId() {
      return getNativeZonedDateTime(this).timeZoneId
    }

    get era() {
      return getNativeZonedDateTime(this).era
    }

    get eraYear() {
      return getNativeZonedDateTime(this).eraYear
    }

    get year() {
      return getNativeZonedDateTime(this).year
    }

    get month() {
      return getNativeZonedDateTime(this).month
    }

    get monthCode() {
      return getNativeZonedDateTime(this).monthCode
    }

    get day() {
      return getNativeZonedDateTime(this).day
    }

    get hour() {
      return getNativeZonedDateTime(this).hour
    }

    get minute() {
      return getNativeZonedDateTime(this).minute
    }

    get second() {
      return getNativeZonedDateTime(this).second
    }

    get millisecond() {
      return getNativeZonedDateTime(this).millisecond
    }

    get microsecond() {
      return getNativeZonedDateTime(this).microsecond
    }

    get nanosecond() {
      return getNativeZonedDateTime(this).nanosecond
    }

    toJSON() {
      return getNativeZonedDateTime(this).toString()
    }

    valueOf() {
      return forbiddenValueOf()
    }
  },
)

export function createNativeZonedDateTimeRecord(
  native: Temporal.ZonedDateTime,
): NativeZonedDateTimeRecord {
  const instance = Object.create(NativeZonedDateTimeRecord.prototype)
  setZonedDateTimeSlots(instance, native)
  attachDebugString(instance)
  return instance
}

export function create(
  epochNanoseconds: bigint,
  timeZoneId: string,
  calendar?: CalendarRecord,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    new NativeTemporal!.ZonedDateTime(
      epochNanoseconds,
      timeZoneId,
      refineNativeCalendarArgMaybe(calendar),
    ),
  )
}

export function fromFields(
  fields: ZonedDateTimeFields<CalendarRecord>,
  options?: Temporal.ZonedDateTimeFromOptions,
): NativeZonedDateTimeRecord {
  const calendar = refineNativeCalendarArgMaybe(fields.calendar)
  const resNative = NativeTemporal!.ZonedDateTime.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createNativeZonedDateTimeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendarRecord: (id: string) => CalendarRecord,
  options?: Temporal.ZonedDateTimeFromOptions,
): NativeZonedDateTimeRecord {
  const resNative = NativeTemporal!.ZonedDateTime.from(s, options)
  runNativeCalendarResolver(resNative.calendarId, getCalendarRecord)
  return createNativeZonedDateTimeRecord(resNative)
}

export function withFields(
  record: NativeZonedDateTimeRecord,
  mod: Partial<DateTimeFields>,
  options?: Temporal.ZonedDateTimeFromOptions,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const resNative = native.with(mod, options)
  return createNativeZonedDateTimeRecord(resNative)
}

export function withCalendar(
  record: NativeZonedDateTimeRecord,
  calendarRecord: CalendarRecord,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const calendarId = getValidatedCalendarId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createNativeZonedDateTimeRecord(resNative)
}

export function withTimeZone(
  record: NativeZonedDateTimeRecord,
  timeZoneId: string,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const resNative = native.withTimeZone(timeZoneId)
  return createNativeZonedDateTimeRecord(resNative)
}

export function withPlainTime(
  record: NativeZonedDateTimeRecord,
  plainTimeRecord?: NativePlainTimeRecord,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getNativePlainTime(plainTimeRecord)
  const resNative = native.withPlainTime(plainTimeNative)
  return createNativeZonedDateTimeRecord(resNative)
}

export function offsetNanoseconds(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).offsetNanoseconds
}

export function offset(record: NativeZonedDateTimeRecord): string {
  return getNativeZonedDateTime(record).offset
}

export function dayOfWeek(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).dayOfWeek
}

export function daysInWeek(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).daysInWeek
}

export function weekOfYear(
  record: NativeZonedDateTimeRecord,
): number | undefined {
  return getNativeZonedDateTime(record).weekOfYear
}

export function yearOfWeek(
  record: NativeZonedDateTimeRecord,
): number | undefined {
  return getNativeZonedDateTime(record).yearOfWeek
}

export function dayOfYear(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).dayOfYear
}

export function daysInMonth(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).daysInMonth
}

export function daysInYear(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).daysInYear
}

export function monthsInYear(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).monthsInYear
}

export function inLeapYear(record: NativeZonedDateTimeRecord): boolean {
  return getNativeZonedDateTime(record).inLeapYear
}

export function hoursInDay(record: NativeZonedDateTimeRecord): number {
  return getNativeZonedDateTime(record).hoursInDay
}

export function toString(
  record: NativeZonedDateTimeRecord,
  options?: Temporal.ZonedDateTimeToStringOptions,
): string {
  return getNativeZonedDateTime(record).toString(options)
}

export function toBasicString(record: NativeZonedDateTimeRecord): string {
  return getNativeZonedDateTime(record).toString()
}

export function add(
  record: NativeZonedDateTimeRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.add(durationNative, options)
  return createNativeZonedDateTimeRecord(resNative)
}

export function subtract(
  record: NativeZonedDateTimeRecord,
  duration: NativeDurationRecord,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const durationNative = getNativeDuration(duration)
  const resNative = native.subtract(durationNative, options)
  return createNativeZonedDateTimeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: NativeZonedDateTimeRecord,
  otherRecord: NativeZonedDateTimeRecord,
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): NativeDurationRecord {
  const native = getNativeZonedDateTime(record)
  const otherNative = getNativeZonedDateTime(otherRecord)
  const resNative = native.until(otherNative, options)
  return createNativeDurationRecord(resNative)
}

function round(
  record: NativeZonedDateTimeRecord,
  options: Temporal.RoundingOptions<'day' | Temporal.TimeUnit>,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const resNative = native.round(options)
  return createNativeZonedDateTimeRecord(resNative)
}

export function startOfDay(
  record: NativeZonedDateTimeRecord,
): NativeZonedDateTimeRecord {
  const native = getNativeZonedDateTime(record)
  const resNative = native.startOfDay()
  return createNativeZonedDateTimeRecord(resNative)
}

export function getTimeZoneTransition(
  record: NativeZonedDateTimeRecord,
  options: Temporal.TransitionOptions | Temporal.TransitionOptions['direction'],
): NativeZonedDateTimeRecord | null {
  const native = getNativeZonedDateTime(record)
  const resNative = native.getTimeZoneTransition(
    normalizeTransitionOptions(options),
  )
  return resNative ? createNativeZonedDateTimeRecord(resNative) : null
}

export function equals(
  record: NativeZonedDateTimeRecord,
  otherRecord: NativeZonedDateTimeRecord,
): boolean {
  const native = getNativeZonedDateTime(record)
  const otherNative = getNativeZonedDateTime(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: NativeZonedDateTimeRecord,
  otherRecord: NativeZonedDateTimeRecord,
): NumberSign {
  const native = getNativeZonedDateTime(record)
  const otherNative = getNativeZonedDateTime(otherRecord)
  return NativeTemporal!.ZonedDateTime.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
}

export function toInstant(
  record: NativeZonedDateTimeRecord,
): NativeInstantRecord {
  const resNative = getNativeZonedDateTime(record).toInstant()
  return createNativeInstantRecord(resNative)
}

export function toPlainDateTime(
  record: NativeZonedDateTimeRecord,
): NativePlainDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).toPlainDateTime()
  return createNativePlainDateTimeRecord(resNative)
}

export function toPlainDate(
  record: NativeZonedDateTimeRecord,
): NativePlainDateRecord {
  const resNative = getNativeZonedDateTime(record).toPlainDate()
  return createNativePlainDateRecord(resNative)
}

export function toPlainTime(
  record: NativeZonedDateTimeRecord,
): NativePlainTimeRecord {
  const resNative = getNativeZonedDateTime(record).toPlainTime()
  return createNativePlainTimeRecord(resNative)
}

export function toLocaleString(
  record: NativeZonedDateTimeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getNativeZonedDateTime(record).toLocaleString(locales, options)
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: NativeZonedDateTimeRecord,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.withDayOfYear(
      getNativeZonedDateTime(record),
      dayOfYear,
      options,
    ),
  )
}

export function withDayOfMonth(
  record: NativeZonedDateTimeRecord,
  dayOfMonth: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).with(
    { day: dayOfMonth },
    options,
  )
  return createNativeZonedDateTimeRecord(resNative)
}

export function withDayOfWeek(
  record: NativeZonedDateTimeRecord,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.withDayOfWeek(
      getNativeZonedDateTime(record),
      dayOfWeek,
      options,
    ),
  )
}

export function withWeekOfYear(
  record: NativeZonedDateTimeRecord,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.withWeekOfYear(
      getNativeZonedDateTime(record),
      weekOfYear,
      options,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: NativeZonedDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ years }, options)
  return createNativeZonedDateTimeRecord(resNative)
}
export function addMonths(
  record: NativeZonedDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ months }, options)
  return createNativeZonedDateTimeRecord(resNative)
}
export function addWeeks(
  record: NativeZonedDateTimeRecord,
  weeks: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ weeks })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addDays(
  record: NativeZonedDateTimeRecord,
  days: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ days })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addHours(
  record: NativeZonedDateTimeRecord,
  hours: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ hours })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addMinutes(
  record: NativeZonedDateTimeRecord,
  minutes: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ minutes })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addSeconds(
  record: NativeZonedDateTimeRecord,
  seconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ seconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addMilliseconds(
  record: NativeZonedDateTimeRecord,
  milliseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ milliseconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addMicroseconds(
  record: NativeZonedDateTimeRecord,
  microseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ microseconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function addNanoseconds(
  record: NativeZonedDateTimeRecord,
  nanoseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).add({ nanoseconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractYears(
  record: NativeZonedDateTimeRecord,
  years: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ years }, options)
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractMonths(
  record: NativeZonedDateTimeRecord,
  months: number,
  options?: Temporal.OverflowOptions,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ months }, options)
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractWeeks(
  record: NativeZonedDateTimeRecord,
  weeks: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ weeks })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractDays(
  record: NativeZonedDateTimeRecord,
  days: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ days })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractHours(
  record: NativeZonedDateTimeRecord,
  hours: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ hours })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractMinutes(
  record: NativeZonedDateTimeRecord,
  minutes: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ minutes })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractSeconds(
  record: NativeZonedDateTimeRecord,
  seconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ seconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractMilliseconds(
  record: NativeZonedDateTimeRecord,
  milliseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ milliseconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractMicroseconds(
  record: NativeZonedDateTimeRecord,
  microseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ microseconds })
  return createNativeZonedDateTimeRecord(resNative)
}
export function subtractNanoseconds(
  record: NativeZonedDateTimeRecord,
  nanoseconds: number,
): NativeZonedDateTimeRecord {
  const resNative = getNativeZonedDateTime(record).subtract({ nanoseconds })
  return createNativeZonedDateTimeRecord(resNative)
}

// Non-standard: Round / Start / End
// -----------------------------------------------------------------------------

export function roundToYear(
  record: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.roundToYear(
      getNativeZonedDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}
export function roundToMonth(
  record: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.roundToMonth(
      getNativeZonedDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}
export function roundToWeek(
  record: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativeZonedDateTimeRecord {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.roundToWeek(
      getNativeZonedDateTime(record),
      normalizeRoundToOptions(options),
    ),
  )
}

function roundToDayTimeUnit(
  smallestUnit: Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>,
  record: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): NativeZonedDateTimeRecord {
  return round(record, createRoundToOptions(smallestUnit, options))
}

function normalizeTransitionOptions(
  options: Temporal.TransitionOptions | Temporal.TransitionOptions['direction'],
): Temporal.TransitionOptions {
  if (typeof options !== 'string') {
    return options
  }

  const res: Temporal.TransitionOptions = Object.create(null)
  res.direction = options
  return res
}

export const roundToDay = bindArgs(roundToDayTimeUnit, 'day')
export const roundToHour = bindArgs(roundToDayTimeUnit, 'hour')
export const roundToMinute = bindArgs(roundToDayTimeUnit, 'minute')
export const roundToSecond = bindArgs(roundToDayTimeUnit, 'second')
export const roundToMillisecond = bindArgs(roundToDayTimeUnit, 'millisecond')
export const roundToMicrosecond = bindArgs(roundToDayTimeUnit, 'microsecond')

export function startOfYear(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfYear(getNativeZonedDateTime(record)),
  )
}
export function startOfMonth(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfMonth(getNativeZonedDateTime(record)),
  )
}
export function startOfWeek(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfWeek(getNativeZonedDateTime(record)),
  )
}
export function startOfHour(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfHour(getNativeZonedDateTime(record)),
  )
}
export function startOfMinute(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfMinute(getNativeZonedDateTime(record)),
  )
}
export function startOfSecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfSecond(getNativeZonedDateTime(record)),
  )
}
export function startOfMillisecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfMillisecond(getNativeZonedDateTime(record)),
  )
}
export function startOfMicrosecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.startOfMicrosecond(getNativeZonedDateTime(record)),
  )
}

export function endOfYear(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfYear(getNativeZonedDateTime(record)),
  )
}
export function endOfMonth(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfMonth(getNativeZonedDateTime(record)),
  )
}
export function endOfWeek(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfWeek(getNativeZonedDateTime(record)),
  )
}
export function endOfDay(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfDay(getNativeZonedDateTime(record)),
  )
}
export function endOfHour(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfHour(getNativeZonedDateTime(record)),
  )
}
export function endOfMinute(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfMinute(getNativeZonedDateTime(record)),
  )
}
export function endOfSecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfSecond(getNativeZonedDateTime(record)),
  )
}
export function endOfMillisecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfMillisecond(getNativeZonedDateTime(record)),
  )
}
export function endOfMicrosecond(record: NativeZonedDateTimeRecord) {
  return createNativeZonedDateTimeRecord(
    TemporalUtils.endOfMicrosecond(getNativeZonedDateTime(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffYears as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffMonths(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMonths as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffWeeks(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffWeeks as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffDays(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffDays as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffHours(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffHours as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffMinutes(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffMinutes as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffSeconds(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (TemporalUtils.diffSeconds as NativeDiffFunc<Temporal.ZonedDateTime>)(
    getNativeZonedDateTime(record0),
    getNativeZonedDateTime(record1),
    options,
  )
}
export function diffMilliseconds(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffMilliseconds as NativeDiffFunc<Temporal.ZonedDateTime>
  )(getNativeZonedDateTime(record0), getNativeZonedDateTime(record1), options)
}
export function diffMicroseconds(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffMicroseconds as NativeDiffFunc<Temporal.ZonedDateTime>
  )(getNativeZonedDateTime(record0), getNativeZonedDateTime(record1), options)
}
export function diffNanoseconds(
  record0: NativeZonedDateTimeRecord,
  record1: NativeZonedDateTimeRecord,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return (
    TemporalUtils.diffNanoseconds as NativeDiffFunc<Temporal.ZonedDateTime>
  )(getNativeZonedDateTime(record0), getNativeZonedDateTime(record1), options)
}
