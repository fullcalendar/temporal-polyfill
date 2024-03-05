import { BigNano, bigNanoToBigInt } from './bigNano'
import { requireString } from './cast'
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

export function createZonedDateTimeSlots<C, T>(
  epochNano: BigNano,
  timeZone: T,
  calendar: C,
): ZonedDateTimeSlots<C, T> {
  return {
    branding: ZonedDateTimeBranding,
    calendar,
    timeZone,
    epochNanoseconds: epochNano,
  }
}

export function createPlainDateTimeSlots<C>(
  isoFields: IsoDateTimeFields & { calendar: C },
): PlainDateTimeSlots<C>
export function createPlainDateTimeSlots<C>(
  isoFields: IsoDateTimeFields,
  calendar: C,
): PlainDateTimeSlots<C>
export function createPlainDateTimeSlots<C>(
  isoFields: IsoDateTimeFields & { calendar?: C },
  calendar = isoFields.calendar,
): PlainDateTimeSlots<C> {
  return {
    branding: PlainDateTimeBranding,
    calendar: calendar!,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
  }
}

export function createPlainDateSlots<C>(
  isoFields: IsoDateFields & { calendar: C },
): PlainDateSlots<C>
export function createPlainDateSlots<C>(
  isoFields: IsoDateFields,
  calendar: C,
): PlainDateSlots<C>
export function createPlainDateSlots<C>(
  isoFields: IsoDateFields & { calendar?: C },
  calendar = isoFields.calendar,
): PlainDateSlots<C> {
  return {
    branding: PlainDateBranding,
    calendar: calendar!,
    ...pluckProps(isoDateFieldNamesAlpha, isoFields),
  }
}

export function createPlainYearMonthSlots<C>(
  isoFields: IsoDateFields & { calendar: C },
): PlainYearMonthSlots<C>
export function createPlainYearMonthSlots<C>(
  isoFields: IsoDateFields,
  calendar: C,
): PlainYearMonthSlots<C>
export function createPlainYearMonthSlots<C>(
  isoFields: IsoDateFields & { calendar?: C },
  calendar = isoFields.calendar,
): PlainYearMonthSlots<C> {
  return {
    branding: PlainYearMonthBranding,
    calendar: calendar!,
    ...pluckProps(isoDateFieldNamesAlpha, isoFields),
  }
}

export function createPlainMonthDaySlots<C>(
  isoFields: IsoDateFields & { calendar: C },
): PlainMonthDaySlots<C>
export function createPlainMonthDaySlots<C>(
  isoFields: IsoDateFields,
  calendar: C,
): PlainMonthDaySlots<C>
export function createPlainMonthDaySlots<C>(
  isoFields: IsoDateFields & { calendar?: C },
  calendar = isoFields.calendar,
): PlainMonthDaySlots<C> {
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
export type EpochAndZoneSlots<T> = EpochSlots & { timeZone: T }
export type ZonedEpochSlots<C = unknown, T = unknown> = EpochAndZoneSlots<T> & {
  calendar: C
}

export type DateSlots<C> = IsoDateFields & { calendar: C }
export type DateTimeSlots<C> = IsoDateTimeFields & { calendar: C }

export type PlainDateSlots<C> = IsoDateFields & {
  branding: typeof PlainDateBranding
  calendar: C
}

export type PlainTimeSlots = IsoTimeFields & {
  branding: typeof PlainTimeBranding
}

export type PlainDateTimeSlots<C> = IsoDateTimeFields & {
  branding: typeof PlainDateTimeBranding
  calendar: C
}

export type ZonedDateTimeSlots<C, T> = ZonedEpochSlots<C, T> & {
  branding: typeof ZonedDateTimeBranding
}

export type PlainMonthDaySlots<C> = IsoDateFields & {
  branding: typeof PlainMonthDayBranding
  calendar: C
}

export type PlainYearMonthSlots<C> = IsoDateFields & {
  branding: typeof PlainYearMonthBranding
  calendar: C
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

export function getEpochSec(slots: EpochSlots): number {
  return epochNanoToSec(slots.epochNanoseconds)
}

export function getEpochMilli(slots: EpochSlots): number {
  return epochNanoToMilli(slots.epochNanoseconds)
}

export function getEpochMicro(slots: EpochSlots): bigint {
  return epochNanoToMicro(slots.epochNanoseconds)
}

export function getEpochNano(slots: EpochSlots): bigint {
  return bigNanoToBigInt(slots.epochNanoseconds)
}

export function extractEpochNano(slots: EpochSlots): BigNano {
  return slots.epochNanoseconds
}

// ID-like
// -----------------------------------------------------------------------------

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : requireString(idLike.id)
}

export function isIdLikeEqual(idLike0: IdLike, idLike1: IdLike): boolean {
  return idLike0 === idLike1 || getId(idLike0) === getId(idLike1)
}
