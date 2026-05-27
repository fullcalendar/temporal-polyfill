import { YearMonthFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { YearMonthUnitName } from '../../internal/units'
import { NumberSign } from '../../internal/utils'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import {
  getPlainYearMonthRecordIfPresent,
  setPlainYearMonthRecord,
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
  attachDebugString,
  defineTemporalClass,
  forbiddenValueOf,
  invalidRecordType,
} from './recordUtils'

type Format = DateTimeFormatLike<PlainYearMonthNativeRecord>

class _PlainYearMonthNativeRecord implements YearMonthFields {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendar?: CalendarNativeRecord,
    referenceIsoDay?: number,
  ) {
    setPlainYearMonthNative(
      this,
      new NativeTemporal!.PlainYearMonth(
        isoYear,
        isoMonth,
        calendar === undefined
          ? undefined
          : getCalendarNativeRecordId(calendar),
        referenceIsoDay,
      ),
    )
  }

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

  get daysInMonth() {
    return getPlainYearMonthNative(this).daysInMonth
  }

  get daysInYear() {
    return getPlainYearMonthNative(this).daysInYear
  }

  get inLeapYear() {
    return getPlainYearMonthNative(this).inLeapYear
  }

  get monthsInYear() {
    return getPlainYearMonthNative(this).monthsInYear
  }

  toJSON() {
    return getPlainYearMonthNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainYearMonthNative(instance: object, native: any) {
  setPlainYearMonthRecord(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainYearMonthNativeRecord(
  native: any,
): PlainYearMonthNativeRecord {
  const instance = Object.create(PlainYearMonthNativeRecord.prototype)
  setPlainYearMonthNative(instance, native)
  return instance
}

export function getPlainYearMonthNative(record: unknown): any {
  return getPlainYearMonthRecordIfPresent(record) || invalidRecordType()
}

export type PlainYearMonthNativeRecord = _PlainYearMonthNativeRecord
export const PlainYearMonthNativeRecord = defineTemporalClass(
  _PlainYearMonthNativeRecord,
  'PlainYearMonth',
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

export function fromFields(
  fields: Partial<YearMonthFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainYearMonthNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = NativeTemporal!.PlainYearMonth.from(
    { ...fields, calendar },
    options,
  )
  return createPlainYearMonthNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendar: CalendarNativeResolver,
): PlainYearMonthNativeRecord {
  const resNative = NativeTemporal!.PlainYearMonth.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendar)
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
  return NativeTemporal!.PlainYearMonth.compare(native, otherNative)
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

export function toSimpleString(record: PlainYearMonthNativeRecord): string {
  return getPlainYearMonthNative(record).toString()
}
