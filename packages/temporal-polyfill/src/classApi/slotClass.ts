import * as errorMessages from '../internal/errorMessages'
import { BrandingSlots } from '../internal/slots'
import {
  createGetterDescriptors,
  createNameDescriptors,
  createPropDescriptors,
  createStringTagDescriptors,
  hasAllPropsByName,
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
): any {
  function Class(this: any, ...args: any[]) {
    if (this instanceof Class) {
      setSlots(this, construct(...args))
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
    return instance
  }

  return [Class, createViaSlots, getSpecificSlots]
}

// Utils
// -----------------------------------------------------------------------------

// TODO: return type
export function createProtocolValidator(propNames: string[]): any {
  propNames = propNames.concat('id').sort()

  return (obj: any) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError(errorMessages.invalidProtocol)
    }
    return obj
  }
}

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
