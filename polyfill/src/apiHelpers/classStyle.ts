import * as errorMessages from '../internal/errorMessages'
import {
  type GetterMap,
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
  // Merge first so each class installs all generated getters in one descriptor
  // pass. The fresh target keeps the shared getter maps immutable.
  Object.defineProperties(
    cls.prototype,
    mapProps(
      (getter) => ({
        get() {
          return getter(getSlots!(this))
        },
        configurable: true,
      }),
      Object.assign({}, ...getterMaps),
    ),
  )
  return cls
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
    : noop

export function invalidRecordType(): never {
  throwTypeError(errorMessages.invalidCallingContext)
}

export function forbiddenValueOf(): never {
  throwTypeError(errorMessages.forbiddenValueOf)
}
