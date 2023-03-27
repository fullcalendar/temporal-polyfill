import { ValueOf } from '../utils/obj'
import { toString } from './fieldStr'
import { OVERFLOW_REJECT, OverflowHandlingInt } from './overflowHandling'

export function createOptionParser<Map>(propName: string, map: Map, defaultVal?: ValueOf<Map>): (
  options: Record<string, unknown> | undefined, // TODO: better type
  runtimeDefaultVal?: ValueOf<Map>,
) => ValueOf<Map> {
  const valueParser = createParser(propName, map, defaultVal)
  return (
    options: Record<string, unknown> | undefined,
    runtimeDefaultVal?: ValueOf<Map>,
  ) => {
    const ensured = ensureOptionsObj(options)
    return valueParser(ensured[propName] as any, runtimeDefaultVal)
  }
}

export function createParser<Map>(nameForError: string, map: Map, defaultVal?: ValueOf<Map>): (
  arg: keyof Map | undefined,
  runtimeDefaultVal?: ValueOf<Map>
) => ValueOf<Map> {
  return (
    input: keyof Map | undefined,
    runtimeDefaultVal?: ValueOf<Map>,
  ): ValueOf<Map> => {
    if (input === undefined) {
      const d = runtimeDefaultVal ?? defaultVal
      if (d === undefined) {
        throw new RangeError(`Must specify a ${nameForError}`)
      }
      return d
    }
    const strInput = toString(input) as keyof Map
    if (map[strInput] === undefined) {
      throw new RangeError(`Invalid ${nameForError}: ${String(input)}`)
    }
    return map[strInput]
  }
}

// TODO: better error messages for invalid properties
export function constrainInt(
  val: number | undefined,
  min: number, // inclusive. serves as default
  max: number, // inclusive
  overflowHandling: OverflowHandlingInt,
): number {
  if (val === undefined) {
    return min
  }

  if (!Number.isFinite(val)) {
    throw new RangeError('Number must be finite')
  }

  // convert floating-point to integer
  val = Math.trunc(val)

  const newVal = Math.min(Math.max(val, min), max)
  if (newVal !== val && overflowHandling === OVERFLOW_REJECT) {
    throw new RangeError('Invalid overflowed value ' + val)
  }

  return newVal
}

export function refineFields<Map extends { [fieldName: string]: (input: unknown) => any }>(
  input: { [FieldName in keyof Map]?: unknown },
  refinerMap: Map,
  isRequiredMap: any = {},
): { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } {
  const res: any = {}

  // guarantees strict order
  // very suboptimal!
  const fieldNames = Object.keys(refinerMap).sort()

  for (const fieldName of fieldNames) {
    const val = input[fieldName] // only query once

    if (val === undefined) {
      if (isRequiredMap[fieldName]) {
        throw new TypeError(`Prop ${fieldName} is required`)
      }
    } else {
      res[fieldName] = refinerMap[fieldName](val)
    }
  }

  return res
}

export function ensureOptionsObj<OptionsType>(
  options: Partial<OptionsType> | undefined,
  strict?: boolean,
): Partial<OptionsType> {
  if (options === undefined && !strict) {
    return {}
  }
  if (!isObjectLike(options)) {
    throw TypeError('options must be an object or undefined')
  }
  return options
}

const objectLikeTypeRE = /object|function/

export function isObjectLike(v: any): v is Record<string, unknown> {
  return v !== null && objectLikeTypeRE.test(typeof v)
}
