import { DayTimeNano } from './dayTimeNano'
import { DurationFields, durationFieldNamesAlpha } from './durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoDateFieldNamesAlpha, isoDateTimeFieldNamesAlpha, isoTimeFieldNamesAlpha } from './calendarIsoFields'
import { requireString } from './cast'
import { isoCalendarId } from './calendarConfig'
import { parseCalendarId, parseOffsetNanoMaybe, parseTimeZoneId } from './parseIso'
import { realizeTimeZoneId, utcTimeZoneId } from './timeZoneNative'
import { realizeCalendarId } from './calendarNativeQuery'
import { pluckProps } from './utils'
import * as errorMessages from './errorMessages'

export const PlainYearMonthBranding = 'PlainYearMonth' as const
export const PlainMonthDayBranding = 'PlainMonthDay' as const
export const PlainDateBranding = 'PlainDate' as const
export const PlainDateTimeBranding = 'PlainDateTime' as const
export const PlainTimeBranding = 'PlainTime' as const
export const ZonedDateTimeBranding = 'ZonedDateTime' as const
export const InstantBranding = 'Instant' as const
export const DurationBranding = 'Duration' as const
export const CalendarBranding = 'Calendar' as const

// Slot-creation helpers
// -------------------------------------------------------------------------------------------------

export function createInstantSlots(epochNano: DayTimeNano): InstantSlots {
  return {
    branding: InstantBranding,
    epochNanoseconds: epochNano,
  }
}

/*
NOTE: parseZonedDateTime still uses ZonedDateTimeBranding
*/
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

export function createPlainDateTimeSlots<C>(isoFields: IsoDateTimeFields & { calendar: C }): PlainDateTimeSlots<C>
export function createPlainDateTimeSlots<C>(isoFields: IsoDateTimeFields, calendar: C): PlainDateTimeSlots<C>
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

export function createPlainDateSlots<C>(isoFields: IsoDateFields & { calendar: C }): PlainDateSlots<C>
export function createPlainDateSlots<C>(isoFields: IsoDateFields, calendar: C): PlainDateSlots<C>
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

export function createPlainYearMonthSlots<C>(isoFields: IsoDateFields & { calendar: C }): PlainYearMonthSlots<C>
export function createPlainYearMonthSlots<C>(isoFields: IsoDateFields, calendar: C): PlainYearMonthSlots<C>
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

export function createPlainMonthDaySlots<C>(isoFields: IsoDateFields & { calendar: C }): PlainMonthDaySlots<C>
export function createPlainMonthDaySlots<C>(isoFields: IsoDateFields, calendar: C): PlainMonthDaySlots<C>
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

/*
TODO: have Calendar dateUntil return this? and many other places that return DurationFields?
*/
export function createDurationSlots(durationFields: DurationFields): DurationSlots {
  return {
    branding: DurationBranding,
    ...pluckProps(durationFieldNamesAlpha, durationFields)
  }
}

// getISOFields
// -------------------------------------------------------------------------------------------------

export function removeBranding<S>(slots: S): Omit<S, 'branding'> {
  slots = { ...slots }
  delete (slots as any).branding
  return slots
}

// -------------------------------------------------------------------------------------------------

export interface BrandingSlots {
  branding: string
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export type DateSlots<C> = IsoDateFields & { calendar: C }
export type ZonedEpochSlots<C, T> = EpochSlots & { timeZone: T, calendar: C }

export type PlainDateSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainDateBranding }
export type PlainTimeSlots = IsoTimeFields & { branding: typeof PlainTimeBranding }
export type PlainDateTimeSlots<C> = IsoDateTimeFields & { calendar: C, branding: typeof PlainDateTimeBranding }
export type ZonedDateTimeSlots<C, T> = { epochNanoseconds: DayTimeNano, calendar: C, timeZone: T, branding: typeof ZonedDateTimeBranding }
export type PlainMonthDaySlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainMonthDayBranding }
export type PlainYearMonthSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainYearMonthBranding }
export type DurationSlots = DurationFields & { branding: typeof DurationBranding }
export type InstantSlots = { epochNanoseconds: DayTimeNano, branding: typeof InstantBranding }

// Calendar
// -------------------------------------------------------------------------------------------------

export function getCommonCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (!isIdLikeEqual(a, b)) {
    throw new RangeError(errorMessages.mismatchingCalendars)
  }

  return a
}

export function getPreferredCalendarSlot<C extends IdLike>(a: C, b: C): C {
  // fast path. doesn't read IDs
  // similar to isIdLikeEqual
  if (a === b) {
    return a
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId || aId === isoCalendarId) {
    return b
  } else if (bId === isoCalendarId) {
    return a
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}

export function refineCalendarSlotString(calendarArg: string): string {
  return realizeCalendarId(parseCalendarId(requireString(calendarArg)))
}

// bag
// ---

export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

export function extractCalendarIdFromBag(bag: { calendar?: string }): string | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlotString(calendar)
  }
}

// TimeZone
// -------------------------------------------------------------------------------------------------

export function getCommonTimeZoneSlot<C extends IdLike>(a: C, b: C): C {
  if (!isTimeZoneSlotsEqual(a, b, true)) {
    throw new RangeError(errorMessages.mismatchingTimeZones)
  }

  return a
}

export function isTimeZoneSlotsEqual(a: IdLike, b: IdLike, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: IdLike, loose?: boolean): string | number {
  const id = getId(slot)

  if (loose && id === utcTimeZoneId) {
    return 0
  }

  const offsetNano = parseOffsetNanoMaybe(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}

export function refineTimeZoneSlotString(arg: string): string {
  return realizeTimeZoneId(parseTimeZoneId(requireString(arg)))
}

// ID-like
// -------------------------------------------------------------------------------------------------

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : requireString(idLike.id)
}

export function isIdLikeEqual(
  calendarSlot0: IdLike,
  calendarSlot1: IdLike,
): boolean {
  return calendarSlot0 === calendarSlot1 || getId(calendarSlot0) === getId(calendarSlot1)
}
