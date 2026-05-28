import { invalidRecordType } from '../apiHelpers/classStyle'
import * as errorMessages from '../internal/errorMessages'

const calendarMap = new WeakMap<object, unknown>()
const instantMap = new WeakMap<object, unknown>()
const zonedDateTimeMap = new WeakMap<object, unknown>()
const plainDateTimeMap = new WeakMap<object, unknown>()
const plainDateMap = new WeakMap<object, unknown>()
const plainTimeMap = new WeakMap<object, unknown>()
const plainYearMonthMap = new WeakMap<object, unknown>()
const plainMonthDayMap = new WeakMap<object, unknown>()
const durationMap = new WeakMap<object, unknown>()

export function setCalendarRecord(instance: object, slots: unknown) {
  calendarMap.set(instance, slots)
}

export function getCalendarRecordIfPresent<S>(record: unknown): S | undefined {
  return calendarMap.get(record as object) as S | undefined
}

export function isCalendarRecord(record: unknown): boolean {
  return calendarMap.has(record as object)
}

export function getCalendarRecord<S>(record: unknown): S {
  if (!isCalendarRecord(record)) {
    return invalidRecordType()
  }
  return getCalendarRecordIfPresent<S>(record) as S
}

export function setInstantRecord(instance: object, slots: unknown) {
  instantMap.set(instance, slots)
}

export function getInstantRecordIfPresent<S>(record: unknown): S | undefined {
  return instantMap.get(record as object) as S | undefined
}

export function getInstantRecord<S>(record: unknown): S {
  return getInstantRecordIfPresent<S>(record) || invalidRecordType()
}

export function setZonedDateTimeRecord(instance: object, slots: unknown) {
  zonedDateTimeMap.set(instance, slots)
}

export function getZonedDateTimeRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return zonedDateTimeMap.get(record as object) as S | undefined
}

export function getZonedDateTimeRecord<S>(record: unknown): S {
  return getZonedDateTimeRecordIfPresent<S>(record) || invalidRecordType()
}

export function setPlainDateTimeRecord(instance: object, slots: unknown) {
  plainDateTimeMap.set(instance, slots)
}

export function getPlainDateTimeRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainDateTimeMap.get(record as object) as S | undefined
}

export function getPlainDateTimeRecord<S>(record: unknown): S {
  return getPlainDateTimeRecordIfPresent<S>(record) || invalidRecordType()
}

export function setPlainDateRecord(instance: object, slots: unknown) {
  plainDateMap.set(instance, slots)
}

export function getPlainDateRecordIfPresent<S>(record: unknown): S | undefined {
  return plainDateMap.get(record as object) as S | undefined
}

export function getPlainDateRecord<S>(record: unknown): S {
  return getPlainDateRecordIfPresent<S>(record) || invalidRecordType()
}

export function setPlainTimeRecord(instance: object, slots: unknown) {
  plainTimeMap.set(instance, slots)
}

export function getPlainTimeRecordIfPresent<S>(record: unknown): S | undefined {
  return plainTimeMap.get(record as object) as S | undefined
}

export function getPlainTimeRecord<S>(record: unknown): S {
  return getPlainTimeRecordIfPresent<S>(record) || invalidRecordType()
}

export function setPlainYearMonthRecord(instance: object, slots: unknown) {
  plainYearMonthMap.set(instance, slots)
}

export function getPlainYearMonthRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainYearMonthMap.get(record as object) as S | undefined
}

export function getPlainYearMonthRecord<S>(record: unknown): S {
  return getPlainYearMonthRecordIfPresent<S>(record) || invalidRecordType()
}

export function setPlainMonthDayRecord(instance: object, slots: unknown) {
  plainMonthDayMap.set(instance, slots)
}

export function getPlainMonthDayRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainMonthDayMap.get(record as object) as S | undefined
}

export function getPlainMonthDayRecord<S>(record: unknown): S {
  return getPlainMonthDayRecordIfPresent<S>(record) || invalidRecordType()
}

export function setDurationRecord(instance: object, slots: unknown) {
  durationMap.set(instance, slots)
}

export function getDurationRecordIfPresent<S>(record: unknown): S | undefined {
  return durationMap.get(record as object) as S | undefined
}

export function getDurationRecord<S>(record: unknown): S {
  return getDurationRecordIfPresent<S>(record) || invalidRecordType()
}

function isTemporalRecord(record: unknown): boolean {
  return (
    calendarMap.has(record as object) ||
    instantMap.has(record as object) ||
    zonedDateTimeMap.has(record as object) ||
    plainDateTimeMap.has(record as object) ||
    plainDateMap.has(record as object) ||
    plainTimeMap.has(record as object) ||
    plainYearMonthMap.has(record as object) ||
    plainMonthDayMap.has(record as object) ||
    durationMap.has(record as object)
  )
}

export function rejectInvalidBag<B>(bag: B): B {
  if (
    isTemporalRecord(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}
