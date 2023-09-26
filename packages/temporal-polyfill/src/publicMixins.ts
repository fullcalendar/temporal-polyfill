import { timeFieldNames } from './calendarFields'
import { CalendarOps } from './calendarOps'
import { dayTimeNanoToBigInt } from './dayTimeNano'
import { DurationInternals, durationInternalNames } from './durationFields'
import { IsoDateFields, IsoTimeFields, isoTimeFieldNames } from './isoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from './isoMath'
import { zonedInternalsToIso } from './timeZoneOps'
import { FilterPropValues, mapPropNames } from './utils'
import { getSpecificSlots, BrandingSlots, CalendarSlots, IsoDateSlots, ZonedDateTimeSlots, EpochSlots, DurationBranding, DurationSlots } from './slots'

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
  names: K[]
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoDateSlots)
      return slots.calendar[name as K](slots)
    }
  }, names)
}

// YUCK
export function createZonedCalendarGetterMethods<M, K extends keyof AllCalendarGetterMethods>(
  branding: string,
  names: K[]
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as ZonedDateTimeSlots
      return slots.calendar[name as K](zonedInternalsToIso(slots))
    }
  }, names)
}

export function createTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoTimeFields)
      return slots[isoTimeFieldNames[i]]
    }
  }, timeFieldNames)
}

// YUCK
export function createZonedTimeGetterMethods(branding: string) {
  return mapPropNames((name, i) => {
    return function (this: any) {
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
  return function (this: any) {
    const slots = getSpecificSlots(DurationBranding, this) as DurationSlots
    return slots[propName]
  }
}, durationInternalNames)

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}
