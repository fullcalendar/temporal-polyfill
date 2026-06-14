import { invalidRecordType } from '../apiHelpers/classStyle'
import { CalendarImpl } from '../internal/calendarImpl'
import * as errorMessages from '../internal/errorMessages'
import { throwTypeError } from '../internal/utils'

export type CalendarSlots = {
  id: string
  getImpl: (() => CalendarImpl) | undefined // caller should cache
}

/*
Might contain a slot object (if shim) or a single native object (if native)
*/
const calendarMap = new WeakMap<object, CalendarSlots>()
const instantMap = new WeakMap<object, unknown>()
const zonedDateTimeMap = new WeakMap<object, unknown>()
const plainDateTimeMap = new WeakMap<object, unknown>()
const plainDateMap = new WeakMap<object, unknown>()
const plainTimeMap = new WeakMap<object, unknown>()
const plainYearMonthMap = new WeakMap<object, unknown>()
const plainMonthDayMap = new WeakMap<object, unknown>()
const durationMap = new WeakMap<object, unknown>()

// Calendar (the only "known" type)
// --------

export function isCalendarRecord(record: unknown): boolean {
  return !!getCalendarSlotsIfPresent(record)
}

export function getCalendarSlots(record: unknown): CalendarSlots {
  return getCalendarSlotsIfPresent(record) || invalidRecordType()
}

export function getCalendarSlotsIfPresent(
  record: unknown,
): CalendarSlots | undefined {
  return calendarMap.get(record as object)
}

export function setCalendarSlots(instance: object, slots: CalendarSlots) {
  calendarMap.set(instance, slots)
}

// Instant
// -------

export function isInstantRecord(record: unknown): boolean {
  return !!getInstantSlotsIfPresent(record)
}

export function getInstantSlots<S>(record: unknown): S {
  return getInstantSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getInstantSlotsIfPresent<S>(record: unknown): S | undefined {
  return instantMap.get(record as object) as S | undefined
}

export function setInstantSlots(instance: object, slots: unknown) {
  instantMap.set(instance, slots)
}

// ZonedDateTime
// -------------

export function isZonedDateTimeRecord(record: unknown): boolean {
  return !!getZonedDateTimeSlotsIfPresent(record)
}

export function getZonedDateTimeSlots<S>(record: unknown): S {
  return getZonedDateTimeSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getZonedDateTimeSlotsIfPresent<S>(
  record: unknown,
): S | undefined {
  return zonedDateTimeMap.get(record as object) as S | undefined
}

export function setZonedDateTimeSlots(instance: object, slots: unknown) {
  zonedDateTimeMap.set(instance, slots)
}

// PlainDateTime
// -------------

export function isPlainDateTimeRecord(record: unknown): boolean {
  return !!getPlainDateTimeSlotsIfPresent(record)
}

export function getPlainDateTimeSlots<S>(record: unknown): S {
  return getPlainDateTimeSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getPlainDateTimeSlotsIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainDateTimeMap.get(record as object) as S | undefined
}

export function setPlainDateTimeSlots(instance: object, slots: unknown) {
  plainDateTimeMap.set(instance, slots)
}

// PlainDate
// ---------

export function isPlainDateRecord(record: unknown): boolean {
  return !!getPlainDateSlotsIfPresent(record)
}

export function getPlainDateSlots<S>(record: unknown): S {
  return getPlainDateSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getPlainDateSlotsIfPresent<S>(record: unknown): S | undefined {
  return plainDateMap.get(record as object) as S | undefined
}

export function setPlainDateSlots(instance: object, slots: unknown) {
  plainDateMap.set(instance, slots)
}

// PlainTime
// ---------

export function isPlainTimeRecord(record: unknown): boolean {
  return !!getPlainTimeSlotsIfPresent(record)
}

export function getPlainTimeSlots<S>(record: unknown): S {
  return getPlainTimeSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getPlainTimeSlotsIfPresent<S>(record: unknown): S | undefined {
  return plainTimeMap.get(record as object) as S | undefined
}

export function setPlainTimeSlots(instance: object, slots: unknown) {
  plainTimeMap.set(instance, slots)
}

// PlainYearMonth
// --------------

export function isPlainYearMonthRecord(record: unknown): boolean {
  return !!getPlainYearMonthSlotsIfPresent(record)
}

export function getPlainYearMonthSlots<S>(record: unknown): S {
  return getPlainYearMonthSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getPlainYearMonthSlotsIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainYearMonthMap.get(record as object) as S | undefined
}

export function setPlainYearMonthSlots(instance: object, slots: unknown) {
  plainYearMonthMap.set(instance, slots)
}

// PlainMonthDay
// -------------

export function isPlainMonthDayRecord(record: unknown): boolean {
  return !!getPlainMonthDaySlotsIfPresent(record)
}

export function getPlainMonthDaySlots<S>(record: unknown): S {
  return getPlainMonthDaySlotsIfPresent<S>(record) || invalidRecordType()
}

export function getPlainMonthDaySlotsIfPresent<S>(
  record: unknown,
): S | undefined {
  return plainMonthDayMap.get(record as object) as S | undefined
}

export function setPlainMonthDaySlots(instance: object, slots: unknown) {
  plainMonthDayMap.set(instance, slots)
}

// Duration
// --------

export function isDurationRecord(record: unknown): boolean {
  return !!getDurationSlotsIfPresent(record)
}

export function getDurationSlots<S>(record: unknown): S {
  return getDurationSlotsIfPresent<S>(record) || invalidRecordType()
}

export function getDurationSlotsIfPresent<S>(record: unknown): S | undefined {
  return durationMap.get(record as object) as S | undefined
}

export function setDurationSlots(instance: object, slots: unknown) {
  durationMap.set(instance, slots)
}

// Utils
// -----

function isTemporalRecord(record: unknown): boolean {
  return (
    isCalendarRecord(record) ||
    isInstantRecord(record) ||
    isZonedDateTimeRecord(record) ||
    isPlainDateTimeRecord(record) ||
    isPlainDateRecord(record) ||
    isPlainTimeRecord(record) ||
    isPlainYearMonthRecord(record) ||
    isPlainMonthDayRecord(record) ||
    isDurationRecord(record)
  )
}

export function validateBag<B>(bag: B): B {
  if (
    isTemporalRecord(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store internal calendar/time-zone objects, but public bags still
    // use the spec property names.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throwTypeError(errorMessages.invalidBag)
  }
  return bag
}
