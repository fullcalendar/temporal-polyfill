import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateFields, IsoTimeFields } from '../internal/isoFields'

// public
import { CalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'

// Types
// -------------------------------------------------------------------------------------------------

export interface BrandingSlots {
  branding: string
}

export interface CalendarSlots {
  calendar: CalendarSlot
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

// TODO: kill
export interface ZonedEpochSlots extends EpochSlots {
  timeZone: TimeZoneSlot
  calendar: CalendarSlot
}
export type IsoDateSlots = IsoDateFields & CalendarSlots
export type IsoDateTimeSlots = IsoDateSlots & IsoTimeFields

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
