import { DateTimeFormat } from '../apiHelpers/intlDateTimeFormat'
import { createPropDescriptors } from '../internal/utils'
import { toTemporalInstant } from './instant'
import { Temporal } from './temporal'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(
  Date.prototype,
  createPropDescriptors({ toTemporalInstant }),
)
