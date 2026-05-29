import type { Temporal } from 'temporal-spec'

declare const __FORCE_SHIM_IMPLEMENTATION__: boolean | undefined

// Build and test tooling can replace this token before module evaluation.
// Keeping the override at this chokepoint lets every branch-selection import
// bind consistently, instead of relying on per-test global mutation.
const forceShimImplementation =
  typeof __FORCE_SHIM_IMPLEMENTATION__ === 'boolean'
    ? __FORCE_SHIM_IMPLEMENTATION__
    : false

export const NativeTemporal: typeof Temporal | undefined =
  forceShimImplementation ? undefined : (globalThis as any).Temporal
