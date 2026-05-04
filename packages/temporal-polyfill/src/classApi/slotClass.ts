import * as errorMessages from '../internal/errorMessages'
import { BrandingSlots } from '../internal/slots'
import {
  createGetterDescriptors,
  createNameDescriptors,
  createPropDescriptors,
  createStringTagDescriptors,
  mapProps,
} from '../internal/utils'

const slotsMap = new WeakMap<any, BrandingSlots>()

// TODO: allow type-input, so caller doesn't need to cast so much
export const getSlots = slotsMap.get.bind(slotsMap)
const setSlots = slotsMap.set.bind(slotsMap)

export function createSlotClass(
  branding: string,
  construct: any,
  getters: any,
  methods: any,
  staticMethods: any,
  formatFunc: (slots: any) => string,
): any {
  function Class(this: any, ...args: any[]) {
    if (this instanceof Class) {
      const slots = construct(...args)
      setSlots(this, slots)
      dbg(this, slots, formatFunc)
    } else {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
  }

  Object.defineProperties(Class.prototype, {
    ...createGetterDescriptors(mapProps(bindMethod as any, getters) as any), // !!!
    ...createPropDescriptors(mapProps(bindMethod as any, methods)),
    ...createStringTagDescriptors('Temporal.' + branding),
  })

  Object.defineProperties(Class, {
    ...createPropDescriptors(staticMethods),
    ...createNameDescriptors(branding),
  })

  function bindMethod(method: any, methodName: string) {
    return Object.defineProperties(function (this: any, ...args: any[]) {
      return method.call(this, getSpecificSlots(this), ...args)
    }, createNameDescriptors(methodName))
  }

  function getSpecificSlots(obj: any): any {
    const slots = getSlots(obj)
    if (!slots || slots.branding !== branding) {
      throw new TypeError(errorMessages.invalidCallingContext)
    }
    return slots
  }

  function createViaSlots(slots: BrandingSlots) {
    const instance = Object.create(Class.prototype)
    setSlots(instance, slots)
    dbg(instance, slots, formatFunc)
    return instance
  }

  return [Class, createViaSlots, getSpecificSlots]
}

// Utils
// -----------------------------------------------------------------------------

export function rejectInvalidBag<B>(bag: B): B {
  if (
    getSlots(bag) ||
    // RejectObjectWithCalendarOrTimeZone is a public property-bag guard.
    // It deliberately observes the spec field names even though internal
    // slots store the corresponding strings as calendarId/timeZoneId.
    (bag as any).calendar !== undefined ||
    (bag as any).timeZone !== undefined
  ) {
    throw new TypeError(errorMessages.invalidBag)
  }
  return bag
}

// Attaches debugging to the given instance
// Intentionally short function name because shortens 'dbg' string
function dbg(instance: any, slots: any, formatSlots: (slots: any) => string) {
  // NOT minified ?
  if (dbg.name === 'dbg') {
    Object.defineProperty(instance, '_str_', {
      value: formatSlots(slots),
      writable: false,
      enumerable: false,
      configurable: false,
    })
  }
}
