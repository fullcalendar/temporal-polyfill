import { isoCalendarId } from '../internal/calendarConfig'
import { IsoDateFields, IsoTimeFields } from '../internal/calendarIsoFields'
import { BrandingSlots, refineCalendarSlotString, refineTimeZoneSlotString } from '../internal/slots'
import { createGetterDescriptors, createPropDescriptors, createStringTagDescriptors, isObjectlike, mapProps } from '../internal/utils'
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
const setSlots = slotsMap.set.bind(slotsMap)

// Class
// -------------------------------------------------------------------------------------------------

export function createSlotClass(
  branding: string,
  construct: any,
  getters: any,
  methods: any,
  staticMethods: any,
): any {
  function Class(this: any, ...args: any[]) {
    if (this instanceof Class) {
      setSlots(this, construct(...args))
    } else {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
  }

  Object.defineProperties(Class.prototype, {
    ...createStringTagDescriptors('Temporal.' + branding),
    ...createGetterDescriptors(mapProps(curryMethod as any, getters) as any), // !!!
    ...createPropDescriptors(mapProps(curryMethod as any, methods)),
  })

  Object.defineProperties(Class, createPropDescriptors(staticMethods))

  function curryMethod(method: any, methodName: string) {
    const newMethod = function(this: any, ...args: any[]) {
      const slots = getSlots(this)
      if (!slots || slots.branding !== branding) {
        throw new TypeError(errorMessages.invalidCallingContext)
      }
      return method.call(this, slots, ...args)
    }
    Object.defineProperty(newMethod, 'name', {
      value: methodName,
      // writable: false,
      // enumerable: false,
      configurable: true,
    })
    return newMethod
  }

  Object.defineProperty(Class, 'name', {
    value: branding,
    // writable: false,
    // enumerable: false,
    configurable: true,
  })

  return [
    Class,

    // createViaSlots
    (slots: BrandingSlots) => {
      const instance = Object.create(Class.prototype)
      setSlots(instance, slots)
      return instance
    },

    // getSpecificSlots
    (obj: any) => {
      const slots = getSlots(obj)
      if (!slots || slots.branding !== branding) {
        throw new TypeError(errorMessages.invalidCallingContext)
      }
      return slots
    },
  ]
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
