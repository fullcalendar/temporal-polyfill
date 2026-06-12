import * as errorMessages from '../internal/errorMessages'
import {
  createNameDescriptors,
  createStringTagDescriptors,
} from '../internal/utils'

type ClassType = {
  new (...args: any[]): any
  prototype: object
}

type MixinInstances<Mixins extends readonly ClassType[]> =
  Mixins extends readonly [
    infer First extends ClassType,
    ...infer Rest extends ClassType[],
  ]
    ? InstanceType<First> & MixinInstances<Rest>
    : unknown

type TemporalClass<
  C extends ClassType,
  Mixins extends readonly ClassType[],
> = C &
  (new (
    ..._args: ConstructorParameters<C>
  ) => InstanceType<C> & MixinInstances<Mixins>)

export function defineTemporalClass<
  C extends ClassType,
  Mixins extends readonly ClassType[],
>(branding: string, cls: C, ...mixins: Mixins): TemporalClass<C, Mixins> {
  Object.defineProperties(cls, createNameDescriptors(branding))
  Object.defineProperties(
    cls.prototype,
    createStringTagDescriptors('Temporal.' + branding),
  )
  for (const mixinClass of mixins) {
    mixin(cls.prototype, mixinClass)
  }
  return cls as TemporalClass<C, Mixins>
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

export function invalidRecordType(): never {
  throw new TypeError(errorMessages.invalidCallingContext)
}

export function forbiddenValueOf(): never {
  throw new TypeError(errorMessages.forbiddenValueOf)
}
