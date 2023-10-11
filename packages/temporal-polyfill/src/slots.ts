import { CalendarSlot } from './calendarSlot'
import { DayTimeNano } from './dayTimeNano'
import { DurationInternals } from './durationFields'
import { IsoDateFields, IsoTimeFields } from './isoFields'
import { TimeZoneSlot } from './timeZoneSlot'

export interface BrandingSlots {
  branding: string
}

export interface CalendarSlots {
  calendar: CalendarSlot
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export interface ZonedEpochSlots extends EpochSlots {
  timeZone: TimeZoneSlot
  calendar: CalendarSlot
}

export type IsoDateSlots = IsoDateFields & CalendarSlots
export type IsoDateTimeSlots = IsoDateSlots & IsoTimeFields

export const PlainYearMonthBranding = 'PlainYearMonth' as const
export const PlainMonthDayBranding = 'PlainMonthDay' as const
export const PlainDateBranding = 'PlainDate' as const
export const PlainDateTimeBranding = 'PlainDateTime' as const
export const PlainTimeBranding = 'PlainTime' as const
export const ZonedDateTimeBranding = 'ZonedDateTime' as const
export const InstantBranding = 'Instant' as const
export const DurationBranding = 'Duration' as const
export const CalendarBranding = 'Calendar' as const
export const TimeZoneBranding = 'TimeZone' as const

export type PlainYearMonthSlots = { branding: typeof PlainYearMonthBranding } & IsoDateSlots
export type PlainMonthDaySlots = { branding: typeof PlainMonthDayBranding } & IsoDateSlots
export type PlainDateSlots = { branding: typeof PlainDateBranding } & IsoDateSlots
export type PlainDateTimeSlots = { branding: typeof PlainDateTimeBranding } & IsoDateTimeSlots
export type PlainTimeSlots = { branding: typeof PlainTimeBranding } & IsoTimeFields
export type ZonedDateTimeSlots = { branding: typeof ZonedDateTimeBranding } & ZonedEpochSlots
export type InstantSlots = { branding: typeof InstantBranding } & EpochSlots
export type DurationSlots = { branding: typeof DurationBranding } & DurationInternals // !!!

// ---

const slotsMap = new WeakMap<any, BrandingSlots>()

// TODO: allow type-input, so caller doesn't need to cast so much
export const getSlots = slotsMap.get.bind(slotsMap)
export const setSlots = slotsMap.set.bind(slotsMap)

export function createViaSlots(Class: any, slots: BrandingSlots): any {
  const instance = Object.create(Class.prototype)
  setSlots(instance, slots)
  return instance
}

export function getSpecificSlots(branding: string, obj: any): BrandingSlots {
  const slots = getSlots(obj)
  if (!slots || slots.branding !== branding) {
    throw new TypeError('Bad')
  }
  return slots
}
