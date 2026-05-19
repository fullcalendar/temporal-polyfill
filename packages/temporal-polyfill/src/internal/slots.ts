import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { computeDurationSign } from './durationMath'
import { epochNanoToMilli } from './epochMath'
import { type InternalCalendar } from './externalCalendar'
import { calendarDateFieldNamesAsc, timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { type TimeZoneImpl } from './timeZoneImpl'
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
  timeZone: TimeZoneImpl,
  calendar?: InternalCalendar,
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    timeZone,
    epochNanoseconds: epochNano,
  }
}

export function createDateTimeSlots(
  isoDateTime: CalendarDateTimeFields,
  calendar?: InternalCalendar,
): CalendarDateTimeFields & { calendar: InternalCalendar } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    // strange to use this, but does plucking in ascending order
    ...combineDateAndTime(isoDateTime, isoDateTime),
  }
}

export function createDateSlots(
  isoDate: CalendarDateFields,
  calendar?: InternalCalendar,
): CalendarDateFields & { calendar: InternalCalendar } {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

// TODO: converge with createDateSlots
export function createYearMonthSlots(
  isoDate: CalendarDateFields,
  calendar: InternalCalendar,
): CalendarDateFields & { calendar: InternalCalendar } {
  return {
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createMonthDaySlots(
  isoDate: CalendarDateFields,
  calendar: InternalCalendar,
): CalendarDateFields & { calendar: InternalCalendar } {
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
export type ZonedEpochNanoFields = EpochNanoFields & { timeZone: TimeZoneImpl }

// Epoch Slot Getters
// -----------------------------------------------------------------------------
// TODO: move to mixins?

export function getEpochMilli(slots: EpochNanoFields): number {
  return epochNanoToMilli(slots.epochNanoseconds)
}

export function getEpochNano(slots: EpochNanoFields): bigint {
  return slots.epochNanoseconds
}
