import { BigNano, bigNanoToBigInt } from './bigNano'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { computeDurationSign } from './durationMath'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './epochMath'
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

export const PlainYearMonthBranding = 'PlainYearMonth' as const
export const PlainMonthDayBranding = 'PlainMonthDay' as const
export const PlainDateBranding = 'PlainDate' as const
export const PlainDateTimeBranding = 'PlainDateTime' as const
export const PlainTimeBranding = 'PlainTime' as const
export const ZonedDateTimeBranding = 'ZonedDateTime' as const
export const InstantBranding = 'Instant' as const
export const DurationBranding = 'Duration' as const

// Slot-creation helpers
// -----------------------------------------------------------------------------

export function createInstantSlots(epochNano: BigNano): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: epochNano,
  }
}

export function createZonedDateTimeSlots(
  epochNano: BigNano,
  timeZone: TimeZoneImpl,
  calendar?: InternalCalendar,
): ZonedDateTimeSlots {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    branding: ZonedDateTimeBranding,
    calendar,
    timeZone,
    epochNanoseconds: epochNano,
  }
}

export function createPlainDateTimeSlots(
  isoDateTime: CalendarDateTimeFields,
  calendar?: InternalCalendar,
): PlainDateTimeSlots {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    branding: PlainDateTimeBranding,
    calendar,
    // strange to use this, but does plucking in ascending order
    ...combineDateAndTime(isoDateTime, isoDateTime),
  }
}

export function createPlainDateSlots(
  isoDate: CalendarDateFields,
  calendar?: InternalCalendar,
): PlainDateSlots {
  // Internal ISO calendar slots are represented by an omitted/undefined calendar.
  return {
    branding: PlainDateBranding,
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createPlainYearMonthSlots(
  isoDate: CalendarDateFields,
  calendar: InternalCalendar,
): PlainYearMonthSlots {
  return {
    branding: PlainYearMonthBranding,
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createPlainMonthDaySlots(
  isoDate: CalendarDateFields,
  calendar: InternalCalendar,
): PlainMonthDaySlots {
  return {
    branding: PlainMonthDayBranding,
    calendar,
    ...pluckProps(calendarDateFieldNamesAsc, isoDate as CalendarDateFields),
  }
}

export function createPlainTimeSlots(time: TimeFields): PlainTimeSlots {
  return {
    branding: PlainTimeBranding,
    ...pluckProps(timeFieldNamesAsc, time),
  }
}

export function createDurationSlots(
  durationFields: DurationFields,
): DurationSlots {
  return {
    branding: DurationBranding,
    sign: computeDurationSign(durationFields),
    ...pluckProps(durationFieldNamesAsc, durationFields),
  }
}

// -----------------------------------------------------------------------------

export type BrandingSlots = { branding: string }

export type EpochSlots = { epochNanoseconds: BigNano }
export type EpochAndZoneSlots = EpochSlots & { timeZone: TimeZoneImpl }
export type ZonedEpochSlots = EpochAndZoneSlots & {
  calendar: InternalCalendar
}

// without branding
export type AbstractDateSlots = CalendarDateFields & {
  calendar: InternalCalendar
}
export type AbstractDateTimeSlots = CalendarDateTimeFields & {
  calendar: InternalCalendar
}

export type PlainDateSlots = CalendarDateFields & {
  calendar: InternalCalendar
  branding: typeof PlainDateBranding
}

export type PlainTimeSlots = TimeFields & {
  branding: typeof PlainTimeBranding
}

export type PlainDateTimeSlots = CalendarDateTimeFields & {
  calendar: InternalCalendar
  branding: typeof PlainDateTimeBranding
}

export type ZonedDateTimeSlots = ZonedEpochSlots & {
  branding: typeof ZonedDateTimeBranding
}

export type PlainMonthDaySlots = CalendarDateFields & {
  calendar: InternalCalendar
  branding: typeof PlainMonthDayBranding
}

export type PlainYearMonthSlots = CalendarDateFields & {
  calendar: InternalCalendar
  branding: typeof PlainYearMonthBranding
}

export type DurationSlots = DurationFields & {
  branding: typeof DurationBranding
  sign: NumberSign // computed data
}

export type InstantSlots = {
  branding: typeof InstantBranding
  epochNanoseconds: BigNano
}

// Epoch Slot Getters
// -----------------------------------------------------------------------------

/*
Only used by funcApi
*/
export function getEpochSec(slots: EpochSlots): number {
  return epochNanoToSec(slots.epochNanoseconds)
}

export function getEpochMilli(slots: EpochSlots): number {
  return epochNanoToMilli(slots.epochNanoseconds)
}

/*
Only used by funcApi
*/
export function getEpochMicro(slots: EpochSlots): bigint {
  return epochNanoToMicro(slots.epochNanoseconds)
}

export function getEpochNano(slots: EpochSlots): bigint {
  return bigNanoToBigInt(slots.epochNanoseconds)
}

export function extractEpochNano(slots: EpochSlots): BigNano {
  return slots.epochNanoseconds
}
