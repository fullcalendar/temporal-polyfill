import * as errorMessages from '../internal/errorMessages'
import {
  createNameDescriptors,
  createStringTagDescriptors,
} from '../internal/utils'

export function defineTemporalClass<C extends { prototype: object }>(
  cls: C,
  branding: string,
): C {
  Object.defineProperties(cls, createNameDescriptors(branding))
  Object.defineProperties(
    cls.prototype,
    createStringTagDescriptors('Temporal.' + branding),
  )
  return cls
}

export function attachDebugString<S>(
  instance: object,
  slots: S,
  formatSlots: (slots: S) => string,
) {
  // Keep the existing debug affordance for development builds.
  if (attachDebugString.name === 'attachDebugString') {
    Object.defineProperty(instance, '_str_', {
      value: formatSlots(slots),
    })
  }
}

export function forbiddenValueOf(): never {
  throw new TypeError(errorMessages.forbiddenValueOf)
}

export function invalidRecordType(): never {
  throw new TypeError(errorMessages.invalidCallingContext)
}
