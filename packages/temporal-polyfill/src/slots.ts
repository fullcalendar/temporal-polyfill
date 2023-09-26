import { timeFieldNames } from './calendarFields'
import { CalendarOps } from './calendarOps'
import { DayTimeNano, dayTimeNanoToBigInt } from './dayTimeNano'
import { DurationInternals, durationInternalNames } from './durationFields'
import { IsoDateFields, IsoTimeFields, isoTimeFieldNames } from './isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './isoMath'
import { TimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { FilterPropValues, mapPropNames } from './utils'

export interface BrandingSlots {
  branding: string
}

export interface CalendarSlots {
  calendar: CalendarOps
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export interface ZonedEpochSlots extends EpochSlots {
  timeZone: TimeZoneOps
  calendar: CalendarOps
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

// MIXINS
// ---
// TODO: better types

export function createCalendarIdGetterMethods(branding: string): { calendarId(): string } {
  return {
    calendarId() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & CalendarSlots)
      return slots.calendar.id
    }
  }
}

type AllCalendarGetterMethods = FilterPropValues<CalendarOps, (isoFields: IsoDateFields) => unknown>

export function createCalendarGetterMethods<M, K extends keyof AllCalendarGetterMethods>(
  branding: string,
  names: K[],
) {
  return mapPropNames((name, i) => {
    return function(this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoDateSlots)
      return slots.calendar[name as K](slots)
    }
  }, names)
}

// YUCK
export function createZonedCalendarGetterMethods<M, K extends keyof AllCalendarGetterMethods>(
  branding: string,
  names: K[],
) {
  return mapPropNames((name, i) => {
    return function(this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots
      return slots.calendar[name as K](zonedInternalsToIso(slots))
    }
  }, names)
}

export function createTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function(this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoTimeFields)
      return slots[isoTimeFieldNames[i]]
    }
  }, timeFieldNames)
}

// YUCK
export function createZonedTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function(this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots
      return zonedInternalsToIso(slots)[isoTimeFieldNames[i]]
    }
  }, timeFieldNames)
}

export function createEpochGetterMethods(branding: string) {
  return {
    epochSeconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToSec(slots.epochNanoseconds)
    },
    epochMilliseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMilli(slots.epochNanoseconds)
    },
    epochMicroseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMicro(slots.epochNanoseconds)
    },
    epochNanoseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return dayTimeNanoToBigInt(slots.epochNanoseconds)
    },
  }
}

/*
Includes sign()
*/
export const durationGettersMethods = mapPropNames((propName: keyof DurationInternals) => {
  return function(this: any) {
    const slots = getSpecificSlots(DurationBranding, this) as DurationSlots
    return slots[propName]
  }
}, durationInternalNames)

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}
