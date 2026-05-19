import { createSlotClass } from '../../classApi/slotClass'
import { InstantRecordBranding } from '../common-branding'

export type InstantNativeRecord = any

export const [
  InstantNativeRecord,
  createInstantNativeRecord,
  getInstantNative,
] = createSlotClass(
  InstantRecordBranding,
  (epochNanoseconds: bigint) =>
    new (globalThis as any).Temporal.Instant(epochNanoseconds),
  (native) => native.toString(),
  {
    epochMilliseconds: (native: any) => native.epochMilliseconds,
    epochNanoseconds: (native: any) => native.epochNanoseconds,
  },
  {},
  {},
)
