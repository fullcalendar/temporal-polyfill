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

/*
Should be called with a class so method descriptors are already
non-enumerable and non-constructible.
*/
export function mixin(destPrototype: object, sourceClass: any): void {
  const descriptors = Object.getOwnPropertyDescriptors(
    sourceClass.prototype,
  ) as { constructor?: PropertyDescriptor }
  delete descriptors.constructor
  Object.defineProperties(destPrototype, descriptors)
}

interface JsonDebuggable {
  toJSON(): string
}

/*
Must be called AFTER slots are assigned
*/
export const attachDebugString: (instance: JsonDebuggable) => void =
  // detect if minified
  defineTemporalClass.name === 'defineTemporalClass'
    ? (instance: JsonDebuggable) => {
        Object.defineProperty(instance, '_str_', {
          value: instance.toJSON(),
        })
      }
    : () => {} // TODO: reuse noop

export function forbiddenValueOf(): never {
  throw new TypeError(errorMessages.forbiddenValueOf)
}

export function invalidRecordType(): never {
  throw new TypeError(errorMessages.invalidCallingContext)
}
