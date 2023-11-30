import { TimeBag, TimeFields } from '../internal/calendarFields'
import { OverflowOptions } from '../internal/options'
import { PlainDateSlots, PlainDateTimeSlots, PlainTimeSlots } from '../genericApi/genericTypes'
import { createTypicalTimeZoneRecordIMPL } from '../genericApi/recordCreators'
import * as PlainTimeFuncs from '../genericApi/plainTime'

export const create = PlainTimeFuncs.create

export const fromFields = PlainTimeFuncs.fromFields

export const fromString = PlainTimeFuncs.fromString

export function getFields(slots: PlainTimeSlots): TimeFields {
  return {
    hour: slots.isoHour,
    minute: slots.isoMinute,
    second: slots.isoSecond,
    millisecond: slots.isoMillisecond,
    microsecond: slots.isoMicrosecond,
    nanosecond: slots.isoNanosecond,
  }
}

export const getISOFields = PlainTimeFuncs.getISOFields

export function withFields(
  slots: PlainTimeSlots,
  mod: TimeBag,
  options?: OverflowOptions,
): PlainTimeSlots {
  return PlainTimeFuncs.withFields(getFields(slots), mod, options)
}

export const add = PlainTimeFuncs.add

export const subtract = PlainTimeFuncs.subtract

export const until = PlainTimeFuncs.until

export const since = PlainTimeFuncs.since

export const round = PlainTimeFuncs.round

export const compare = PlainTimeFuncs.compare

export const equals = PlainTimeFuncs.equals

export const toString = PlainTimeFuncs.toString

export const toJSON = PlainTimeFuncs.toJSON

// TODO: ensure options isn't undefined before accessing
export function toZonedDateTime(
  slots: PlainTimeSlots,
  options: { timeZone: string, plainDate: PlainDateSlots<string> },
) {
  return PlainTimeFuncs.toZonedDateTime(
    createTypicalTimeZoneRecordIMPL,
    slots,
    options.timeZone,
    options.plainDate,
  )
}

export function toPlainDateTime(
  plainTimeSlots: PlainTimeSlots,
  plainDateSlots: PlainDateSlots<string>,
): PlainDateTimeSlots<string> {
  return PlainTimeFuncs.toPlainDateTime(plainTimeSlots, plainDateSlots) // just pass through
}
