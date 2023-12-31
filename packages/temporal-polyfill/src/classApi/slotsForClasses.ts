import { isoCalendarId } from '../internal/calendarConfig'
import { IsoDateFields, IsoTimeFields } from '../internal/calendarIsoFields'
import { BrandingSlots, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { isObjectlike } from '../internal/utils'
import { CalendarArg } from './calendar'
import { CalendarProtocol, checkCalendarProtocol } from './calendarProtocol'
import { TimeZoneArg } from './timeZone'
import { TimeZoneProtocol, checkTimeZoneProtocol } from './timeZoneProtocol'
import * as errorMessages from '../internal/errorMessages'

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
    throw new TypeError(errorMessages.invalidMethodContext)
  }
  return slots
}

// Reject
// -------------------------------------------------------------------------------------------------

export function rejectInvalidBag<B>(bag: B): B {
  if (
    getSlots(bag) ||
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}

// getISOFields
// -------------------------------------------------------------------------------------------------

export type PublicDateSlots = IsoDateFields & { calendar: CalendarSlot }
export type PublicDateTimeSlots = PublicDateSlots & IsoTimeFields

// Calendar
// -------------------------------------------------------------------------------------------------

export type CalendarSlot = CalendarProtocol | string

export function refineCalendarSlot(calendarArg: CalendarArg): CalendarSlot {
  if (isObjectlike(calendarArg)) {
    // look at other date-like objects
    const { calendar } = (getSlots(calendarArg) || {}) as { calendar?: CalendarSlot }
    if (calendar) {
      return calendar
    }

    checkCalendarProtocol(calendarArg as CalendarProtocol)
    return calendarArg as CalendarProtocol
  }

  return refineCalendarSlotString(calendarArg)
}

// bag
// ---

export function getCalendarSlotFromBag(bag: { calendar?: CalendarArg }): CalendarSlot {
  return extractCalendarSlotFromBag(bag) || isoCalendarId
}

export function extractCalendarSlotFromBag(bag: { calendar?: CalendarArg }): CalendarSlot | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlot(calendar)
  }
}

// TimeZone
// -------------------------------------------------------------------------------------------------

export type TimeZoneSlot = TimeZoneProtocol | string

export function refineTimeZoneSlot(arg: TimeZoneArg): TimeZoneSlot {
  if (isObjectlike(arg)) {
    const { timeZone } = (getSlots(arg) || {}) as { timeZone?: TimeZoneSlot }

    if (timeZone) {
      return timeZone // TimeZoneOps
    }

    checkTimeZoneProtocol(arg as TimeZoneProtocol)
    return arg as TimeZoneProtocol
  }
  return refineTimeZoneSlotString(arg)
}
