import { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
} from '../../internal/optionsModel'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainDateTimeSlots,
  setPlainDateTimeSlots,
} from '../temporalRecords'
import {
  CalendarNativeRecord,
  CalendarNativeResolver,
  getCalendarNativeRecordId,
  runCalendarNativeResolver,
} from './calendar'
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
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
} from './recordUtils'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

type Format = DateTimeFormatLike<PlainDateTimeNativeRecord>

type PlainDateTimeRecord = RecordTypes.PlainDateTimeRecord

export const getPlainDateTimeNative: (
  record: unknown,
) => Temporal.PlainDateTime = getPlainDateTimeSlots

class _PlainDateTimeNativeRecord
  implements DateTimeFields, PlainDateTimeRecord
{
  declare readonly [RecordTypes.PlainDateTimeRecordBrand]: undefined

  constructor(
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
  ) {
    setPlainDateTimeNative(
      this,
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
        calendar === undefined
          ? undefined
          : getCalendarNativeRecordId(calendar),
      ),
    )
  }

  get calendarId() {
    return getPlainDateTimeNative(this).calendarId
  }

  get era() {
    return getPlainDateTimeNative(this).era
  }

  get eraYear() {
    return getPlainDateTimeNative(this).eraYear
  }

  get year() {
    return getPlainDateTimeNative(this).year
  }

  get month() {
    return getPlainDateTimeNative(this).month
  }

  get monthCode() {
    return getPlainDateTimeNative(this).monthCode
  }

  get day() {
    return getPlainDateTimeNative(this).day
  }

  get hour() {
    return getPlainDateTimeNative(this).hour
  }

  get minute() {
    return getPlainDateTimeNative(this).minute
  }

  get second() {
    return getPlainDateTimeNative(this).second
  }

  get millisecond() {
    return getPlainDateTimeNative(this).millisecond
  }

  get microsecond() {
    return getPlainDateTimeNative(this).microsecond
  }

  get nanosecond() {
    return getPlainDateTimeNative(this).nanosecond
  }

  toJSON() {
    return getPlainDateTimeNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainDateTimeNative(
  instance: object,
  native: Temporal.PlainDateTime,
) {
  setPlainDateTimeSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainDateTimeNativeRecord(
  native: Temporal.PlainDateTime,
): PlainDateTimeNativeRecord {
  const instance = Object.create(PlainDateTimeNativeRecord.prototype)
  setPlainDateTimeNative(instance, native)
  return instance
}

export type PlainDateTimeNativeRecord = _PlainDateTimeNativeRecord
export const PlainDateTimeNativeRecord = defineTemporalClass(
  _PlainDateTimeNativeRecord,
  'PlainDateTime',
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
  const resNative = NativeTemporal!.PlainDateTime.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createPlainDateTimeNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendar: CalendarNativeResolver,
): PlainDateTimeNativeRecord {
  const resNative = NativeTemporal!.PlainDateTime.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendar)
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

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainDateTimeNativeRecord,
  otherRecord: PlainDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getPlainDateTimeNative(record)
  const otherNative = getPlainDateTimeNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: PlainDateTimeNativeRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): PlainDateTimeNativeRecord {
  const native = getPlainDateTimeNative(record)
  const resNative = native.round(options as any) // !!!
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
  return NativeTemporal!.PlainDateTime.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
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
  return getPlainDateTimeNative(record).toString(options as any) // !!!
}

export function toSimpleString(record: PlainDateTimeNativeRecord): string {
  return getPlainDateTimeNative(record).toString()
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: PlainDateTimeNativeRecord,
  dayOfYear: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.withDayOfYear(
      getPlainDateTimeNative(record),
      dayOfYear,
      options,
    ),
  )
}

export function withDayOfMonth(
  record: PlainDateTimeNativeRecord,
  dayOfMonth: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).with(
    { day: dayOfMonth },
    options,
  )
  return createPlainDateTimeNativeRecord(resNative)
}

export function withDayOfWeek(
  record: PlainDateTimeNativeRecord,
  dayOfWeek: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.withDayOfWeek(
      getPlainDateTimeNative(record),
      dayOfWeek,
      options,
    ),
  )
}

export function withWeekOfYear(
  record: PlainDateTimeNativeRecord,
  weekOfYear: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.withWeekOfYear(
      getPlainDateTimeNative(record),
      weekOfYear,
      options,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: PlainDateTimeNativeRecord,
  years: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ years }, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function addMonths(
  record: PlainDateTimeNativeRecord,
  months: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ months }, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function addWeeks(
  record: PlainDateTimeNativeRecord,
  weeks: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ weeks })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addDays(
  record: PlainDateTimeNativeRecord,
  days: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ days })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addHours(
  record: PlainDateTimeNativeRecord,
  hours: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ hours })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addMinutes(
  record: PlainDateTimeNativeRecord,
  minutes: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ minutes })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addSeconds(
  record: PlainDateTimeNativeRecord,
  seconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ seconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addMilliseconds(
  record: PlainDateTimeNativeRecord,
  milliseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ milliseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addMicroseconds(
  record: PlainDateTimeNativeRecord,
  microseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ microseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function addNanoseconds(
  record: PlainDateTimeNativeRecord,
  nanoseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).add({ nanoseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractYears(
  record: PlainDateTimeNativeRecord,
  years: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ years }, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractMonths(
  record: PlainDateTimeNativeRecord,
  months: number,
  options?: OverflowOptions,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ months }, options)
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractWeeks(
  record: PlainDateTimeNativeRecord,
  weeks: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ weeks })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractDays(
  record: PlainDateTimeNativeRecord,
  days: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ days })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractHours(
  record: PlainDateTimeNativeRecord,
  hours: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ hours })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractMinutes(
  record: PlainDateTimeNativeRecord,
  minutes: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ minutes })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractSeconds(
  record: PlainDateTimeNativeRecord,
  seconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ seconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractMilliseconds(
  record: PlainDateTimeNativeRecord,
  milliseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ milliseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractMicroseconds(
  record: PlainDateTimeNativeRecord,
  microseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ microseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

export function subtractNanoseconds(
  record: PlainDateTimeNativeRecord,
  nanoseconds: number,
): PlainDateTimeNativeRecord {
  const resNative = getPlainDateTimeNative(record).subtract({ nanoseconds })
  return createPlainDateTimeNativeRecord(resNative)
}

// Non-standard: Round / Start / End
// -----------------------------------------------------------------------------

export function roundToYear(
  record: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.roundToYear(getPlainDateTimeNative(record), options as any),
  )
}

export function roundToMonth(
  record: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.roundToMonth(getPlainDateTimeNative(record), options as any),
  )
}

export function roundToWeek(
  record: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateTimeNativeRecord {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.roundToWeek(getPlainDateTimeNative(record), options as any),
  )
}

export function startOfYear(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfYear(getPlainDateTimeNative(record)),
  )
}
export function startOfMonth(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfMonth(getPlainDateTimeNative(record)),
  )
}
export function startOfWeek(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfWeek(getPlainDateTimeNative(record)),
  )
}
export function startOfDay(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfDay(getPlainDateTimeNative(record)),
  )
}
export function startOfHour(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfHour(getPlainDateTimeNative(record)),
  )
}
export function startOfMinute(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfMinute(getPlainDateTimeNative(record)),
  )
}
export function startOfSecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfSecond(getPlainDateTimeNative(record)),
  )
}
export function startOfMillisecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfMillisecond(getPlainDateTimeNative(record)),
  )
}
export function startOfMicrosecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.startOfMicrosecond(getPlainDateTimeNative(record)),
  )
}

export function endOfYear(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfYear(getPlainDateTimeNative(record)),
  )
}
export function endOfMonth(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfMonth(getPlainDateTimeNative(record)),
  )
}
export function endOfWeek(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfWeek(getPlainDateTimeNative(record)),
  )
}
export function endOfDay(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfDay(getPlainDateTimeNative(record)),
  )
}
export function endOfHour(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfHour(getPlainDateTimeNative(record)),
  )
}
export function endOfMinute(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfMinute(getPlainDateTimeNative(record)),
  )
}
export function endOfSecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfSecond(getPlainDateTimeNative(record)),
  )
}
export function endOfMillisecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfMillisecond(getPlainDateTimeNative(record)),
  )
}
export function endOfMicrosecond(record: PlainDateTimeNativeRecord) {
  return createPlainDateTimeNativeRecord(
    TemporalUtils.endOfMicrosecond(getPlainDateTimeNative(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffYears(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffMonths(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMonths(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffWeeks(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffWeeks(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffDays(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffDays(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffHours(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffHours(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffMinutes(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMinutes(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffSeconds(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffSeconds(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffMilliseconds(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMilliseconds(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffMicroseconds(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMicroseconds(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
export function diffNanoseconds(
  record0: PlainDateTimeNativeRecord,
  record1: PlainDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffNanoseconds(
    getPlainDateTimeNative(record0),
    getPlainDateTimeNative(record1),
    options,
  )
}
