import { ValueOf } from '../utils/obj'
import { OVERFLOW_REJECT, OverflowHandlingInt } from './overflowHandling'

export function createParser<Map>(nameForError: string, map: Map, defaultVal?: ValueOf<Map>): (
  arg: keyof Map | undefined,
  runtimeDefaultVal?: ValueOf<Map>
) => ValueOf<Map> {
  return (input: keyof Map | undefined, runtimeDefaultVal?: ValueOf<Map>): ValueOf<Map> => {
    if (input == null) {
      const d = runtimeDefaultVal ?? defaultVal
      if (d == null) {
        throw new Error(`Must specify a ${nameForError}`)
      }
      return d
    }
    if (map[input] == null) {
      throw new Error(`Invalid ${nameForError}: ${input}`) // TODO: RangeError?
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
  if (val == null) {
    return min
  }
  const newVal = Math.min(Math.max(val, min), max) // will cast to number
  if (newVal !== val && overflowHandling === OVERFLOW_REJECT) {
    throw new Error('Invalid overflowed value ' + val)
  }
  return newVal
}

export function refineFields<Map extends { [fieldName: string]: (input: unknown) => any }>(
  input: { [FieldName in keyof Map]?: unknown },
  refinerMap: Map,
  fieldBlacklist: string[] = [],
): { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } {
  const res: { [FieldName in keyof Map]?: ReturnType<Map[FieldName]> } = {}
  let cnt = 0

  for (const fieldName in refinerMap) {
    if (input[fieldName] != null) {
      res[fieldName] = refinerMap[fieldName](input[fieldName])
      cnt++
    }
  }

  if (!cnt) {
    throw new Error('Invalid object, no keys')
  }

  for (const fieldName of fieldBlacklist) {
    if (input[fieldName] != null) {
      throw new Error(`Disallowed field ${fieldName}`)
    }
  }

  return res
}
