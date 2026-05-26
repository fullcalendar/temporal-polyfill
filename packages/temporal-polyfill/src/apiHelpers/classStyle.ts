import * as errorMessages from '../internal/errorMessages'
import { createStringTagDescriptors } from '../internal/utils'

export function defineTemporalClass(
  cls: { prototype: object },
  branding: string,
) {
  Object.defineProperties(
    cls.prototype,
    createStringTagDescriptors('Temporal.' + branding),
  )
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
