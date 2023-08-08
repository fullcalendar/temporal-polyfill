import { Overflow } from './options'

/*
Is this making this more complex at cost of no lower min size?
*/
export type Reused = any

/*
Will linter make [any] for bind okay? If so, this is unnecessary
*/
export type BoundArg = any

/*
For programmatically-generated functions that have overly-complex inferred types
*/
export type Callable = (...args: any[]) => any

export type Classlike = any

const objectlikeRE = /object|function/

export function isObjectlike(arg: unknown): arg is {} {
  return arg !== null && objectlikeRE.test(typeof arg)
}

export function mapProps<P, R, E = undefined>(
  transformer: (propVal: P[keyof P], propName: keyof P, extraArg?: E) => R,
  props: P,
  extraArg?: E
): { [K in keyof P]: R } {
  const res = {} as { [K in keyof P]: R }

  for (const propName in props) {
    res[propName] = transformer(props[propName], propName, extraArg)
  }

  return res
}

export const mapPropsWithRefiners = mapProps.bind(
  undefined,
  (propVal: any, propName: string, refinerMap: any) => refinerMap[propName](propVal, propName),
) as (
  <P, M extends { [K in keyof P]: (propVal: P[K], propName: K) => any }>(
    props: P,
    refinerMap: M,
  ) => {
    [K in keyof P]: ReturnType<M[K]>
  }
)

export function mapPropNames<P, R, E = undefined>(
  generator: (propName: keyof P, i: number, extraArg?: E) => R,
  propNames: (keyof P)[],
  extraArg?: E
): { [K in keyof P]: R } {
  const props = {} as { [K in keyof P]: R }

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    props[propName] = generator(propName, i, extraArg)
  }

  return props
}

export const mapPropNamesToIndex = mapPropNames.bind(
  undefined,
  (propVal: any, i: number) => i,
) as (
  <P>(propNames: (keyof P)[]) => { [K in keyof P]: number }
)

export const mapPropNamesToConstant = mapPropNames.bind(
  undefined,
  (propVal: unknown, i: number, constant: unknown) => constant,
) as (
  <P, C>(propNames: (keyof P)[], c: C) => { [K in keyof P]: C }
)

export function remapProps<O, N>(
  oldNames: (keyof O)[],
  newNames: (keyof N)[],
  oldProps: O
): N {
  const newProps = {} as N

  for (let i = 0; i < oldNames.length; i++) {
    newProps[newNames[i]] = oldProps[oldNames[i]] as any
  }

  return newProps
}

export function pluckProps<P>(propNames: (keyof P)[], props: P): P {
  const res = {} as P

  for (const propName of propNames) {
    res[propName] = props[propName]
  }

  return res
}

export function pluckPropsTuple<P>(propNames: (keyof P)[], props: P): any {
  const res = []

  for (const propName of propNames) {
    res.push(props[propName])
  }

  return res
}

export function excludeArrayDuplicates<V>(a: V[]): V[] {
  return [...new Set(a)]
}

function filterProps<P, E = undefined>(
  filterFunc: (propVal: P[keyof P], propName: keyof P, extraArg: E) => boolean,
  props: P,
  extraArg?: any,
): Partial<P> {
  const filteredProps = {} as Partial<P>

  for (const propName in props) {
    const propVal = props[propName]

    if (filterFunc(propVal, propName, extraArg)) {
      filteredProps[propName] = propVal
    }
  }

  return filteredProps
}

export const excludePropsByName = filterProps.bind<
  undefined, [BoundArg], // bound
  [any, Set<string>], // unbound
  any // return
>(undefined, (
  propVal: unknown,
  propName: string,
  nameSet: Set<string>
) => {
  return !nameSet.has(propName)
}) as (
  <P, K extends keyof P>(props: P, propNames: Set<string>) => Omit<P, K>
)

export const excludeUndefinedProps = filterProps.bind(undefined, (
  propVal: unknown
) => {
  return propVal !== undefined
}) as (
  <P>(props: P) => Partial<P>
)

export function hasAnyPropsByName<P>(
  props: P,
  names: (keyof P)[]
): boolean {
  for (const name of names) {
    if (props[name] !== undefined) {
      return true
    }
  }
  return false
}

export function hasAllPropsByName<P>(
  props: P,
  names: (keyof P)[]
): boolean {
  for (const name of names) {
    if (props[name] === undefined) {
      return false
    }
  }
  return true
}

// interface MapInterface<K, V> {
//   has(key: K): boolean
//   get(key: K): V,
//   set(key: K, val: V): void
// }

export function createLazyGenerator<K, V, A extends any[]>(
  generator: (key: K, ...otherArgs: A) => V,
  MapClass: { new(): any } = Map,
): (
  (key: K, ...otherArgs: A) => V
) {
  const map = new MapClass()

  return (key: K, ...otherArgs: A) => {
    if (map.has(key)) {
      return map.get(key) as V
    } else {
      const val = generator(key, ...otherArgs)
      map.set(key, val)
      return val
    }
  }
}

// descriptor stuff
// ----------------

export function defineProps<Target, NewProps extends { [propName: string]: unknown }>(
  target: Target,
  propVals: NewProps,
): Target & NewProps {
  return Object.defineProperties(
    target,
    createPropDescriptors(propVals),
  ) as (Target & NewProps)
}

export function createPropDescriptors(
  propVals: { [propName: string]: unknown },
): PropertyDescriptorMap {
  return mapProps((value) => ({
    value,
    configurable: true,
    writable: true,
  }), propVals)
}

export function createGetterDescriptors(
  getters: { [propName: string]: () => unknown },
): PropertyDescriptorMap {
  return mapProps((getter) => ({
    get: getter,
    configurable: true,
  }), getters)
}

export function createTemporalNameDescriptors(temporalName: string): {
  // crazy
  [Symbol.toStringTag]: {
    value: string,
    configurable: true,
  },
} {
  return {
    [Symbol.toStringTag]: {
      value: 'Temporal.' + temporalName,
      configurable: true,
    },
  }
}

// former lang
// -----------

export function identityFunc<T>(arg: T): T {
  return arg
}

export function noop(): void {
  // return undefined
}

export function padNumber(digits: number, num: number): string { // TODO: rename `padNum`
  return String(num).padStart(digits, '0')
}

export const padNumber2 = padNumber.bind(undefined, 2)

export type NumSign = -1 | 0 | 1

export function compareNumbers(a: number, b: number): NumSign { // TODO: rename `compareNums`
  return Math.sign(a - b) as NumSign
}

/*
min/max are inclusive
*/
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow?: Overflow.Constrain | -1, // -1 for returning undefined
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow: Overflow | -1, // might be Overflow.Reject, require noun
  noun: string,
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow?: Overflow | -1,
  noun?: string,
): number | undefined {
  const clamped = Math.min(Math.max(num, min), max)

  if (overflow && num !== clamped) {
    if (overflow === -1) {
      return undefined
    }
    throw new RangeError(`${noun!} must be between ${min}-${max}`)
  }

  return clamped
}

export function clampProp<P>(
  props: P,
  propName: keyof FilterPropValues<P, number> & string,
  min: number,
  max: number,
  overflow: Overflow | -1,
): number {
  return clamp(props[propName] as number, min, max, overflow, propName)
}

export function divFloorMod(num: number, divisor: number): [number, number]
export function divFloorMod(num: bigint, divisor: bigint): [bigint, bigint]
export function divFloorMod(num: any, divisor: any): [any, any] {
  const remainder = floorMod(num, divisor)
  const quotient = (num - remainder) / divisor
  return [quotient, remainder]
}

export function floorMod(num: number, divisor: number): number
export function floorMod(num: bigint, divisor: bigint): bigint
export function floorMod(num: any, divisor: any): any {
  return (num % divisor + divisor) % divisor
}

// rounding
// --------

export function roundExpand(num: number): number {
  return num < 0 ? Math.floor(num) : Math.ceil(num)
}

export function roundHalfFloor(num: number): number {
  return hasHalf(num) ? Math.floor(num) : Math.round(num)
}

export function roundHalfCeil(num: number): number {
  return hasHalf(num) ? Math.ceil(num) : Math.round(num)
}

export function roundHalfTrunc(num: number): number {
  return hasHalf(num) ? Math.trunc(num) : Math.round(num)
}

export function roundHalfEven(num: number): number {
  return hasHalf(num)
    ? (num = Math.trunc(num)) + (num % 2)
    : Math.round(num)
}

function hasHalf(num: number): boolean {
  return Math.abs(num % 1) === 0.5
}

// types

export type FilterPropValues<P, F> = {
  [K in keyof P as (P[K] extends F ? K : never)]: P[K]
}
