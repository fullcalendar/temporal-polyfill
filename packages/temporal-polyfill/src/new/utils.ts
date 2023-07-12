import { Overflow } from './options'

const objectlikeRE = /object|function/

export function isObjectlike(arg: unknown): boolean {
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

export type PropsRefinerMap<P, V> = {
  [K in keyof P]: (propVal: P[K], propName: K) => V
}

export const mapPropsWithRefiners = mapProps.bind(
  undefined,
  (propVal: any, propName: string, refinerMap: any) => refinerMap[propName](propVal, propName),
) as (
  <P, V>(props: P, refinerMap: PropsRefinerMap<P, V>) => { [K in keyof P]: V }
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
  (propVal: any, i: number, extra: any) => extra,
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

export const excludePropsByName = filterProps.bind(
  undefined,
  (propVal: any, propName: string, nameSet: any) => !nameSet.has(propName)
) as (
  <P, K extends keyof P>(props: P, propNames: K[]) => Pick<P, K>
)

export const excludeUndefinedProps = filterProps.bind(
  undefined,
  (propVal: any) => propVal !== undefined,
) as (
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

export function createLazyGenerator<Key, Val, OtherArgs extends any[]>(
  generator: (key: Key, ...otherArgs: OtherArgs) => Val,
  MapClass: { new(): Map<Key, Val> } = Map,
): (key: Key, ...otherArgs: OtherArgs) => Val {
  const map = new MapClass()

  return (key: Key, ...otherArgs: OtherArgs) => {
    if (map.has(key)) {
      return map.get(key)!
    } else {
      const val = generator(key, ...otherArgs)
      map.set(key, val)
      return val
    }
  }
}

// descriptor stuff
// ----------------

export function defineProps<Target, PropVals>(
  target: Target,
  propVals: Record<PropertyKey, unknown>,
): Target & PropVals {
  return Object.defineProperties(target, createPropDescriptors(propVals)) as (Target & PropVals)
}

export function createPropDescriptors(
  propVals: Record<PropertyKey, unknown>,
): PropertyDescriptorMap {
  return mapProps((value) => ({
    value,
    configurable: true,
    writable: true,
  }), propVals)
}

export function createGetterDescriptors(
  getters: Record<PropertyKey, () => unknown>,
): PropertyDescriptorMap {
  return mapProps((getter) => ({
    get: getter,
    configurable: true,
  }), getters)
}

export function createTemporalNameDescriptors(temporalName: string): PropertyDescriptorMap {
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

export function compareProps<Props extends Record<PropertyKey, number>>(
  propNames: (keyof Props)[],
  props0: Props,
  props1: Props,
): NumSign {
  for (const propName of propNames) {
    const cmp = compareNumbers(props0[propName], props1[propName])
    if (cmp) {
      return cmp
    }
  }
  return 0
}

/*
min/max are inclusive
*/
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow?: Overflow.Constrain,
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow: Overflow | Overflow.Reject,
  noun: string,
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflow: -1, // for returning undefined
): number | undefined
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
