import { it } from 'vitest'
import { NativeTemporal } from '../nativeSwitch'

export * from './shim/testUtils'

// The funcApi workspace tests the adapter selected for the current host. Key
// native-only skips off that adapter switch, not a hard-coded Node version.
export const isNative = Boolean(NativeTemporal)
export const itSkipNative = it.skipIf(isNative)
