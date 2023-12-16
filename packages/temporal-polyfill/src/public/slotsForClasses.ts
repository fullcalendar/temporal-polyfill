import { IsoDateFields, IsoTimeFields } from '../internal/calendarIsoFields'
import { CalendarSlot } from './calendarSlot'
import { DayTimeNano } from '../internal/dayTimeNano'
import { TimeZoneSlot } from './timeZoneSlot'

export interface BrandingSlots {
  branding: string
}

// Lookup
// -------------------------------------------------------------------------------------------------

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

// Reject
// -------------------------------------------------------------------------------------------------

export function rejectInvalidBag<B>(bag: B): B {
  if (getSlots(bag)) {
    throw new TypeError('Cant pass a Temporal object')
  }
  if ((bag as any).calendar !== undefined) {
    throw new TypeError('Ah')
  }
  if ((bag as any).timeZone !== undefined) {
    throw new TypeError('Ah')
  }
  return bag
}

// Types for getISOFields()
// -------------------------------------------------------------------------------------------------

export type PublicDateSlots = IsoDateFields & { calendar: CalendarSlot }
export type PublicDateTimeSlots = PublicDateSlots & IsoTimeFields

// For internal use within public API
// -------------------------------------------------------------------------------------------------

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export interface ZonedEpochSlots extends EpochSlots {
  timeZone: TimeZoneSlot
  calendar: CalendarSlot
}
