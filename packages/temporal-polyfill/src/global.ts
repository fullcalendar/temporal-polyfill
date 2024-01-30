import { DateTimeFormat, Temporal, toTemporalInstant } from './impl'
import { createPropDescriptors } from './internal/utils'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(
  Date.prototype,
  createPropDescriptors({ toTemporalInstant }),
)
