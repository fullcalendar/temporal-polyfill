import { it } from 'vitest'
import { NativeTemporal } from '../nativeSwitch'

export * from './shim/testUtils'

// The funcApi workspace runs the same tests against both the forced-shim and
// native adapters when host Temporal exists. Key native-only skips off the
// adapter switch, not the Node version, so forced-shim coverage remains intact.
export const isNative = Boolean(NativeTemporal)
export const itSkipNative = it.skipIf(isNative)
