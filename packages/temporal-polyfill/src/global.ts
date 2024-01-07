import { createPropDescriptors } from './internal/utils'
import { DateTimeFormat, Temporal, toTemporalInstant } from './impl'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(Date.prototype, createPropDescriptors({ toTemporalInstant }))
