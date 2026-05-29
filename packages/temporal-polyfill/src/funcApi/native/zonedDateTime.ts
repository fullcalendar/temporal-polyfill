import { Temporal } from 'temporal-spec'
import * as TemporalUtils from 'temporal-utils'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../../internal/optionsModel'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { ZonedDateTimeFields } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getZonedDateTimeSlots,
  setZonedDateTimeSlots,
} from '../temporalRecords'
import {
  CalendarNativeRecord,
  CalendarNativeResolver,
  getCalendarNativeRecordId,
  runCalendarNativeResolver,
} from './calendar'
import {
  DurationNativeRecord,
  createDurationNativeRecord,
  getDurationNative,
} from './duration'
import { InstantNativeRecord, createInstantNativeRecord } from './instant'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  PlainDateTimeNativeRecord,
  createPlainDateTimeNativeRecord,
} from './plainDateTime'
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

type ZonedDateTimeRecord = RecordTypes.ZonedDateTimeRecord

type ZonedDateTimeNativeFields = ZonedDateTimeFields<CalendarNativeRecord>

export const getZonedDateTimeNative: (
  record: unknown,
) => Temporal.ZonedDateTime = getZonedDateTimeSlots

class _ZonedDateTimeNativeRecord implements ZonedDateTimeRecord {
  declare readonly [RecordTypes.ZonedDateTimeRecordBrand]: undefined

  constructor(
    epochNanoseconds: bigint,
    timeZoneId: string,
    calendar?: CalendarNativeRecord,
  ) {
    setZonedDateTimeNative(
      this,
      new NativeTemporal!.ZonedDateTime(
        epochNanoseconds,
        timeZoneId,
        calendar === undefined
          ? undefined
          : getCalendarNativeRecordId(calendar),
      ),
    )
  }

  get calendarId() {
    return getZonedDateTimeNative(this).calendarId
  }

  get epochMilliseconds() {
    return getZonedDateTimeNative(this).epochMilliseconds
  }

  get epochNanoseconds() {
    return getZonedDateTimeNative(this).epochNanoseconds
  }

  get timeZoneId() {
    return getZonedDateTimeNative(this).timeZoneId
  }

  get era() {
    return getZonedDateTimeNative(this).era
  }

  get eraYear() {
    return getZonedDateTimeNative(this).eraYear
  }

  get year() {
    return getZonedDateTimeNative(this).year
  }

  get month() {
    return getZonedDateTimeNative(this).month
  }

  get monthCode() {
    return getZonedDateTimeNative(this).monthCode
  }

  get day() {
    return getZonedDateTimeNative(this).day
  }

  get hour() {
    return getZonedDateTimeNative(this).hour
  }

  get minute() {
    return getZonedDateTimeNative(this).minute
  }

  get second() {
    return getZonedDateTimeNative(this).second
  }

  get millisecond() {
    return getZonedDateTimeNative(this).millisecond
  }

  get microsecond() {
    return getZonedDateTimeNative(this).microsecond
  }

  get nanosecond() {
    return getZonedDateTimeNative(this).nanosecond
  }

  toJSON() {
    return getZonedDateTimeNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setZonedDateTimeNative(
  instance: object,
  native: Temporal.ZonedDateTime,
) {
  setZonedDateTimeSlots(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createZonedDateTimeNativeRecord(
  native: Temporal.ZonedDateTime,
): ZonedDateTimeNativeRecord {
  const instance = Object.create(ZonedDateTimeNativeRecord.prototype)
  setZonedDateTimeNative(instance, native)
  return instance
}

export type ZonedDateTimeNativeRecord = _ZonedDateTimeNativeRecord
export const ZonedDateTimeNativeRecord = defineTemporalClass(
  _ZonedDateTimeNativeRecord,
  'ZonedDateTime',
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
  const resNative = NativeTemporal!.ZonedDateTime.from(
    { ...fields, calendar } as any, // !!! TODO - day is required
    options,
  )
  return createZonedDateTimeNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendar: CalendarNativeResolver,
  options?: ZonedFieldOptions,
): ZonedDateTimeNativeRecord {
  const resNative = NativeTemporal!.ZonedDateTime.from(s, options)
  runCalendarNativeResolver(resNative.calendarId, getCalendar)
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
  return getZonedDateTimeNative(record).toString(options as any) // !!!
}

export function toSimpleString(record: ZonedDateTimeNativeRecord): string {
  return getZonedDateTimeNative(record).toString()
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

// this is equivalent to Temporal's `until`
export function diff(
  record: ZonedDateTimeNativeRecord,
  otherRecord: ZonedDateTimeNativeRecord,
  options?: DiffOptions<UnitName>,
): DurationNativeRecord {
  const native = getZonedDateTimeNative(record)
  const otherNative = getZonedDateTimeNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function round(
  record: ZonedDateTimeNativeRecord,
  options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
): ZonedDateTimeNativeRecord {
  const native = getZonedDateTimeNative(record)
  const resNative = native.round(options as any) // !!!
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
  const resNative = native.getTimeZoneTransition(options as any) // !!!
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
  return NativeTemporal!.ZonedDateTime.compare(
    native,
    otherNative,
  ) as NumberSign // !!!
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

export function toLocaleString(
  record: ZonedDateTimeNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getZonedDateTimeNative(record).toLocaleString(locales, options)
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: ZonedDateTimeNativeRecord,
  dayOfYear: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.withDayOfYear(
      getZonedDateTimeNative(record),
      dayOfYear,
      options,
    ),
  )
}

export function withDayOfMonth(
  record: ZonedDateTimeNativeRecord,
  dayOfMonth: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).with(
    { day: dayOfMonth },
    options,
  )
  return createZonedDateTimeNativeRecord(resNative)
}

export function withDayOfWeek(
  record: ZonedDateTimeNativeRecord,
  dayOfWeek: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.withDayOfWeek(
      getZonedDateTimeNative(record),
      dayOfWeek,
      options,
    ),
  )
}

export function withWeekOfYear(
  record: ZonedDateTimeNativeRecord,
  weekOfYear: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.withWeekOfYear(
      getZonedDateTimeNative(record),
      weekOfYear,
      options,
    ),
  )
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: ZonedDateTimeNativeRecord,
  years: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ years }, options)
  return createZonedDateTimeNativeRecord(resNative)
}
export function addMonths(
  record: ZonedDateTimeNativeRecord,
  months: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ months }, options)
  return createZonedDateTimeNativeRecord(resNative)
}
export function addWeeks(
  record: ZonedDateTimeNativeRecord,
  weeks: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ weeks })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addDays(
  record: ZonedDateTimeNativeRecord,
  days: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ days })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addHours(
  record: ZonedDateTimeNativeRecord,
  hours: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ hours })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addMinutes(
  record: ZonedDateTimeNativeRecord,
  minutes: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ minutes })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addSeconds(
  record: ZonedDateTimeNativeRecord,
  seconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ seconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addMilliseconds(
  record: ZonedDateTimeNativeRecord,
  milliseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ milliseconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addMicroseconds(
  record: ZonedDateTimeNativeRecord,
  microseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ microseconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function addNanoseconds(
  record: ZonedDateTimeNativeRecord,
  nanoseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).add({ nanoseconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractYears(
  record: ZonedDateTimeNativeRecord,
  years: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ years }, options)
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractMonths(
  record: ZonedDateTimeNativeRecord,
  months: number,
  options?: OverflowOptions,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ months }, options)
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractWeeks(
  record: ZonedDateTimeNativeRecord,
  weeks: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ weeks })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractDays(
  record: ZonedDateTimeNativeRecord,
  days: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ days })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractHours(
  record: ZonedDateTimeNativeRecord,
  hours: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ hours })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractMinutes(
  record: ZonedDateTimeNativeRecord,
  minutes: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ minutes })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractSeconds(
  record: ZonedDateTimeNativeRecord,
  seconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ seconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractMilliseconds(
  record: ZonedDateTimeNativeRecord,
  milliseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ milliseconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractMicroseconds(
  record: ZonedDateTimeNativeRecord,
  microseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ microseconds })
  return createZonedDateTimeNativeRecord(resNative)
}
export function subtractNanoseconds(
  record: ZonedDateTimeNativeRecord,
  nanoseconds: number,
): ZonedDateTimeNativeRecord {
  const resNative = getZonedDateTimeNative(record).subtract({ nanoseconds })
  return createZonedDateTimeNativeRecord(resNative)
}

// Non-standard: Round / Start / End
// -----------------------------------------------------------------------------

export function roundToYear(
  record: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.roundToYear(getZonedDateTimeNative(record), options as any), // !!!
  )
}
export function roundToMonth(
  record: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.roundToMonth(getZonedDateTimeNative(record), options as any), // !!!
  )
}
export function roundToWeek(
  record: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): ZonedDateTimeNativeRecord {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.roundToWeek(getZonedDateTimeNative(record), options as any), // !!!
  )
}

export function startOfYear(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfYear(getZonedDateTimeNative(record)),
  )
}
export function startOfMonth(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfMonth(getZonedDateTimeNative(record)),
  )
}
export function startOfWeek(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfWeek(getZonedDateTimeNative(record)),
  )
}
export function startOfHour(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfHour(getZonedDateTimeNative(record)),
  )
}
export function startOfMinute(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfMinute(getZonedDateTimeNative(record)),
  )
}
export function startOfSecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfSecond(getZonedDateTimeNative(record)),
  )
}
export function startOfMillisecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfMillisecond(getZonedDateTimeNative(record)),
  )
}
export function startOfMicrosecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.startOfMicrosecond(getZonedDateTimeNative(record)),
  )
}

export function endOfYear(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfYear(getZonedDateTimeNative(record)),
  )
}
export function endOfMonth(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfMonth(getZonedDateTimeNative(record)),
  )
}
export function endOfWeek(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfWeek(getZonedDateTimeNative(record)),
  )
}
export function endOfDay(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfDay(getZonedDateTimeNative(record)),
  )
}
export function endOfHour(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfHour(getZonedDateTimeNative(record)),
  )
}
export function endOfMinute(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfMinute(getZonedDateTimeNative(record)),
  )
}
export function endOfSecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfSecond(getZonedDateTimeNative(record)),
  )
}
export function endOfMillisecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfMillisecond(getZonedDateTimeNative(record)),
  )
}
export function endOfMicrosecond(record: ZonedDateTimeNativeRecord) {
  return createZonedDateTimeNativeRecord(
    TemporalUtils.endOfMicrosecond(getZonedDateTimeNative(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffYears(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffMonths(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMonths(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffWeeks(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffWeeks(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffDays(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffDays(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffHours(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffHours(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffMinutes(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMinutes(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffSeconds(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffSeconds(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffMilliseconds(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMilliseconds(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffMicroseconds(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMicroseconds(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
export function diffNanoseconds(
  record0: ZonedDateTimeNativeRecord,
  record1: ZonedDateTimeNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffNanoseconds(
    getZonedDateTimeNative(record0),
    getZonedDateTimeNative(record1),
    options,
  )
}
