import { toTemporalInstant } from './classApi/instant'
import { DateTimeFormat } from './classApi/intlDateTimeFormat'
import { Temporal } from './classApi/temporal'
import { createPropDescriptors } from './internal/utils'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(
  Date.prototype,
  createPropDescriptors({ toTemporalInstant }),
)
