import { type CalendarSlot } from './calendarSlot'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { computeDurationSign } from './durationMath'
import { epochNanoToMilli } from './epochMath'
import { calendarDateFieldNamesAsc, timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { type TimeZone } from './timeZone'
import { NumberSign, pluckProps } from './utils'

// Slot-creation helpers
// -----------------------------------------------------------------------------

export function createEpochNanoSlots(epochNano: bigint): EpochNanoFields {
  return {
    epochNanoseconds: epochNano,
  }
}

export function createZonedEpochNanoSlots(
  epochNano: bigint,
  timeZone: TimeZone,
  calendar?: CalendarSlot,
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    timeZone,
    epochNanoseconds: epochNano,
  }
}

export function createDateTimeSlots(
  isoDateTime: CalendarDateTimeFields,
  calendar?: CalendarSlot,
): CalendarDateTimeFields & { calendar: CalendarSlot } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    // strange to use this, but does plucking in ascending order
    ...combineDateAndTime(isoDateTime, isoDateTime),
  }
}

export function createDateSlots(
  isoDate: CalendarDateFields,
  calendar?: CalendarSlot,
): CalendarDateFields & { calendar: CalendarSlot } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

// TODO: converge with createDateSlots
export function createYearMonthSlots(
  isoDate: CalendarDateFields,
  calendar: CalendarSlot,
): CalendarDateFields & { calendar: CalendarSlot } {
  return {
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createMonthDaySlots(
  isoDate: CalendarDateFields,
  calendar: CalendarSlot,
): CalendarDateFields & { calendar: CalendarSlot } {
  return {
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createTimeSlots(time: TimeFields): TimeFields {
  return {
    ...pluckProps(timeFieldNamesAsc, time),
  }
}

export function createDurationSlots(
  durationFields: DurationFields,
): DurationFields & { sign: NumberSign } {
  return {
    sign: computeDurationSign(durationFields),
    ...pluckProps(durationFieldNamesAsc, durationFields),
  }
}

// -----------------------------------------------------------------------------

export type EpochNanoFields = { epochNanoseconds: bigint }
export type ZonedEpochNanoFields = EpochNanoFields & { timeZone: TimeZone }

// Epoch Slot Getters
// -----------------------------------------------------------------------------
// TODO: move to mixins?

export function getEpochMilli(slots: EpochNanoFields): number {
  return epochNanoToMilli(slots.epochNanoseconds)
}

export function getEpochNano(slots: EpochNanoFields): bigint {
  return slots.epochNanoseconds
}
