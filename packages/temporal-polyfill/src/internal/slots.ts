import { requireString } from './cast'
import { DayTimeNano, dayTimeNanoToBigInt } from './dayTimeNano'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldNamesAlpha,
  isoDateTimeFieldNamesAlpha,
  isoTimeFieldNamesAlpha,
} from './isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './timeMath'
import { bindArgs, excludePropsByName, pluckProps } from './utils'

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

export function createInstantSlots(epochNano: DayTimeNano): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: epochNano,
  }
}

export function createZonedDateTimeSlots<C, T>(
  epochNano: DayTimeNano,
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
    ...pluckProps(durationFieldNamesAlpha, durationFields),
  }
}

// getISOFields
// -----------------------------------------------------------------------------

export const removeBranding = bindArgs(
  excludePropsByName,
  new Set(['branding']),
)

// -----------------------------------------------------------------------------

export interface BrandingSlots {
  branding: string
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export type DateSlots<C> = IsoDateFields & { calendar: C }
export type ZonedEpochSlots<C, T> = EpochSlots & { timeZone: T; calendar: C }

export type PlainDateSlots<C> = IsoDateFields & {
  calendar: C
  branding: typeof PlainDateBranding
}
export type PlainTimeSlots = IsoTimeFields & {
  branding: typeof PlainTimeBranding
}
export type PlainDateTimeSlots<C> = IsoDateTimeFields & {
  calendar: C
  branding: typeof PlainDateTimeBranding
}
export type ZonedDateTimeSlots<C, T> = ZonedEpochSlots<C, T> & {
  branding: typeof ZonedDateTimeBranding
}
export type PlainMonthDaySlots<C> = IsoDateFields & {
  calendar: C
  branding: typeof PlainMonthDayBranding
}
export type PlainYearMonthSlots<C> = IsoDateFields & {
  calendar: C
  branding: typeof PlainYearMonthBranding
}
export type DurationSlots = DurationFields & {
  branding: typeof DurationBranding
}
export type InstantSlots = {
  epochNanoseconds: DayTimeNano
  branding: typeof InstantBranding
}

// Epoch Slot Getters
// -----------------------------------------------------------------------------

export function getEpochSeconds(slots: EpochSlots) {
  return epochNanoToSec(slots.epochNanoseconds)
}

export function getEpochMilliseconds(slots: EpochSlots) {
  return epochNanoToMilli(slots.epochNanoseconds)
}

export function getEpochMicroseconds(slots: EpochSlots) {
  return epochNanoToMicro(slots.epochNanoseconds)
}

export function getEpochNanoseconds(slots: EpochSlots) {
  return dayTimeNanoToBigInt(slots.epochNanoseconds)
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
