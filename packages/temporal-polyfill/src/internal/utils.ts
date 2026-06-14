import * as TemporalUtils from 'temporal-utils/protected'
import * as errorMessages from './errorMessages'
import { Overflow } from './optionsModel'

export const constrainToRange: (
  num: number,
  min: number,
  max: number,
) => number = TemporalUtils.constrainToRange

export const isObjectLike: (arg: unknown) => arg is {} =
  TemporalUtils.isObjectLike

// Types
// -----------------------------------------------------------------------------

/*
For programmatically-generated functions that have overly-complex inferred types
*/
export type Callable = (...args: any[]) => any

export type Classlike = any

// Validation
// -----------------------------------------------------------------------------

export function throwRangeError(message: string): never {
  throw new RangeError(message)
}

export function throwTypeError(message: string): never {
  throw new TypeError(message)
}

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
  const clamped = constrainToRange(num, min, max)

  if (overflow && num !== clamped) {
    throwRangeError(
      errorMessages.numberOutOfRangeWithChoices(
        entityName,
        num,
        min,
        max,
        choices,
      ),
    )
  }

  return clamped
}

export function getDefinedProp(props: any, propName: string): any {
  const propVal = props[propName]
  if (propVal === undefined) {
    throwTypeError(errorMessages.missingField(propName))
  }
  return propVal
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
// Using const arrow functions is good for min+gzip for some reason. Not always

export const createNameDescriptors = (name: string) =>
  createPropDescriptors({ name }, true)

export const createPropDescriptors = (
  propVals: { [propName: string]: unknown },
  readonly?: boolean,
): PropertyDescriptorMap =>
  mapProps(
    (value) => ({
      value,
      configurable: true,
      writable: !readonly,
    }),
    propVals,
  )

export const createStringTagDescriptors = (
  value: string,
): {
  // crazy
  [Symbol.toStringTag]: {
    value: string
    configurable: true
  }
} => ({
  [Symbol.toStringTag]: {
    value,
    configurable: true,
  },
})

// Props
// -----------------------------------------------------------------------------

export type FilterPropValues<P, F> = {
  [K in keyof P as P[K] extends F ? K : never]: P[K]
}

// transformer goes first because usually constant and minifies better
export function mapProps<P, R>(
  transformer: (propVal: P[keyof P], propName: keyof P) => R,
  props: P,
): { [K in keyof P]: R } {
  const res = {} as { [K in keyof P]: R }

  for (const propName in props) {
    res[propName] = transformer(props[propName], propName)
  }

  return res
}

// zips key-array AND value-generator into an object
export function zipPropsGenerator<P, R>(
  propNames: (keyof P)[],
  propValGenerator: (propName: keyof P, i: number) => R,
): { [K in keyof P]: R } {
  let i = 0
  const props = {} as { [K in keyof P]: R }

  for (const propName of propNames) {
    props[propName] = propValGenerator(propName, i++)
  }

  return props
}

// zips key-array AND value-constant into an object
export function zipPropsConst<P, C>(
  propNames: (keyof P)[],
  propVal: C,
): { [K in keyof P]: C } {
  const res = {} as any

  for (const propName of propNames) {
    res[propName] = propVal
  }

  return res
}

// zips descending-order-key-array AND value-array into an object
// outputted object's keys are in reverse order from propNamesDesc
export function zipPropsDesc<P>(
  propNamesDesc: (keyof P)[],
  propVals: P[keyof P][],
): P {
  let i = propNamesDesc.length
  const res = {} as any

  for (const propVal of propVals) {
    res[propNamesDesc[--i]] = propVal
  }

  return res
}

export function pluckProps<P>(propNames: (keyof P)[], props: P): P
export function pluckProps<P, D extends object>(
  propNames: (keyof P)[],
  props: P,
  dest: D,
): P & D
export function pluckProps<P>(
  propNames: (keyof P)[],
  props: P,
  // Avoid inherited fields from Object.prototype pollution.
  // We give the resulting object to Intl.DateTimeFormat
  dest: any = Object.create(null),
): P {
  for (const propName of propNames) {
    dest[propName] = props[propName]
  }
  return dest
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

export function areNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (const [i, val] of a.entries()) {
    if (val !== b[i]) {
      return false
    }
  }

  return true
}

export function zeroOutProps(
  propNames: string[],
  clearUntilI: number,
  props: Record<string, number>,
): Record<string, number> {
  const copy = { ...props }

  for (let i = 0; i < clearUntilI; i++) {
    copy[propNames[i]] = 0
  }

  return copy
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

export function noop(): undefined {}

// String / Formatting
// -----------------------------------------------------------------------------

export function capitalize(s: string): string {
  return s[0].toUpperCase() + s.substring(1)
}

/*
Easier to mark pure than calling .slice().sort() directly, which has 2 calls.
Accepts multiple field-name lists so callers can avoid fabricating temporary
combined arrays before sorting.
*/
export function sortStrings<T extends string>(...strss: T[][]): T[] {
  return ([] as T[]).concat(...strss).sort()
}

export const signRegExpStr = '([+-])' // outer captures

// only afterDecimal captures
export const fractionRegExpStr = '(?:[.,](\\d{1,9}))?'

export function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`, 'i')
}

export function validateTimeSeparators(s: string): boolean {
  if (s[0] === 'T' || s[0] === 't') {
    s = s.slice(1)
  }

  const fractionIndex = s.search(/[.,]/)
  const main = fractionIndex < 0 ? s : s.slice(0, fractionIndex)
  const parts = main.split(':')

  if (parts.length === 1) {
    return /^(?:\d{2}|\d{4}|\d{6})$/i.test(main)
  }

  return (
    (parts.length === 2 || parts.length === 3) &&
    parts.every((part) => part.length === 2 && /^\d{2}$/i.test(part))
  )
}

export function parseSubsecNano(fracStr: string): number {
  return parseInt(fracStr.padEnd(9, '0'))
}

export function parseSign(s: string | undefined): number {
  return !s || s === '+' ? 1 : -1
}

export function parseInt0(s: string | undefined): number {
  return s === undefined ? 0 : parseInt(s)
}

export function padNumber(digits: number, num: number): string {
  return String(num).padStart(digits, '0')
}

export const padNumber2 = bindArgs(padNumber, 2)

// Number
// -----------------------------------------------------------------------------

// Internal helpers use this narrower sign type to document values that are
// computed by comparison/sign algorithms. Public APIs should expose plain
// `number`, matching temporal-spec and avoiding an exported utility type that
// consumers might rely on as part of the package contract.
export type NumberSign = -1 | 0 | 1

/*
-1 if a comes before b
 0 if equal
 1 if a comes after b
*/
export function compareNumbers(a: number, b: number): NumberSign {
  return Math.sign(a - b) as NumberSign
}

export function compareBigInts(a: bigint, b: bigint): NumberSign {
  return (a < b ? -1 : a > b ? 1 : 0) as NumberSign
}

// FYI, bigint division does trunc by default
export function divFloorBigInt(num: bigint, denom: bigint): bigint {
  const whole = num / denom
  const remainder = num % denom
  return remainder < 0n ? whole - 1n : whole
}

export function divModFloorBigInt(
  num: bigint,
  divisor: bigint,
): [bigint, bigint] {
  const quotient = divFloorBigInt(num, divisor)
  const remainder = num - quotient * divisor
  return [quotient, remainder]
}

export function divModFloor(num: number, divisor: number): [number, number] {
  const quotient = Math.floor(num / divisor)
  const remainder = modFloor(num, divisor)
  return [quotient, remainder]
}

export function modFloor(num: number, divisor: number): number {
  return ((num % divisor) + divisor) % divisor
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

// Fabricate a fraction safely away from 0.5 while preserving the exact
// before/on/after-half comparison.
export function fabricateNearHalfFraction(
  halfCompare: NumberSign,
  sign: NumberSign = 1,
): number {
  return sign * (0.5 + halfCompare / 5)
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
