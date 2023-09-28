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

/*
Maintains Symbols keys
*/
export function excludeUndefinedProps<P extends {}>(props: P): Partial<P> {
  props = { ...props }
  const propNames = Object.keys(props) as (keyof P)[]

  for (const propName of propNames) {
    if (props[propName] === undefined) {
      delete props[propName]
    }
  }

  return props
}

export function hasAnyPropsByName<P extends {}>(
  props: P,
  names: (keyof P)[]
): boolean {
  for (const name of names) {
    if (name in props) {
      return true
    }
  }
  return false
}

export function hasAllPropsByName<P extends {}>(
  props: P,
  names: (keyof P)[]
): boolean {
  for (const name of names) {
    if (!(name in props)) {
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

export function defineGetters(target: any, getters: any) { // TODO: better type
  return Object.defineProperties(
    target,
    createGetterDescriptors(getters),
  )
}

export function defineStringTag(target: any, temporalName: string) {
  return Object.defineProperties(
    target,
    createTemporalNameDescriptors(temporalName),
  )
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

/*
-1 if a comes before b
 0 if equal
 1 if a comes after b
*/
export function compareNumbers(a: number, b: number): NumSign {
  return Math.sign(a - b) as NumSign
}

/*
min/max are inclusive
*/
export function clampNumber(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

export function isClamped(num: number, min: number, max: number): boolean {
  return num === clampNumber(num, min, max)
}

export function clampEntity(
  entityName: string,
  num: number,
  min: number,
  max: number,
  overflow?: Overflow,
): number {
  const clamped = clampNumber(num, min, max)

  if (overflow && num !== clamped) {
    throw new RangeError(`${entityName} must be between ${min}-${max}`)
  }

  return clamped
}

export function clampProp<P>(
  props: P,
  propName: keyof FilterPropValues<P, number> & string,
  min: number,
  max: number,
  overflow?: Overflow,
): number {
  return clampEntity(propName, props[propName] as number, min, max, overflow)
}

export function divModFloor(num: number, divisor: number): [number, number] {
  const quotient = Math.floor(num / divisor)
  const remainder = modFloor(num, divisor)
  return [quotient, remainder]
}

export function modFloor(num: number, divisor: number): number {
  return (num % divisor + divisor) % divisor
}

export function divModTrunc(num: number, divisor: number): [number, number] {
  return [
    divTrunc(num, divisor),
    modTrunc(num, divisor),
  ]
}

/*
FIX-FOR: using Math.trunc often results in -0
Only useful for Numbers. BigInts don't have this problem
NOTE: anywhere else Math.trunc is directly used, do ||0
*/
export function divTrunc(num: number, divisor: number): number {
  return Math.trunc(num / divisor) || 0
}

/*
FIX-FOR: using % often results in -0
Only useful for Numbers. BigInts don't have this problem
NOTE: anywhere else % is directly used, do ||0
*/
export function modTrunc(num: number, divisor: number): number {
  return (num % divisor) || 0
}

// rounding
// --------

export function roundExpand(num: number): number {
  return num < 0 ? Math.floor(num) : Math.ceil(num)
}

/*
Similar to Math.round, but rounds negative half-numbers to floor (-1.5 => -2)
*/
export function roundHalfExpand(num: number): number {
  return Math.sign(num) * Math.round(Math.abs(num)) || 0 // prevent -0
}

export function roundHalfFloor(num: number): number {
  return hasHalf(num) ? Math.floor(num) : Math.round(num)
}

export function roundHalfCeil(num: number): number {
  return hasHalf(num) ? Math.ceil(num) : Math.round(num)
}

export function roundHalfTrunc(num: number): number {
  return hasHalf(num) ? (Math.trunc(num) || 0) : Math.round(num)
}

export function roundHalfEven(num: number): number {
  return hasHalf(num)
    ? (num = Math.trunc(num) || 0) + (num % 2)
    : Math.round(num)
}

function hasHalf(num: number): boolean {
  return Math.abs(num % 1) === 0.5
}

// types

export type FilterPropValues<P, F> = {
  [K in keyof P as (P[K] extends F ? K : never)]: P[K]
}
