import { ValueOf } from '../utils/obj'
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
    if (map[input] === undefined) {
      throw new RangeError(`Invalid ${nameForError}: ${input}`)
    }
    return map[input]
  }
}

export function constrainValue( // will also cast to number
  val: number | undefined,
  min: number, // inclusive. serves as default
  max: number, // inclusive
  overflowHandling: OverflowHandlingInt,
): number {
  if (val === undefined) {
    return min
  }
  const newVal = Math.min(Math.max(val, min), max) // will cast to number
  if (newVal !== val && overflowHandling === OVERFLOW_REJECT) {
    throw new RangeError('Invalid overflowed value ' + val)
  }
  return newVal
}

export function refineFields<Map extends { [fieldName: string]: (input: unknown) => any }>(
  input: { [FieldName in keyof Map]?: unknown },
  refinerMap: Map,
): { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } {
  const res: { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } = {}
  let cnt = 0

  for (const fieldName in refinerMap) {
    if (input[fieldName] !== undefined) {
      res[fieldName] = refinerMap[fieldName](input[fieldName])
      cnt++
    }
  }

  if (!cnt) {
    throw new TypeError('Invalid object, no keys')
  }

  return res
}

export function ensureOptionsObj<OptionsType>(
  options: Partial<OptionsType> | undefined,
): Partial<OptionsType> {
  if (options === undefined) {
    return {}
  }
  if (typeof options !== 'object') {
    throw TypeError('options must be an object or undefined')
  }
  return options
}

const invalidOverrideFields = ['calendar', 'timeZone']

export function refineOverrideFields<Map extends { [fieldName: string]: (input: unknown) => any }>(
  input: { [FieldName in keyof Map]?: unknown },
  refinerMap: Map,
): { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } {
  for (const fieldName of invalidOverrideFields) {
    if (input[fieldName] !== undefined) {
      throw new RangeError(`Disallowed field ${fieldName}`)
    }
  }

  return refineFields(input, refinerMap)
}
