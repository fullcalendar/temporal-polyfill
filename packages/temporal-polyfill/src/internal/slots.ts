import { isoCalendarId } from './calendarConfig'
import { resolveCalendarId } from './calendarNativeQuery'
import { requireString } from './cast'
import { DayTimeNano, dayTimeNanoToBigInt } from './dayTimeNano'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import * as errorMessages from './errorMessages'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  isoDateFieldNamesAlpha,
  isoDateTimeFieldNamesAlpha,
  isoTimeFieldNamesAlpha,
} from './isoFields'
import { parseCalendarId, parseTimeZoneId } from './isoParse'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './timeMath'
import { getTimeZoneComparator, resolveTimeZoneId } from './timeZoneNative'
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

// Epoch Slot Getters (best place for this?)
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

// Calendar
// -----------------------------------------------------------------------------

export function getCommonCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (!isIdLikeEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }

  return a
}

export function getPreferredCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (a === b) {
    return a
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId || aId === isoCalendarId) {
    return b
  }
  if (bId === isoCalendarId) {
    return a
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}

// NOTE: only used by funcApi (circ dep?)
export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

// NOTE: only used by funcApi (circ dep?)
export function extractCalendarIdFromBag(bag: { calendar?: string }):
  | string
  | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarIdString(calendar)
  }
}

// NOTE: only used by funcApi (circ dep?)
export function refineCalendarIdString(id: string): string {
  return resolveCalendarId(requireString(id))
}

// NOTE: only used by classApi (circ dep?)
export function refineCalendarSlotString(arg: string): string {
  return resolveCalendarId(parseCalendarId(requireString(arg)))
}

// TimeZone
// -----------------------------------------------------------------------------

export function getCommonTimeZoneSlot<C extends IdLike>(a: C, b: C): C {
  if (!isTimeZoneSlotsEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }

  return a
}

/*
HACK: Callers should !! the result because minification forces literal true/false to 1/0
*/
export function isTimeZoneSlotsEqual(a: IdLike, b: IdLike): boolean {
  if (a === b) {
    return true
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId) {
    return true
  }

  // If either is an unresolvable, return false
  // Unfortunately, can only be detected with try/catch because `new Intl.DateTimeFormat` throws
  try {
    return getTimeZoneComparator(aId) === getTimeZoneComparator(bId)
  } catch {}

  return false
}

// NOTE: only used by funcApi (circ dep?)
export function refineTimeZoneIdString(id: string): string {
  return resolveTimeZoneId(requireString(id))
}

// TODO: only used by classApi (circ dep?)
export function refineTimeZoneSlotString(arg: string): string {
  return resolveTimeZoneId(parseTimeZoneId(requireString(arg)))
}

// ID-like
// -----------------------------------------------------------------------------

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : requireString(idLike.id)
}

export function isIdLikeEqual(
  calendarSlot0: IdLike,
  calendarSlot1: IdLike,
): boolean {
  return (
    calendarSlot0 === calendarSlot1 ||
    getId(calendarSlot0) === getId(calendarSlot1)
  )
}
