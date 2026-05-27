import { MonthDayFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  CalendarDisplayOptions,
  OverflowOptions,
} from '../../internal/optionsModel'
import { NativeTemporal } from '../../nativeSwitch'
import { DateTimeFormatLike } from '../commonTypes'
import {
  getPlainMonthDayRecordIfPresent,
  setPlainMonthDayRecord,
} from '../temporalRecords'
import {
  CalendarNativeRecord,
  CalendarNativeResolver,
  getCalendarNativeRecordId,
  runCalendarNativeResolver,
} from './calendar'
import { createNativeDateTimeFormat } from './dateTimeFormat'
import { PlainDateNativeRecord, createPlainDateNativeRecord } from './plainDate'
import {
  attachDebugString,
  forbiddenValueOf,
  invalidRecordType,
} from './recordUtils'

type Format = DateTimeFormatLike<PlainMonthDayNativeRecord>

export class PlainMonthDayNativeRecord implements MonthDayFields {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarNativeRecord,
    referenceIsoYear?: number,
  ) {
    setPlainMonthDayNative(
      this,
      new NativeTemporal!.PlainMonthDay(
        isoMonth,
        isoDay,
        calendar === undefined
          ? undefined
          : getCalendarNativeRecordId(calendar),
        referenceIsoYear,
      ),
    )
  }

  get calendarId() {
    return getPlainMonthDayNative(this).calendarId
  }

  get monthCode() {
    return getPlainMonthDayNative(this).monthCode
  }

  get month() {
    return getPlainMonthDayNative(this).month
  }

  get day() {
    return getPlainMonthDayNative(this).day
  }

  toJSON() {
    return getPlainMonthDayNative(this).toString()
  }

  valueOf() {
    return forbiddenValueOf()
  }
}

function setPlainMonthDayNative(instance: object, native: any) {
  setPlainMonthDayRecord(instance, native)
  attachDebugString(instance, native, (slots) => slots.toString())
}

export function createPlainMonthDayNativeRecord(
  native: any,
): PlainMonthDayNativeRecord {
  const instance = Object.create(PlainMonthDayNativeRecord.prototype)
  setPlainMonthDayNative(instance, native)
  return instance
}

export function getPlainMonthDayNative(record: unknown): any {
  return getPlainMonthDayRecordIfPresent(record) || invalidRecordType()
}

// TEMP disabled for size inspection: defineTemporalClass(PlainMonthDayNativeRecord, ...)

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: CalendarNativeRecord,
  referenceIsoYear?: number,
): PlainMonthDayNativeRecord {
  return new PlainMonthDayNativeRecord(
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function isRecord(arg: unknown): arg is PlainMonthDayNativeRecord {
  return !!getPlainMonthDayRecordIfPresent(arg)
}

export function fromFields(
  fields: Partial<MonthDayFields> & { calendar?: CalendarNativeRecord },
  options?: OverflowOptions,
): PlainMonthDayNativeRecord {
  const calendar =
    fields.calendar === undefined
      ? undefined
      : getCalendarNativeRecordId(fields.calendar)
  const resNative = NativeTemporal!.PlainMonthDay.from(
    { ...fields, calendar },
    options,
  )
  return createPlainMonthDayNativeRecord(resNative)
}

export function fromString(
  s: string,
  getCalendar: CalendarNativeResolver,
): PlainMonthDayNativeRecord {
  const resNative = NativeTemporal!.PlainMonthDay.from(s)
  runCalendarNativeResolver(resNative.calendarId, getCalendar)
  return createPlainMonthDayNativeRecord(resNative)
}

export function withFields(
  record: PlainMonthDayNativeRecord,
  mod: Partial<MonthDayFields>,
  options?: OverflowOptions,
): PlainMonthDayNativeRecord {
  const native = getPlainMonthDayNative(record)
  const resNative = native.with(mod, options)
  return createPlainMonthDayNativeRecord(resNative)
}

export function equals(
  record: PlainMonthDayNativeRecord,
  otherRecord: PlainMonthDayNativeRecord,
): boolean {
  const native = getPlainMonthDayNative(record)
  const otherNative = getPlainMonthDayNative(otherRecord)
  return native.equals(otherNative)
}

export function toPlainDate(
  record: PlainMonthDayNativeRecord,
  fields: { era?: string; eraYear?: number; year?: number },
): PlainDateNativeRecord {
  const native = getPlainMonthDayNative(record)
  const resNative = native.toPlainDate(fields)
  return createPlainDateNativeRecord(resNative)
}

export function createFormat(
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Format {
  return createNativeDateTimeFormat(getPlainMonthDayNative, locales, options)
}

export function toLocaleString(
  record: PlainMonthDayNativeRecord,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getPlainMonthDayNative(record).toLocaleString(locales, options)
}

export function toString(
  record: PlainMonthDayNativeRecord,
  options?: CalendarDisplayOptions,
): string {
  return getPlainMonthDayNative(record).toString(options)
}
