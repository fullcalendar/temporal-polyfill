import { it } from 'vitest'
import { NativeTemporal } from '../nativeSwitch'

export * from './shim/testUtils'

// The funcApi workspace tests the adapter selected for the current host. Key
// native-only skips off that adapter switch, not a hard-coded Node version.
export const isNative = Boolean(NativeTemporal)
export const itSkipNative = it.skipIf(isNative)

/*
Builds an options object whose one option is a getter, and returns it with a
function that reports how many times the getter ran. Both branches of the
function API read each option exactly once, like the class API. Only the count
is checked: the native branch doesn't keep the spec's order of reads.
*/
export function withCountedOption<O extends object>(
  options: O,
  optionName: string,
  value: unknown,
): [options: O, getReadCount: () => number] {
  let readCount = 0
  Object.defineProperty(options, optionName, {
    enumerable: true,
    get() {
      readCount++
      return value
    },
  })
  return [options, () => readCount]
}
