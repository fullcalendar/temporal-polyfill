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

function getMapRecord<S>(
  map: WeakMap<object, unknown>,
  record: unknown,
): S | undefined {
  return typeof record === 'object' && record !== null
    ? (map.get(record) as S | undefined)
    : undefined
}

function hasMapRecord(map: WeakMap<object, unknown>, record: unknown): boolean {
  return typeof record === 'object' && record !== null && map.has(record)
}

export function setCalendarRecord(instance: object, slots: unknown) {
  calendarMap.set(instance, slots)
}

export function getCalendarRecordIfPresent<S>(record: unknown): S | undefined {
  return getMapRecord(calendarMap, record)
}

export function isCalendarRecord(record: unknown): boolean {
  return hasMapRecord(calendarMap, record)
}

export function setInstantRecord(instance: object, slots: unknown) {
  instantMap.set(instance, slots)
}

export function getInstantRecordIfPresent<S>(record: unknown): S | undefined {
  return getMapRecord(instantMap, record)
}

export function setZonedDateTimeRecord(instance: object, slots: unknown) {
  zonedDateTimeMap.set(instance, slots)
}

export function getZonedDateTimeRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return getMapRecord(zonedDateTimeMap, record)
}

export function setPlainDateTimeRecord(instance: object, slots: unknown) {
  plainDateTimeMap.set(instance, slots)
}

export function getPlainDateTimeRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return getMapRecord(plainDateTimeMap, record)
}

export function setPlainDateRecord(instance: object, slots: unknown) {
  plainDateMap.set(instance, slots)
}

export function getPlainDateRecordIfPresent<S>(record: unknown): S | undefined {
  return getMapRecord(plainDateMap, record)
}

export function setPlainTimeRecord(instance: object, slots: unknown) {
  plainTimeMap.set(instance, slots)
}

export function getPlainTimeRecordIfPresent<S>(record: unknown): S | undefined {
  return getMapRecord(plainTimeMap, record)
}

export function setPlainYearMonthRecord(instance: object, slots: unknown) {
  plainYearMonthMap.set(instance, slots)
}

export function getPlainYearMonthRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return getMapRecord(plainYearMonthMap, record)
}

export function setPlainMonthDayRecord(instance: object, slots: unknown) {
  plainMonthDayMap.set(instance, slots)
}

export function getPlainMonthDayRecordIfPresent<S>(
  record: unknown,
): S | undefined {
  return getMapRecord(plainMonthDayMap, record)
}

export function setDurationRecord(instance: object, slots: unknown) {
  durationMap.set(instance, slots)
}

export function getDurationRecordIfPresent<S>(record: unknown): S | undefined {
  return getMapRecord(durationMap, record)
}

function isTemporalRecord(record: unknown): boolean {
  return (
    hasMapRecord(calendarMap, record) ||
    hasMapRecord(instantMap, record) ||
    hasMapRecord(zonedDateTimeMap, record) ||
    hasMapRecord(plainDateTimeMap, record) ||
    hasMapRecord(plainDateMap, record) ||
    hasMapRecord(plainTimeMap, record) ||
    hasMapRecord(plainYearMonthMap, record) ||
    hasMapRecord(plainMonthDayMap, record) ||
    hasMapRecord(durationMap, record)
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
