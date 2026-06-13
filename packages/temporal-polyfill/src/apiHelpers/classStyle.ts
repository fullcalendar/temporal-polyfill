import * as errorMessages from '../internal/errorMessages'
import {
  createNameDescriptors,
  createStringTagDescriptors,
  mapProps,
  noop,
  throwTypeError,
} from '../internal/utils'

type ClassType = {
  new (...args: any[]): any
  prototype: object
}

type GetterMap<Slots> = Record<string, (slots: Slots) => any>

type GetterMapInstance<Getters extends GetterMap<any>> = {
  readonly [K in keyof Getters]: ReturnType<Getters[K]>
}

type GetterMapInstances<GetterMaps extends readonly GetterMap<any>[]> =
  GetterMaps extends readonly [
    infer First extends GetterMap<any>,
    ...infer Rest extends GetterMap<any>[],
  ]
    ? GetterMapInstance<First> & GetterMapInstances<Rest>
    : unknown

type TemporalClass<
  C extends ClassType,
  GetterMaps extends readonly GetterMap<any>[],
> = C &
  (new (
    ..._args: ConstructorParameters<C>
  ) => InstanceType<C> & GetterMapInstances<GetterMaps>)

export function defineTemporalClass<C extends ClassType>(
  branding: string,
  cls: C,
): C
export function defineTemporalClass<
  C extends ClassType,
  Slots,
  GetterMaps extends readonly GetterMap<Slots>[],
>(
  branding: string,
  cls: C,
  getSlots: (obj: unknown) => Slots,
  ...getterMaps: GetterMaps
): TemporalClass<C, GetterMaps>
export function defineTemporalClass(
  branding: string,
  cls: ClassType,
  getSlots?: (obj: unknown) => unknown,
  ...getterMaps: GetterMap<unknown>[]
): ClassType {
  Object.defineProperties(cls, createNameDescriptors(branding))
  Object.defineProperties(
    cls.prototype,
    createStringTagDescriptors('Temporal.' + branding),
  )
  for (const getterMap of getterMaps) {
    defineSlotGetters(cls.prototype, getSlots!, getterMap)
  }
  return cls
}

function defineSlotGetters<Slots>(
  destPrototype: object,
  getSlots: (obj: unknown) => Slots,
  getterMap: GetterMap<Slots>,
): void {
  Object.defineProperties(
    destPrototype,
    mapProps(
      (getter) => ({
        get() {
          return getter(getSlots(this))
        },
        configurable: true,
      }),
      getterMap,
    ),
  )
}

interface JsonDebuggable {
  toJSON(): string
}

/*
Must be called AFTER slots are assigned
*/
export const attachDebugString: (instance: JsonDebuggable) => void =
  // detect if NOT minified
  noop.name === 'noop'
    ? (instance: JsonDebuggable) => {
        Object.defineProperty(instance, '_str_', {
          value: instance.toJSON(),
        })
      }
    : () => {} // TODO: reuse noop

export function invalidRecordType(): never {
  throwTypeError(errorMessages.invalidCallingContext)
}

export function forbiddenValueOf(): never {
  throwTypeError(errorMessages.forbiddenValueOf)
}
