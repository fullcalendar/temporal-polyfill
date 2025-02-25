import { BigNano, bigNanoToBigInt } from './bigNano'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { computeDurationSign } from './durationMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldNamesAlpha,
  isoDateTimeFieldNamesAlpha,
  isoTimeFieldNamesAlpha,
} from './isoFields'
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

/*
TODO: simpler way of doing method overloading?
*/
export function createPlainDateTimeSlots(
  isoFields: IsoDateTimeFields & { calendar: string },
): PlainDateTimeSlots
export function createPlainDateTimeSlots(
  isoFields: IsoDateTimeFields,
  calendar: string,
): PlainDateTimeSlots
export function createPlainDateTimeSlots(
  isoFields: IsoDateTimeFields & { calendar?: string },
  calendar = isoFields.calendar,
): PlainDateTimeSlots {
  return {
    branding: PlainDateTimeBranding,
    calendar: calendar!,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
  }
}

export function createPlainDateSlots(
  isoFields: IsoDateFields & { calendar: string },
): PlainDateSlots
export function createPlainDateSlots(
  isoFields: IsoDateFields,
  calendar: string,
): PlainDateSlots
export function createPlainDateSlots(
  isoFields: IsoDateFields & { calendar?: string },
  calendar = isoFields.calendar,
): PlainDateSlots {
  return {
    branding: PlainDateBranding,
    calendar: calendar!,
    ...pluckProps(isoDateFieldNamesAlpha, isoFields),
  }
}

/*
TODO: simpler way of doing method overloading?
*/
export function createPlainYearMonthSlots(
  isoFields: IsoDateFields & { calendar: string },
): PlainYearMonthSlots
export function createPlainYearMonthSlots(
  isoFields: IsoDateFields,
  calendar: string,
): PlainYearMonthSlots
export function createPlainYearMonthSlots(
  isoFields: IsoDateFields & { calendar?: string },
  calendar = isoFields.calendar,
): PlainYearMonthSlots {
  return {
    branding: PlainYearMonthBranding,
    calendar: calendar!,
    ...pluckProps(isoDateFieldNamesAlpha, isoFields),
  }
}

/*
TODO: simpler way of doing method overloading?
*/
export function createPlainMonthDaySlots(
  isoFields: IsoDateFields & { calendar: string },
): PlainMonthDaySlots
export function createPlainMonthDaySlots(
  isoFields: IsoDateFields,
  calendar: string,
): PlainMonthDaySlots
export function createPlainMonthDaySlots(
  isoFields: IsoDateFields & { calendar?: string },
  calendar = isoFields.calendar,
): PlainMonthDaySlots {
  return {
    branding: PlainMonthDayBranding,
    calendar: calendar!,
    ...pluckProps(isoDateFieldNamesAlpha, isoFields),
  }
}

export function createPlainTimeSlots(isoFields: IsoTimeFields): PlainTimeSlots {
  return {
    branding: PlainTimeBranding,
    ...pluckProps(isoTimeFieldNamesAlpha, isoFields),
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
export type DateSlots = IsoDateFields & { calendar: string }
export type DateTimeSlots = IsoDateTimeFields & { calendar: string }

export type PlainDateSlots = DateSlots & {
  branding: typeof PlainDateBranding
}

export type PlainTimeSlots = IsoTimeFields & {
  branding: typeof PlainTimeBranding
}

export type PlainDateTimeSlots = DateTimeSlots & {
  branding: typeof PlainDateTimeBranding
}

export type ZonedDateTimeSlots = ZonedEpochSlots & {
  branding: typeof ZonedDateTimeBranding
}

export type PlainMonthDaySlots = DateSlots & {
  branding: typeof PlainMonthDayBranding
}

export type PlainYearMonthSlots = DateSlots & {
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
