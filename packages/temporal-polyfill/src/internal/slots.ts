import { BigNano, bigNanoToBigInt } from './bigNano'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { computeDurationSign } from './durationMath'
import { CalendarDateFields, TimeFields } from './fieldTypes'
import { IsoDateCarrier, IsoDateTimeCarrier } from './isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './timeMath'
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
  timeZoneId: string,
  calendarId: string,
): ZonedDateTimeSlots {
  return {
    branding: ZonedDateTimeBranding,
    calendar: calendarId,
    timeZone: timeZoneId,
    epochNanoseconds: epochNano,
  }
}

export function createPlainDateTimeSlots(
  isoDate: CalendarDateFields,
  time: TimeFields,
  calendar: string,
): PlainDateTimeSlots {
  return {
    branding: PlainDateTimeBranding,
    calendar,
    isoDate,
    time,
  }
}

export function createPlainDateSlots(
  isoDate: CalendarDateFields,
  calendar: string,
): PlainDateSlots {
  return {
    branding: PlainDateBranding,
    calendar,
    isoDate,
  }
}

export function createPlainYearMonthSlots(
  isoDate: CalendarDateFields,
  calendar: string,
): PlainYearMonthSlots {
  return {
    branding: PlainYearMonthBranding,
    calendar,
    isoDate,
  }
}

export function createPlainMonthDaySlots(
  isoDate: CalendarDateFields,
  calendar: string,
): PlainMonthDaySlots {
  return {
    branding: PlainMonthDayBranding,
    calendar,
    isoDate,
  }
}

export function createPlainTimeSlots(time: TimeFields): PlainTimeSlots {
  return {
    branding: PlainTimeBranding,
    time,
  }
}

export function createDurationSlots(
  durationFields: DurationFields,
): DurationSlots {
  return {
    branding: DurationBranding,
    sign: computeDurationSign(durationFields),
    ...pluckProps(durationFieldNamesAlpha, durationFields),
  }
}

// -----------------------------------------------------------------------------

export type BrandingSlots = { branding: string }

export type EpochSlots = { epochNanoseconds: BigNano }
export type EpochAndZoneSlots = EpochSlots & { timeZone: string }
export type ZonedEpochSlots = EpochAndZoneSlots & {
  calendar: string
}

// without branding
export type AbstractDateSlots = IsoDateCarrier & { calendar: string }
export type AbstractDateTimeSlots = IsoDateTimeCarrier & { calendar: string }

export type PlainDateSlots = {
  calendar: string
  isoDate: CalendarDateFields
} & {
  branding: typeof PlainDateBranding
}

export type PlainTimeSlots = { time: TimeFields } & {
  branding: typeof PlainTimeBranding
}

export type PlainDateTimeSlots = {
  calendar: string
  isoDate: CalendarDateFields
  time: TimeFields
} & {
  branding: typeof PlainDateTimeBranding
}

export type ZonedDateTimeSlots = ZonedEpochSlots & {
  branding: typeof ZonedDateTimeBranding
}

export type PlainMonthDaySlots = {
  calendar: string
  isoDate: CalendarDateFields
} & {
  branding: typeof PlainMonthDayBranding
}

export type PlainYearMonthSlots = {
  calendar: string
  isoDate: CalendarDateFields
} & {
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
