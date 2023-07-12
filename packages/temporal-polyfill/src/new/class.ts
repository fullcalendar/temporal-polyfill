import { DateTimeFormat } from './intlFormat'
import { ensureInstanceOf, ensureString, toString } from './options'
import {
  createGetterDescriptors, createPropDescriptors, createTemporalNameDescriptors,
  defineProps,
  hasAllPropsByName,
  identityFunc,
  isObjectlike,
  mapProps,
  noop,
} from './utils'

type NonInternalArgs<F, I> =
  F extends (internals: I, ...otherArgs: infer A) => unknown
    ? A
    : never

type PropertyDescriptorType<D> =
  D extends { value: infer V }
    ? V
    : D extends { get: () => infer R }
      ? R
      : never

type WrapperClass<
  A extends [unknown],
  I,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
  P extends PropertyDescriptorMap,
  S extends {},
> = { new(...args: A): WrapperInstance<I, G, M, P> } & S

type WrapperInstance<
  I,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
  P extends PropertyDescriptorMap = {},
> = { [K in keyof G]: ReturnType<G[K]> }
  & { [K in keyof M]: (...args: NonInternalArgs<M[K], I>) => ReturnType<M[K]> }
  & { [K in keyof P]: PropertyDescriptorType<P[K]> }

// Wrapper Class
// -------------------------------------------------------------------------------------------------

const internalsMap = new WeakMap<WrapperInstance<unknown, {}, {}, {}>, unknown>()

export const getInternals = internalsMap.get.bind(internalsMap) as
  <T>(inst: T) => T extends WrapperInstance<infer I, {}, {}, {}> ? I : undefined

export function createWrapperClass<
  A extends [any], // TODO: rename to C
  I,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
  P extends PropertyDescriptorMap,
  S extends {},
>(
  getters: G,
  methods: M,
  constructorToInternals: (...args: A) => I = identityFunc,
  extraPrototypeDescriptors: P | {} = {},
  staticMembers: S | {} = {},
  handleInstance: (inst: WrapperInstance<I, G, M, P>) => void = noop,
): (
  WrapperClass<A, I, G, M, P, S>
) {
  function InternalObj(this: WrapperInstance<I, G, M, P>, ...args: A) {
    internalsMap.set(this, constructorToInternals(...args))
    handleInstance(this)
  }

  function curryMethod<AX extends any[], R>(
    method: (internals: I, ...args: AX) => R
  ) {
    return /* Object.setPrototypeOf( */ function(
      this: WrapperInstance<I, G, M, P>,
      ...args: AX
    ): R {
      if (!(this instanceof InternalObj)) {
        throw new TypeError('Invalid receiver')
      }
      return method.call(this, getInternals(this) as I, ...args)
    } /* , null) */
  }

  Object.defineProperties(InternalObj.prototype, {
    ...createGetterDescriptors(mapProps(curryMethod, getters)),
    ...createPropDescriptors(mapProps(curryMethod, methods)),
    ...extraPrototypeDescriptors,
  })

  defineProps(InternalObj, staticMembers)

  return InternalObj as any
}

export function getStrictInternals<T>( // rename: getInternalsStrict?
  Class: { new(): T },
  arg: T
): (
  T extends WrapperInstance<infer I, {}, {}, {}> ? I : undefined
) {
  return getInternals(ensureInstanceOf(Class, arg))
}

// Temporal Class
// -------------------------------------------------------------------------------------------------

type TemporalClass<
  A extends [any],
  I,
  O,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
  S extends {},
> = { new(...args: A): WrapperInstance<I, G, M> }
  & S
  & FromMethods<O>

interface ToJsonMethods {
  toJSON: () => string
}

type TemporalArg = TemporalInstance<unknown, {}, {}> | Record<string, unknown> | string

interface FromMethods<O> {
  from: (arg: TemporalArg, options: O) => void
}

type TemporalInstance<
  I,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
> = WrapperInstance<
  I,
  G,
  M & ToJsonMethods
> & { [Symbol.toStringTag]: string }

const temporaNameMap = new WeakMap<TemporalInstance<unknown, {}, {}>, string>()

export const getTemporalName = temporaNameMap.get.bind(temporaNameMap) as
  (arg: unknown) => string | undefined

export function createTemporalClass<
  A extends [any],
  I,
  O,
  G extends { [propName: string]: (internals: I) => unknown },
  M extends { [methodName: string]: (internals: I, ...args: any[]) => unknown },
  S extends {},
>(
  temporalName: string,
  constructorToInternals: (...args: A) => I = identityFunc,
  internalsConversionMap: { [typeName: string]: (otherInternal: unknown) => I },
  bagToInternals: (bag: Record<string, unknown>, options: O) => I,
  stringToInternals: (str: string) => I,
  handleUnusedOptions: (options: O) => void,
  getters: G,
  methods: M,
  staticMembers: S | {} = {},
): [
  Class: TemporalClass<A, I, O, G, M, S>,
  createInstance: (internals: I) => TemporalInstance<I, G, M>,
  toInternals: (arg: TemporalArg, options: O) => I
] {
  ;(methods as unknown as ToJsonMethods).toJSON = function() {
    return String(this)
  }

  ;(staticMembers as FromMethods<O>).from = function(arg: TemporalArg, options: O) {
    return createInstance(toInternals(arg, options))
  }

  const TemporalClass = createWrapperClass(
    getters,
    methods,
    constructorToInternals,
    createTemporalNameDescriptors(temporalName), // extraPrototypeDescriptors
    staticMembers,
    setTemporalName, // handleInstance
  )

  function createInstance(internals: I) {
    const instance: TemporalInstance<I, G, M> = Object.create(TemporalClass.prototype)
    internalsMap.set(instance, internals)
    setTemporalName(instance)
    return instance
  }

  function toInternals(arg: TemporalArg, options: O): I {
    let argInternals = getInternals(arg)
    let argTemporalName

    if (argInternals && (argTemporalName = getTemporalName(arg)) !== temporalName) {
      argInternals = (internalsConversionMap[argTemporalName!] || noop)(argInternals)
    }

    return (!argInternals && isObjectlike(arg) && bagToInternals(arg, options)) ||
      (handleUnusedOptions(options), (argInternals as I) || stringToInternals(toString(arg)))
  }

  function setTemporalName(instance: TemporalInstance<I, G, M>) {
    temporaNameMap.set(instance, temporalName)
  }

  return [TemporalClass as any, createInstance, toInternals]
}

// Utils for Specific Classes
// -------------------------------------------------------------------------------------------------

export function toLocaleStringMethod(
  this: any, // !!!
  internals: unknown,
  locales: string | string[],
  options: Intl.DateTimeFormatOptions,
) {
  /*
  Will create two internal Intl.DateTimeFormats :(
  Create just one instead
  */
  const format = new DateTimeFormat(locales, options)
  return format.format(this)
}

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}

// Complex Objects with IDs
// -------------------------------------------------------------------------------------------------

export function createProtocolChecker(protocolMethods: Record<string, () => unknown>) {
  const propNames = Object.keys(protocolMethods)
  propNames.push('id')
  propNames.sort() // TODO: order matters?

  return (obj: Record<string, unknown>) => {
    if (!hasAllPropsByName(obj, propNames)) {
      throw new TypeError('Invalid protocol')
    }
  }
}

export function getCommonInnerObj(
  propName: string,
  obj0: Record<string, unknown>,
  obj1: Record<string, unknown>,
) {
  const internal0 = obj0[propName] as { id: string }
  const internal1 = obj1[propName] as { id: string }

  if (!isObjIdsEqual(internal0, internal1)) {
    throw new TypeError(`${propName} not equal`)
  }

  return internal0
}

export function isObjIdsEqual(
  obj0: { id: string },
  obj1: { id: string }
): boolean {
  return obj0 === obj1 || // short-circuit
    obj0.id === obj1.id // .id could be getter with logic / side-effects (during testing)
}

export function getObjId(obj: { id: string }): string {
  return obj.id
}

function getObjIdStrict(obj: { id: string }): string {
  return ensureString(obj.id)
}

export const idGetters = { id: getObjId }
export const idGettersStrict = { id: getObjIdStrict }
