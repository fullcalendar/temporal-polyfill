import type { Temporal } from 'temporal-spec'

export const NativeTemporal: typeof Temporal | undefined = (globalThis as any)
  .Temporal
