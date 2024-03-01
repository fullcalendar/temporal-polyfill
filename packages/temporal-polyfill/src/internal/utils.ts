import * as errorMessages from './errorMessages'
import { Overflow } from './options'

// Types
// -----------------------------------------------------------------------------

/*
For programmatically-generated functions that have overly-complex inferred types
*/
export type Callable = (...args: any[]) => any

export type Classlike = any

// Validation
// -----------------------------------------------------------------------------

export function clampProp<P>(
  props: P,
  propName: keyof FilterPropValues<P, number> & string,
  min: number,
  max: number,
  overflow?: Overflow,
): number {
  return clampEntity(
    propName,
    getDefinedProp(props, propName),
    min,
    max,
    overflow,
  )
}

export function clampEntity(
  entityName: string,
  num: number,
  min: number,
  max: number,
  overflow?: Overflow,
  choices?: string[],
): number {
  const clamped = clampNumber(num, min, max)

  if (overflow && num !== clamped) {
    throw new RangeError(
      errorMessages.numberOutOfRange(entityName, num, min, max, choices),
    )
  }

  return clamped
}

export function getDefinedProp(props: any, propName: string): any {
  const propVal = props[propName]
  if (propVal === undefined) {
    throw new TypeError(errorMessages.missingField(propName))
  }
  return propVal
}

export function isObjectLike(arg: unknown): arg is {} {
  return arg !== null && /object|function/.test(typeof arg)
}

// Cache
// -----------------------------------------------------------------------------

// interface MapInterface<K, V> {
//   has(key: K): boolean
//   get(key: K): V,
//   set(key: K, val: V): void
// }

export function memoize<K, V, A extends any[]>(
  generator: (key: K, ...otherArgs: A) => V,
  MapClass: { new (): any } = Map, // TODO: better type
): (key: K, ...otherArgs: A) => V {
  const map = new MapClass()

  return (key: K, ...otherArgs: A) => {
    if (map.has(key)) {
      return map.get(key) as V
    }
    const val = generator(key, ...otherArgs)
    map.set(key, val)
    return val
  }
}

// Descriptor
// -----------------------------------------------------------------------------

export function createNameDescriptors(name: string) {
  return createPropDescriptors({ name }, true)
}

export function createPropDescriptors(
  propVals: { [propName: string]: unknown },
  readonly?: boolean,
): PropertyDescriptorMap {
  return mapProps(
    (value) => ({
      value,
      configurable: true,
      writable: !readonly,
    }),
    propVals,
  )
}

export function createGetterDescriptors(getters: {
  [propName: string]: () => unknown
}): PropertyDescriptorMap {
  return mapProps(
    (getter) => ({
      get: getter,
      configurable: true,
    }),
    getters,
  )
}

export function createStringTagDescriptors(value: string): {
  // crazy
  [Symbol.toStringTag]: {
    value: string
    configurable: true
  }
} {
  return {
    [Symbol.toStringTag]: {
      value,
      configurable: true,
    },
  }
}

// Props
// -----------------------------------------------------------------------------

export type FilterPropValues<P, F> = {
  [K in keyof P as P[K] extends F ? K : never]: P[K]
}

export function zipProps<P>(propNamesRev: (keyof P)[], args: P[keyof P][]): P {
  const res = {} as any
  let i = propNamesRev.length

  for (const arg of args) {
    res[propNamesRev[--i]] = arg
  }

  return res
}

/*
TODO: abandon this? See mapPropNames note.
*/
export function mapProps<P, R, E = undefined>(
  transformer: (propVal: P[keyof P], propName: keyof P, extraArg?: E) => R,
  props: P,
  extraArg?: E,
): { [K in keyof P]: R } {
  const res = {} as { [K in keyof P]: R }

  for (const propName in props) {
    res[propName] = transformer(props[propName], propName, extraArg)
  }

  return res
}

/*
TODO: audit uses of this contributing to HIGHER bundle size. Just inline? Often more readable.
See createAdapterCompoundOps/createAdapterOps. Bigger after using mapPropNames.
*/
export function mapPropNames<P, R, E = undefined>(
  generator: (propName: keyof P, i: number, extraArg?: E) => R,
  propNames: (keyof P)[],
  extraArg?: E,
): { [K in keyof P]: R } {
  const props = {} as { [K in keyof P]: R }

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    props[propName] = generator(propName, i, extraArg)
  }

  return props
}

export const mapPropNamesToIndex = bindArgs(
  mapPropNames,
  (_propVal: any, i: number) => i,
) as <P>(propNames: (keyof P)[]) => { [K in keyof P]: number }

export const mapPropNamesToConstant = bindArgs(
  mapPropNames,
  (_propVal: unknown, _i: number, constant: unknown) => constant,
) as <P, C>(propNames: (keyof P)[], c: C) => { [K in keyof P]: C }

export function remapProps<O, N>(
  oldNames: (keyof O)[],
  newNames: (keyof N)[],
  oldProps: O,
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

export function excludePropsByName<P, K extends keyof P>(
  propNames: Set<string>,
  props: P,
): Omit<P, K> {
  const filteredProps = {} as any

  for (const propName in props) {
    if (!propNames.has(propName)) {
      filteredProps[propName] = props[propName]
    }
  }

  return filteredProps
}

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
  names: (keyof P)[],
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
  names: (keyof P)[],
): boolean {
  for (const name of names) {
    if (!(name in props)) {
      return false
    }
  }
  return true
}

export function allPropsEqual(
  propNames: string[],
  props0: any,
  props1: any,
): boolean {
  for (const propName of propNames) {
    if (props0[propName] !== props1[propName]) {
      return false
    }
  }
  return true
}

// Function
// -----------------------------------------------------------------------------

export function bindArgs<BA extends any[], DA extends any[], R>(
  f: (...args: [...BA, ...DA]) => R,
  ...boundArgs: BA
): (...dynamicArgs: DA) => R {
  return (...dynamicArgs: DA) => {
    return f(...boundArgs, ...dynamicArgs)
  }
}

export function identity<T>(arg: T): T {
  return arg
}

export function noop(): void {}

// String / Formatting
// -----------------------------------------------------------------------------

export function capitalize(s: string): string {
  return s[0].toUpperCase() + s.substring(1)
}

/*
Easier to mark pure than calling .slice().sort() directly, which has 2 calls
*/
export function sortStrings<T extends string>(strs: T[]): T[] {
  return strs.slice().sort()
}

export function padNumber(digits: number, num: number): string {
  return String(num).padStart(digits, '0')
}

export const padNumber2 = bindArgs(padNumber, 2)

// Number
// -----------------------------------------------------------------------------

export type NumberSign = -1 | 0 | 1

/*
-1 if a comes before b
 0 if equal
 1 if a comes after b
*/
export function compareNumbers(a: number, b: number): NumberSign {
  return Math.sign(a - b) as NumberSign
}

/*
min/max are inclusive
*/
export function clampNumber(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

export function divModFloor(num: number, divisor: number): [number, number] {
  const quotient = Math.floor(num / divisor)
  const remainder = modFloor(num, divisor)
  return [quotient, remainder]
}

export function modFloor(num: number, divisor: number): number {
  return ((num % divisor) + divisor) % divisor
}

export function divModTrunc(num: number, divisor: number): [number, number] {
  return [divTrunc(num, divisor), modTrunc(num, divisor)]
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
  return num % divisor || 0
}

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
  return hasHalf(num) ? Math.trunc(num) || 0 : Math.round(num)
}

export function roundHalfEven(num: number): number {
  return hasHalf(num)
    ? (num = Math.trunc(num) || 0) + (num % 2)
    : Math.round(num)
}

function hasHalf(num: number): boolean {
  return Math.abs(num % 1) === 0.5
}
