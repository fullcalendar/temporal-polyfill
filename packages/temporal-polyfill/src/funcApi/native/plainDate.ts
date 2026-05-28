import * as TemporalUtils from 'temporal-utils'
import { DateFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
  RoundingMathOptions,
  RoundingModeName,
} from '../../internal/optionsModel'
import { DateUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike, ToZonedDateTimeOptions } from '../commonTypes'
import type * as RecordTypes from '../recordTypes'
import {
  getPlainDateRecordIfPresent,
  setPlainDateRecord,
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
import {
  PlainDateTimeNativeRecord,
  createPlainDateTimeNativeRecord,
} from './plainDateTime'
import {
  PlainMonthDayNativeRecord,
  createPlainMonthDayNativeRecord,
} from './plainMonthDay'
import { PlainTimeNativeRecord, getPlainTimeNative } from './plainTime'
import {
  PlainYearMonthNativeRecord,
  createPlainYearMonthNativeRecord,
} from './plainYearMonth'
import {
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from './recordUtils'
import {
  ZonedDateTimeNativeRecord,
  createZonedDateTimeNativeRecord,
} from './zonedDateTime'

type PlainDateRecord = RecordTypes.PlainDateRecord

type Format = DateTimeFormatLike<PlainDateNativeRecord>

class _PlainDateNativeRecord implements DateFields, PlainDateRecord {
  declare readonly [RecordTypes.PlainDateRecordBrand]: undefined

  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarNativeRecord,
  ) {
    setPlainDateNative(
      this,
      new NativeTemporal!.PlainDate(
        isoYear,
        isoMonth,
        isoDay,
        calendar === undefined
          ? undefined
          : getCalendarNativeRecordId(calendar),
      ),
    )
  }

  get calendarId() {
    return getPlainDateNative(this).calendarId
  }

  get year() {
    return getPlainDateNative(this).year
  }

  get month() {
    return getPlainDateNative(this).month
  }

  get monthCode() {
    return getPlainDateNative(this).monthCode
  }

  get day() {
    return getPlainDateNative(this).day
  }

  toJSON() {
    return getPlainDateNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainDateNative(instance: object, native: any) {
  setPlainDateRecord(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainDateNativeRecord(
  native: any,
): PlainDateNativeRecord {
  const instance = Object.create(PlainDateNativeRecord.prototype)
  setPlainDateNative(instance, native)
  return instance
}

export function getPlainDateNative(record: unknown): any {
  return getPlainDateRecordIfPresent(record) || invalidRecordType()
}

export type PlainDateNativeRecord = _PlainDateNativeRecord
export const PlainDateNativeRecord = defineTemporalClass(
  _PlainDateNativeRecord,
  'PlainDate',
)

export function create(
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarNativeRecord,
): PlainDateNativeRecord {
  return new PlainDateNativeRecord(isoYear, isoMonth, isoDay, calendar)
}

export function fromFields(
  fields: Partial<DateFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = NativeTemporal!.PlainDate.from(
    { ...fields, calendar },
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendar: CalendarNativeResolver,
): PlainDateNativeRecord {
  const resNative = NativeTemporal!.PlainDate.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendar)
  return createPlainDateNativeRecord(resNative)
}

export function getFields(record: PlainDateNativeRecord): DateFields {
  const native = getPlainDateNative(record)
  return {
    era: native.era,
    eraYear: native.eraYear,
    year: native.year,
    monthCode: native.monthCode,
    month: native.month,
    day: native.day,
  }
}

export function dayOfWeek(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).dayOfWeek
}

export function daysInWeek(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInWeek
}

export function weekOfYear(record: PlainDateNativeRecord): number | undefined {
  return getPlainDateNative(record).weekOfYear
}

export function yearOfWeek(record: PlainDateNativeRecord): number | undefined {
  return getPlainDateNative(record).yearOfWeek
}

export function dayOfYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).dayOfYear
}

export function daysInMonth(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInMonth
}

export function daysInYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).daysInYear
}

export function monthsInYear(record: PlainDateNativeRecord): number {
  return getPlainDateNative(record).monthsInYear
}

export function inLeapYear(record: PlainDateNativeRecord): boolean {
  return getPlainDateNative(record).inLeapYear
}

export function withFields(
  record: PlainDateNativeRecord,
  mod: Partial<DateFields>,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const resNative = native.with(mod, options)
  return createPlainDateNativeRecord(resNative)
}

export function withCalendar(
  record: PlainDateNativeRecord,
  calendarRecord: CalendarNativeRecord,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const calendarId = getCalendarNativeRecordId(calendarRecord)
  const resNative = native.withCalendar(calendarId)
  return createPlainDateNativeRecord(resNative)
}

export function add(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.add(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

export function subtract(
  record: PlainDateNativeRecord,
  duration: DurationNativeRecord,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const native = getPlainDateNative(record)
  const durationNative = getDurationNative(duration)
  const resNative = native.subtract(durationNative, options)
  return createPlainDateNativeRecord(resNative)
}

// this is equivalent to Temporal's `until`
export function diff(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
  options?: DiffOptions<DateUnitName>,
): DurationNativeRecord {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  const resNative = native.until(otherNative, options)
  return createDurationNativeRecord(resNative)
}

export function equals(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
): boolean {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  return native.equals(otherNative)
}

export function compare(
  record: PlainDateNativeRecord,
  otherRecord: PlainDateNativeRecord,
): NumberSign {
  const native = getPlainDateNative(record)
  const otherNative = getPlainDateNative(otherRecord)
  return NativeTemporal!.PlainDate.compare(native, otherNative)
}

export function toZonedDateTime(
  record: PlainDateNativeRecord,
  options: string | ToZonedDateTimeOptions<PlainTimeNativeRecord>,
): ZonedDateTimeNativeRecord {
  const native = getPlainDateNative(record)
  const optionsObj =
    typeof options === 'string'
      ? { timeZone: options }
      : {
          ...options,
          plainTime:
            options.plainTime === undefined
              ? undefined
              : getPlainTimeNative(options.plainTime),
        }
  const resNative = native.toZonedDateTime(optionsObj)
  return createZonedDateTimeNativeRecord(resNative)
}

export function toPlainDateTime(
  record: PlainDateNativeRecord,
  plainTimeRecord?: PlainTimeNativeRecord,
): PlainDateTimeNativeRecord {
  const native = getPlainDateNative(record)
  const plainTimeNative =
    plainTimeRecord === undefined
      ? undefined
      : getPlainTimeNative(plainTimeRecord)
  const resNative = native.toPlainDateTime(plainTimeNative)
  return createPlainDateTimeNativeRecord(resNative)
}

export function toPlainYearMonth(
  record: PlainDateNativeRecord,
): PlainYearMonthNativeRecord {
  const resNative = getPlainDateNative(record).toPlainYearMonth()
  return createPlainYearMonthNativeRecord(resNative)
}

export function toPlainMonthDay(
  record: PlainDateNativeRecord,
): PlainMonthDayNativeRecord {
  const resNative = getPlainDateNative(record).toPlainMonthDay()
  return createPlainMonthDayNativeRecord(resNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainDateNative, locales, options)
}

export function toLocaleString(
  record: PlainDateNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainDateNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainDateNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainDateNative(record).toString(options)
}

export function toSimpleString(record: PlainDateNativeRecord): string {
  return getPlainDateNative(record).toString()
}

// Non-standard: With
// -----------------------------------------------------------------------------

export function withDayOfYear(
  record: PlainDateNativeRecord,
  dayOfYear: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = TemporalUtils.withDayOfYear(
    getPlainDateNative(record),
    dayOfYear,
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

export function withDayOfMonth(
  record: PlainDateNativeRecord,
  dayOfMonth: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).with(
    { day: dayOfMonth },
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

export function withDayOfWeek(
  record: PlainDateNativeRecord,
  dayOfWeek: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = TemporalUtils.withDayOfWeek(
    getPlainDateNative(record),
    dayOfWeek,
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

export function withWeekOfYear(
  record: PlainDateNativeRecord,
  weekOfYear: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = TemporalUtils.withWeekOfYear(
    getPlainDateNative(record),
    weekOfYear,
    options,
  )
  return createPlainDateNativeRecord(resNative)
}

// Non-standard: Move
// -----------------------------------------------------------------------------

export function addYears(
  record: PlainDateNativeRecord,
  years: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).add({ years }, options)
  return createPlainDateNativeRecord(resNative)
}

export function addMonths(
  record: PlainDateNativeRecord,
  months: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).add({ months }, options)
  return createPlainDateNativeRecord(resNative)
}

export function addWeeks(
  record: PlainDateNativeRecord,
  weeks: number,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).add({ weeks })
  return createPlainDateNativeRecord(resNative)
}

export function addDays(
  record: PlainDateNativeRecord,
  days: number,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).add({ days })
  return createPlainDateNativeRecord(resNative)
}

export function subtractYears(
  record: PlainDateNativeRecord,
  years: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).subtract({ years }, options)
  return createPlainDateNativeRecord(resNative)
}

export function subtractMonths(
  record: PlainDateNativeRecord,
  months: number,
  options?: OverflowOptions,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).subtract({ months }, options)
  return createPlainDateNativeRecord(resNative)
}

export function subtractWeeks(
  record: PlainDateNativeRecord,
  weeks: number,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).subtract({ weeks })
  return createPlainDateNativeRecord(resNative)
}

export function subtractDays(
  record: PlainDateNativeRecord,
  days: number,
): PlainDateNativeRecord {
  const resNative = getPlainDateNative(record).subtract({ days })
  return createPlainDateNativeRecord(resNative)
}

// Non-standard: Round
// -----------------------------------------------------------------------------

export function roundToYear(
  record: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.roundToYear(getPlainDateNative(record), options as any),
  )
}

export function roundToMonth(
  record: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.roundToMonth(getPlainDateNative(record), options as any),
  )
}

export function roundToWeek(
  record: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.roundToWeek(getPlainDateNative(record), options as any),
  )
}

// Non-standard: Start-of-Unit
// -----------------------------------------------------------------------------

export function startOfYear(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.startOfYear(getPlainDateNative(record)),
  )
}

export function startOfMonth(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.startOfMonth(getPlainDateNative(record)),
  )
}

export function startOfWeek(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.startOfWeek(getPlainDateNative(record)),
  )
}

// Non-standard: End-of-Unit
// -----------------------------------------------------------------------------

export function endOfYear(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.endOfYear(getPlainDateNative(record)),
  )
}

export function endOfMonth(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.endOfMonth(getPlainDateNative(record)),
  )
}

export function endOfWeek(
  record: PlainDateNativeRecord,
): PlainDateNativeRecord {
  return createPlainDateNativeRecord(
    TemporalUtils.endOfWeek(getPlainDateNative(record)),
  )
}

// Non-standard: Diffing
// -----------------------------------------------------------------------------

export function diffYears(
  record0: PlainDateNativeRecord,
  record1: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffYears(
    getPlainDateNative(record0),
    getPlainDateNative(record1),
    options as any,
  )
}

export function diffMonths(
  record0: PlainDateNativeRecord,
  record1: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffMonths(
    getPlainDateNative(record0),
    getPlainDateNative(record1),
    options as any,
  )
}

export function diffWeeks(
  record0: PlainDateNativeRecord,
  record1: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffWeeks(
    getPlainDateNative(record0),
    getPlainDateNative(record1),
    options as any,
  )
}

export function diffDays(
  record0: PlainDateNativeRecord,
  record1: PlainDateNativeRecord,
  options?: RoundingModeName | RoundingMathOptions,
): number {
  return TemporalUtils.diffDays(
    getPlainDateNative(record0),
    getPlainDateNative(record1),
    options as any,
  )
}
