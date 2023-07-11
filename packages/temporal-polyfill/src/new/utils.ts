const objectlikeRE = /object|function/

export function isObjectlike(arg: unknown): boolean {
  return arg !== null && objectlikeRE.test(typeof arg)
}

export function mapProps<P, V, E = undefined>(
  transformer: (propVal: P[keyof P], propName: keyof P, extraArg?: E) => V,
  props: P,
  extraArg?: E,
): { [K in keyof P]: V } {
  const res = {} as { [K in keyof P]: V }

  for (const propName in props) {
    res[propName] = transformer(props[propName], propName, extraArg)
  }

  return res
}

export type PropsRefinerMap<P, V> = {
  [K in keyof P]: (propVal: P[K], propName: K) => V
}

export const mapPropsWithRefiners: <P, V>(
  props: P,
  refinerMap: PropsRefinerMap<P, V>
) => {
  [K in keyof P]: V
} = (mapProps as any).bind(undefined, <P, V>(
  propVal: P[keyof P],
  propName: keyof P,
  refinerMap: PropsRefinerMap<P, V>,
) => {
  return refinerMap[propName](propVal, propName)
})

export function mapPropNames<P, E = never>(
  generator: (propName: keyof P, i: number, extraArg?: E) => P[keyof P],
  propNames: (keyof P)[],
  extraArg?: E,
): P {
  const props = {} as P

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i]
    props[propName] = generator(propName, i, extraArg)
  }

  return props
}

// TODO: used?
export const mapPropNamesToIndex: <P>(
  propNames: (keyof P)[],
) => {
  [K in keyof P]: number
} = (mapProps as any).bind(undefined, <P>(
  propName: keyof P,
  i: number,
) => i)

export const mapPropNamesToConstant: <P, V>(
  propNames: (keyof P)[],
  val: V
) => {
  [K in keyof P]: V
} = (mapProps as any).bind(undefined, <P, V>(
  propName: keyof P,
  i: number,
  val: V,
) => val)

export function remapProps<OldProps, NewProps>(
  oldPropNames: (keyof OldProps)[],
  newPropNames: (keyof NewProps)[],
  oldProps: OldProps,
): NewProps {
  const newProps = {} as NewProps

  for (let i = 0; i < oldPropNames.length; i++) {
    newProps[newPropNames[i]] = oldProps[oldPropNames[i]] as any
  }

  return newProps
}

export function pluckProps<Props, PropName extends keyof Props>(
  propNames: PropName[],
  props: Props,
): Pick<Props, PropName> {
  const res = {} as Pick<Props, PropName>

  for (const propName of propNames) {
    res[propName] = props[propName]
  }

  return res
}

export function excludeArrayDuplicates<Item>(a: Item[]): Item[] {
  return [...new Set(a)]
}

function filterProps<Props, ExtraArg>(
  filterFunc: (
    propVal: Props[keyof Props],
    propName: keyof Props,
    extraArg: ExtraArg
  ) => boolean,
  props: Props,
  extraArg?: ExtraArg,
) {
  const filteredProps = {} as Props

  for (const propName in props) {
    const propVal = props[propName]

    if (filterFunc(propVal, propName, extraArg as ExtraArg)) {
      filteredProps[propName] = propVal
    }
  }

  return filteredProps
}

export const excludePropsByName = filterProps.bind(
  undefined,
  (propVal, propName, nameSet: any) => !nameSet.has(propName),
) as <Props, PropName extends keyof Props>(
  props: Props,
  propNames: Set<PropName>,
) => Omit<Props, PropName>

export const excludeUndefinedProps = filterProps.bind(
  undefined,
  (propVal) => propVal !== undefined,
) as <Props>(props: Props) => Partial<Props>

export function hasAnyPropsByName<Props>(
  props: Props,
  names: (keyof Props)[],
): boolean {
  for (const name of names) {
    if (props[name] !== undefined) {
      return true
    }
  }
  return false
}

export function hasAllPropsByName<Props>(
  props: Props,
  names: (keyof Props)[],
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

export function clamp(
  num: number,
  min: number,
  max: number,
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflowBehavior: 1,
  noun: string,
): number
export function clamp(
  num: number,
  min: number,
  max: number,
  overflowBehavior: 2,
): number | undefined
export function clamp(
  num: number,
  min: number, // inclusive
  max: number, // inclusive
  overflowBehavior: (0 | 1 | 2) = 0, // TODO: better enum - 0/1/2 --- overflow enum
  noun?: string,
): number | undefined {
  const clamped = Math.min(Math.max(num, min), max)

  if (overflowBehavior && num !== clamped) {
    if (overflowBehavior === 2) {
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
